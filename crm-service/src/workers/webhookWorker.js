const { Worker } = require('bullmq');
const axios = require('axios');
const crypto = require('crypto');
const connection = require('../config/redis');
const logger = require('../utils/logger');

const worker = new Worker('webhook-queue', async job => {
  const { url, payload, secret } = job.data;

  // 1. Sign the payload
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  // 2. Send the request
  try {
    await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-GetLoopX-Signature': signature,
        'X-GetLoopX-Event': payload.event
      },
      timeout: 10000 // 10 second timeout
    });
    logger.info({ url, event: payload.event, jobId: job.id }, '✅ Webhook delivered');
  } catch (error) {
    logger.error({ url, event: payload.event, error: error.message, jobId: job.id }, '❌ Webhook delivery failed');
    throw error; // Let BullMQ handle retries
  }
}, { 
  connection,
  settings: {
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  },
  attempts: 5,
  removeOnComplete: { count: 100 },
  removeOnFail: false // Keep for inspection
});

const Sentry = require('@sentry/node');

// Global BullMQ error handler
worker.on('failed', (job, err) => {
  Sentry.captureException(err, {
    tags: { worker: 'webhookWorker', jobId: job.id },
    extra: { jobData: job.data }
  });
  logger.error({ 
    jobId: job.id, 
    data: job.data, 
    error: err.message 
  }, '🚨 BullMQ Job Failed');
});

// Stalled job handler
worker.on('stalled', (jobId) => {
  logger.warn({ jobId, msg: 'Job stalled — possible worker crash or long-running sync' }, '⚠️ BullMQ Job Stalled');
});

module.exports = worker;
