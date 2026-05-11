const { Queue } = require('bullmq');
const connection = require('../config/redis');

const aiQueue = new Queue('ai-tasks', { connection });

module.exports = aiQueue;
