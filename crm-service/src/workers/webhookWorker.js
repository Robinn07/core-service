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

  // 2. Circuit Breaker Check
  const circuitKey = `circuit_breaker:${url}`;
  const isBroken = await connection.get(circuitKey);
  if (isBroken) {
    logger.warn({ url }, '🚫 Circuit broken for this URL. Skipping...');
    return; // Silent fail to avoid infinite retries on a dead server
  }

  // 3. Send the request
  try {
    await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-GetLoopX-Signature': signature,
        'X-GetLoopX-Event': payload.event
      },
      timeout: 5000 // 5 second timeout
    });
    // Reset failures on success
    await connection.del(`failures:${url}`);
    logger.info({ url, event: payload.event }, '✅ Webhook delivered');
  } catch (error) {
    const failures = await connection.incr(`failures:${url}`);
    if (failures >= 3) {
      // Break the circuit for 10 minutes
      await connection.setex(circuitKey, 600, 'open');
      logger.error({ url }, '🔥 Circuit Breaker OPENED for 10 minutes');
    }
    
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
