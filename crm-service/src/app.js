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
require('./models');

const app = express();

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

// 4. Rate Limiting (Redis-backed)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});
app.use('/api/', limiter);

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
app.use('/api/api-keys', require('./routes/apiKeyRoutes'));
app.use('/api/forms', require('./routes/formRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));

module.exports = app;
