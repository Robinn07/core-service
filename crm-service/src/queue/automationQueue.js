const { Queue } = require('bullmq');
const connection = require('../config/redis');

const automationQueue = new Queue('automation-engine', { connection });

module.exports = automationQueue;
