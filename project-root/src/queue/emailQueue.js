// src/queues/emailQueue.js
const { Queue } = require('bullmq');
const connection = require('../config/redis');

// Initialize the Queue with your Redis Cloud connection
const emailQueue = new Queue('email-queue', { connection });

module.exports = emailQueue;