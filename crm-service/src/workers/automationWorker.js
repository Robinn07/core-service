const { Worker } = require('bullmq');
const connection = require('../config/redis');
const automationService = require('../services/automationService');

const worker = new Worker('automation-engine', async job => {
  if (job.name === 'process-action') {
    const { actionId, subscriberId } = job.data;
    await automationService.executeAction(actionId, subscriberId);
  }
}, { connection });

worker.on('completed', job => {
  console.log(`Automation Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Automation Job ${job.id} failed: ${err.message}`);
});

module.exports = worker;
