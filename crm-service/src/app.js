const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 0.2,
  profilesSampleRate: 0.1,
  beforeSend(event) {
    if (event.request && event.request.data) {
      delete event.request.data.password;
      delete event.request.data.apiKey;
      delete event.request.data.stripeToken;
      delete event.request.data.consentToken;
    }
    return event;
  }
});

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('./config/redis');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const { sequelize } = require('./config/db');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('./workers/emailWorker');
require('./workers/automationWorker');
require('./services/automationTriggerService');
require('./models');

const app = express();

// Sentry Request Handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

// 1. Security Headers
app.use(helmet());

// 2. CORS Configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Structured Logging Middleware
app.use(pinoHttp({ logger }));

// --- RATE LIMITERS (TASK 1) ---

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 500,
  message: { error: 'Tracking rate limit exceeded.' },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts.' },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// --- ROUTE REGISTRATION ---

// 1D. Webhooks (Exempt from Global Limiter)
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use('/api/webhooks', require('./routes/webhookRoutes'));
app.use('/api/ses', express.text({ type: 'text/plain' }), require('./routes/sesRoutes'));

// 1B. Tracking (High Rate)
app.use('/api/track/', trackingLimiter);

// 1C. Auth (Strict Rate)
app.use('/api/auth/', authLimiter);

// 1A. Global API Limiter (Apply to everything else in /api/)
app.use('/api/', globalLimiter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const axios = require('axios');

// Health Check
app.get('/health', async (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date(),
    checks: {
      database: 'DOWN',
      redis: 'DOWN',
      analytics: 'DOWN',
      ingestion: 'DOWN'
    }
  };

  // Internal Checks
  try {
    await sequelize.authenticate();
    health.checks.database = 'UP';
  } catch (err) {
    health.status = 'DEGRADED';
    health.checks.database = 'ERROR';
  }

  try {
    await redisClient.ping();
    health.checks.redis = 'UP';
  } catch (err) {
    health.status = 'DEGRADED';
    health.checks.redis = 'ERROR';
  }

  // Ecosystem Checks
  try {
    const analyticsRes = await axios.get(process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8081/health', { timeout: 2000 });
    health.checks.analytics = analyticsRes.data.status === 'ok' ? 'UP' : 'DEGRADED';
  } catch (err) {
    health.status = 'DEGRADED';
    health.checks.analytics = 'ERROR';
  }

  try {
    const ingestionRes = await axios.get(process.env.INGESTION_SERVICE_URL || 'http://localhost:3000/health', { timeout: 2000 });
    health.checks.ingestion = ingestionRes.data.status === 'ok' ? 'UP' : 'DEGRADED';
  } catch (err) {
    health.status = 'DEGRADED';
    health.checks.ingestion = 'ERROR';
  }

  const statusCode = health.status === 'UP' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/subscribers', require('./routes/subscriberRoutes'));
app.use('/api/lists', require('./routes/listRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/campaigns', require('./routes/campaignRoutes'));
app.use('/api/automations', require('./routes/automationRoutes'));
app.use('/api/webhooks', require('./routes/webhookRoutes'));
app.use('/api/outgoing-webhooks', require('./routes/outgoingWebhookRoutes'));
app.use('/api/track', require('./routes/trackingRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/domains', require('./routes/domainRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/api-keys', require('./routes/apiKeyRoutes'));
app.use('/api/forms', require('./routes/formRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));

// SES Webhook - Needs to handle text/plain from AWS SNS
app.use('/api/ses', express.text({ type: 'text/plain' }), require('./routes/sesRoutes'));

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

const cron = require('node-cron');
const { EventLog } = require('./models');
const { Op } = require('sequelize');

// Nightly EventLog Cleanup (90-day retention)
cron.schedule('0 2 * * *', async () => {
  logger.info('🧹 Starting nightly EventLog cleanup...');
  try {
    const deleted = await EventLog.destroy({
      where: {
        createdAt: {
          [Op.lt]: new Date(new Date() - 90 * 24 * 60 * 60 * 1000)
        }
      }
    });
    logger.info({ deleted }, '✅ EventLog cleanup completed');
  } catch (err) {
    logger.error({ err }, '❌ EventLog cleanup failed');
  }
});

// Generic Error Handler (must be after Sentry)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    error: err.message,
    sentry: res.sentry // Attach Sentry event ID if available
  });
});

module.exports = app;
