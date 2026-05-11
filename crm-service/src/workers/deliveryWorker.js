const { Worker } = require('bullmq');
const connection = require('../config/redis');
const sesClient = require('../config/ses');
const { SendEmailCommand } = require("@aws-sdk/client-ses");
const { CampaignLog, Campaign } = require('../models');

/**
 * Delivery Worker
 * Enforces Global Rate Limiting (GRL).
 * 
 * Default: 14 emails/second (standard AWS SES Sandbox limit).
 */
const worker = new Worker('delivery-queue', async job => {
  const { htmlBody, subject, recipient, logId, campaignId } = job.data;

  const command = new SendEmailCommand({
    Destination: { ToAddresses: [recipient] },
    Message: {
      Body: { Html: { Data: htmlBody, Charset: "UTF-8" } },
      Subject: { Data: subject, Charset: "UTF-8" },
    },
    Source: process.env.SES_FROM_EMAIL,
  });

  try {
    const response = await sesClient.send(command);
    
    // Update log
    const log = await CampaignLog.findByPk(logId);
    if (log) {
      await log.update({ 
        messageId: response.MessageId,
        status: 'SENT' 
      });
    }

    // Increment campaign stats
    if (campaignId) {
      await Campaign.increment('sentCount', { where: { id: campaignId } });
    }

  } catch (error) {
    console.error(`[DeliveryWorker] Failed to send to ${recipient}:`, error.message);
    const log = await CampaignLog.findByPk(logId);
    if (log) {
      await log.update({ 
        status: 'FAILED',
        error: error.message 
      });
    }
    throw error; // Let BullMQ handle retry if needed
  }
}, {
  connection,
  concurrency: 50, // High concurrency to saturate the rate limiter
  limiter: {
    max: parseInt(process.env.SES_RATE_LIMIT || '14'),
    duration: 1000
  }
});

module.exports = worker;
