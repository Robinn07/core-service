// ingestion-service/server.js
// Getloopx Ingestion Gateway | Port 3000

// Initialize instrumentation first
require('./instrumentation');

const express = require('express');
const Joi     = require('joi');
const { v4: uuidv4 } = require('uuid');
const amqp    = require('amqplib');
const { apiKeyAuth } = require('./auth');
const rateLimiter = require('./src/middleware/rateLimiter');
const { getRabbitMQUrl } = require('./src/utils/config/loader');
const api = require('@opentelemetry/api');
const client = require('prom-client');
const redisClient = require('./src/config/redis');

// ── Prometheus Metrics Setup ─────────────────────────────────────
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'getloopx_ingestion_' });

const eventsCounter = new client.Counter({
  name: 'getloopx_ingestion_events_total',
  help: 'Total events tracked',
  labelNames: ['org_id', 'channel', 'event_type']
});

const redisConnGauge = new client.Gauge({
  name: 'getloopx_ingestion_redis_connections',
  help: 'Active Redis connections'
});

const queueDepthGauge = new client.Gauge({
  name: 'getloopx_ingestion_rabbitmq_queue_depth',
  help: 'Current depth of the event_ingestion queue'
});

const logger = require('pino')({
  mixin() {
    const span = api.trace.getSpan(api.context.active());
    if (span) {
      const { traceId } = span.spanContext();
      return { trace_id: traceId };
    }
    return {};
  }
});

const pinoHttp = require('pino-http')({ 
  logger,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      org_id: req.tenantId || req.headers['x-org-id']
    })
  }
});
require('dotenv').config();

const cors = require('cors');

const app = express();
app.use(express.json());

// ── Security: CORS Origin Validation ─────────────────────────────
const corsOptions = {
  origin: function (origin, callback) {
    // In production, you'd check this against a database of authorized domains
    // For now, allow local dev and a wildcard (to be refined via dashboard)
    const whitelist = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:4000'];
    if (!origin || whitelist.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization']
};
app.use(cors(corsOptions));

app.use(pinoHttp);

const QUEUE_NAME = 'event_ingestion';
const DLX_NAME = 'event_ingestion_dlx';
const FAILED_QUEUE = 'failed_events_queue';
let channel;

// ── RabbitMQ Connection ──────────────────────────────────────────
async function initRabbitMQ() {
  try {
    const connection = await amqp.connect(getRabbitMQUrl());
    channel = await connection.createChannel();
    
    await channel.assertExchange(DLX_NAME, 'direct', { durable: true });
    await channel.assertQueue(FAILED_QUEUE, { durable: true });
    await channel.bindQueue(FAILED_QUEUE, DLX_NAME, 'failed');

    await channel.assertQueue(QUEUE_NAME, { 
      durable: true,
      arguments: {
        'x-dead-letter-exchange': DLX_NAME,
        'x-dead-letter-routing-key': 'failed',
        'x-max-priority': 10
      }
    });

    logger.info('✅ Connected to RabbitMQ with DLX configuration');

    // Periodically update queue depth metric
    setInterval(async () => {
      try {
        const queueInfo = await channel.checkQueue(QUEUE_NAME);
        queueDepthGauge.set(queueInfo.messageCount);
      } catch (err) {
        logger.error({ err }, 'Failed to check queue depth');
      }
    }, 5000);

  } catch (err) {
    logger.error({ err }, '❌ RabbitMQ Connection Error');
    setTimeout(initRabbitMQ, 5000);
  }
}
initRabbitMQ();

// Update Redis metric
setInterval(() => {
  if (redisClient.status === 'ready') {
    redisConnGauge.set(1);
  } else {
    redisConnGauge.set(0);
  }
}, 5000);

// ── Valid events per channel ────────────────────────────────────
const VALID_EVENTS = {
  EMAIL:    ['email_sent','email_delivered','email_opened','link_clicked','bounced','unsubscribed','spam_reported'],
  SMS:      ['sms_sent','sms_delivered','link_clicked','replied','unsubscribed'],
  WHATSAPP: ['whatsapp_sent','whatsapp_delivered','whatsapp_read','replied','link_clicked','unsubscribed'],
  PUSH:     ['push_sent','push_delivered','push_clicked','push_dismissed'],
};

// ── Joi Schema ──────────────────────────────────────────────────
const eventSchema = Joi.object({
  orgId:      Joi.string().required(),
  userId:     Joi.string().required(),
  event_type: Joi.string().required(),
  channel:    Joi.string().valid('EMAIL','SMS','WHATSAPP','PUSH').required(),
  campaignId: Joi.string().required(),
  ab_variant: Joi.string().valid('A','B').allow(null).default(null),
  metadata:   Joi.object({
    device:   Joi.string().optional(),
    country:  Joi.string().optional(),
    link_url: Joi.string().uri().optional(),
    is_bot:   Joi.boolean().optional().default(false),
  }).default({}),
});

// ── Metrics Endpoint ───────────────────────────────────────────
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// ── POST /track-event ───────────────────────────────────────────
app.post('/track-event', apiKeyAuth, rateLimiter(), async (req, res) => {
  const { error, value } = eventSchema.validate(req.body);

  if (error) return res.status(422).json({ error: error.details[0].message });

  if (value.orgId !== req.tenantId) {
    logger.error({ bodyOrg: value.orgId, authTenant: req.tenantId }, 'Org ID mismatch');
    return res.status(403).json({ error: 'Org ID mismatch' });
  }

  const allowed = VALID_EVENTS[value.channel];
  if (!allowed.includes(value.event_type)) {
    return res.status(422).json({ error: 'Invalid event_type for channel' });
  }

  const event = {
    ...value,
    event_id: uuidv4(),
    timestamp: new Date().toISOString(),
  };

  try {
    const sent = channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(event)), { 
      persistent: true,
      headers: { 'traceparent': api.trace.getSpan(api.context.active())?.spanContext().traceId }
    });
    if (!sent) throw new Error('Queue buffer full');
    
    eventsCounter.inc({ org_id: event.orgId, channel: event.channel, event_type: event.event_type });
    logger.info({ orgId: event.orgId, eventType: event.event_type, eventId: event.event_id }, 'Event queued');
    return res.status(202).json({ status: 'accepted', event_id: event.event_id });
  } catch (err) {
    logger.error({ err, orgId: value.orgId, event_id: event.event_id }, 'Failed to queue event');
    return res.status(503).json({ error: 'Service Unavailable', message: 'Failed to queue event' });
  }
});

