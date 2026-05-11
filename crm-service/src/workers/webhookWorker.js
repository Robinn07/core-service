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
      timeout: 5000 // 5 second timeout
    });
    logger.info({ url, event: payload.event }, '✅ Webhook delivered');
  } catch (error) {
    logger.error({ url, event: payload.event, error: error.message }, '❌ Webhook delivery failed');
    throw error; // Let BullMQ handle retries
  }
}, { 
  connection,
  settings: {
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
});

module.exports = worker;
