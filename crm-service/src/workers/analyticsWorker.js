const { Worker } = require('bullmq');
const connection = require('../config/redis');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

/**
 * Analytics Worker
 * Decoupled from the main delivery flow to ensure high-volume sends aren't 
 * slowed down by complex AI re-calculations.
 */
const worker = new Worker('analytics-queue', async job => {
  const { type, subscriberId, orgId } = job.data;

  try {
    switch (job.name) {
      case 'update-subscriber-ai':
        await aiService.updateFullAIProfile(subscriberId);
        break;
      
      case 'batch-org-ai':
        await aiService.updateOrgAIProfiles(orgId);
        break;

      case 'recalculate-lead-score':
        await aiService.calculateLeadScore(subscriberId);
        break;

      default:
        logger.warn(`Unknown analytics job type: ${job.name}`);
    }
  } catch (error) {
    logger.error({ error: error.message, job: job.id }, 'Analytics Worker Error');
    throw error;
  }
}, { 
  connection,
  concurrency: 10, // AI tasks are often I/O bound (DB queries), allow high concurrency
  limiter: {
    max: 100,
    duration: 1000 // Rate limit to 100 calculations per second to protect DB
  }
});

worker.on('completed', job => {
  logger.info(`Analytics Job ${job.id} completed`);
});

module.exports = worker;