// ── Health Check ────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    service: 'getloopx-ingestion',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dependencies: { rabbitmq: 'unknown', redis: redisClient.status }
  };
  try {
    if (channel && channel.connection) health.dependencies.rabbitmq = 'connected';
    else { health.status = 'error'; health.dependencies.rabbitmq = 'disconnected'; }
  } catch (err) { health.status = 'error'; health.dependencies.rabbitmq = `error: ${err.message}`; }
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

app.use((err, req, res, next) => {
  logger.error({ err }, 'Unhandled Global Error');
  res.status(500).json({ error: err.message });
});

// ── POST /s2s/convert ───────────────────────────────────────────
app.post('/s2s/convert', apiKeyAuth, async (req, res) => {
  const s2sSchema = Joi.object({
    orgId:      Joi.string().required(),
    userId:     Joi.string().optional(),
    email:      Joi.string().email().optional(),
    event_type: Joi.string().required(),
    campaignId: Joi.string().optional(), // If known
    metadata:   Joi.object().default({}),
  }).or('userId', 'email');

  const { error, value } = s2sSchema.validate(req.body);
  if (error) return res.status(422).json({ error: error.details[0].message });

  // If email is provided but no userId, we can flag this for the worker to resolve
  // or just pass it through as userId = email for now (common practice)
  const event = {
    orgId: value.orgId,
    userId: value.userId || value.email,
    event_type: value.event_type,
    channel: 'S2S',
    campaignId: value.campaignId || 'S2S_UNSPECIFIED',
    metadata: { ...value.metadata, s2s: true },
    event_id: uuidv4(),
    timestamp: new Date().toISOString(),
  };

  try {
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(event)), { persistent: true });
    return res.status(202).json({ status: 'accepted', event_id: event.event_id });
  } catch (err) {
    return res.status(503).json({ error: 'Failed to queue S2S event' });
  }
});

app.listen(3000, () => logger.info('✅ Getloopx Ingestion live on port 3000'));
