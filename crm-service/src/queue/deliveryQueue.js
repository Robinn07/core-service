const { Queue } = require('bullmq');
const connection = require('../config/redis');

/**
 * Delivery Queue
 * A global queue strictly for dispatching pre-compiled email payloads to SES.
 * Used to enforce a global rate limit across all outbound emails.
 */
const deliveryQueue = new Queue('delivery-queue', { connection });

module.exports = deliveryQueue;
