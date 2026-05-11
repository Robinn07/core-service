const { Worker } = require('bullmq');
const connection = require('../config/redis');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

/**
 * AI Worker
 * Handles heavy computation tasks for the AI Intelligence Layer.
 */
const aiWorker = new Worker('ai-tasks', async job => {
  if (job.name === 'batch-churn-prediction') {
    const { orgId } = job.data;
    if (!orgId) throw new Error('orgId is required for churn prediction');
    return aiService.predictOrgChurn(orgId);
  }

  if (job.name === 'batch-sto-calculation') {
    const { orgId } = job.data;
    if (!orgId) throw new Error('orgId is required for STO calculation');
    return aiService.calculateOrgSTO(orgId);
  }

  if (job.name === 'batch-lead-scoring') {
    const { orgId } = job.data;
    if (!orgId) throw new Error('orgId is required for lead scoring');
    return aiService.calculateOrgLeadScores(orgId);
  }

  if (job.name === 'batch-audience-clustering') {
    const { orgId } = job.data;
    if (!orgId) throw new Error('orgId is required for clustering');
    return aiService.updateOrgAIProfiles(orgId); // This runs churn, lead score, STO and then segmentation
  }

  if (job.name === 'single-churn-prediction') {
    const { subscriberId } = job.data;
    return aiService.calculateChurnScore(subscriberId);
  }
}, { 
  connection,
  concurrency: 2 // Allow processing 2 orgs in parallel
});

aiWorker.on('completed', job => {
  logger.info(`AI job ${job.id} of type ${job.name} completed.`);
});

aiWorker.on('failed', (job, err) => {
  logger.error(`AI job ${job.id} failed: ${err.message}`);
});

module.exports = aiWorker;
