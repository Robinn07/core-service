const { Queue } = require('bullmq');
const connection = require('../config/redis');

/**
 * Analytics Queue
 * Handles non-critical, heavy-computation AI tasks like Lead Scoring and Churn Prediction.
 */
const analyticsQueue = new Queue('analytics-queue', { connection });

module.exports = analyticsQueue;
