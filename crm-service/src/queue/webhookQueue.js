const { Queue } = require('bullmq');
const connection = require('../config/redis');

const webhookQueue = new Queue('webhook-queue', { 
    connection,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 5000 // 5s, 25s, 125s...
        },
        removeOnComplete: 100, // keep last 100
        removeOnFail: 500, // keep last 500
        timeout: 10000 // 10 second timeout per webhook call
    }
});

module.exports = webhookQueue;
