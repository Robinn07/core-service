const { Worker } = require('bullmq');
const connection = require('../config/redis');
const sesClient = require('../config/ses');
const { SendRawEmailCommand } = require("@aws-sdk/client-ses");
const { CampaignLog, Campaign } = require('../models');
const nodemailer = require('nodemailer');

/**
 * Delivery Worker
 * Enforces Global Rate Limiting (GRL).
 * 
 * Default: 14 emails/second (standard AWS SES Sandbox limit).
 */
const worker = new Worker('delivery-queue', async job => {
  const { htmlBody, ampHtmlBody, subject, recipient, logId, campaignId, fromEmail, configurationSet } = job.data;
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:4000';

  try {
    // 1. Create a transporter for MIME generation (doesn't send)
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });

    const senderEmail = fromEmail || process.env.SES_FROM_EMAIL;
    const senderDomain = senderEmail.split('@')[1];

    // 2. Build the message with 2024 compliance headers
    const mailOptions = {
      from: senderEmail,
      to: recipient,
      subject: subject,
      html: htmlBody,
      amp: ampHtmlBody,
      headers: {
        'List-Unsubscribe': `<mailto:unsub@${senderDomain}>, <${baseUrl}/api/public/unsubscribe/one-click?logId=${logId}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
    };

    const info = await transporter.sendMail(mailOptions);
    const rawMessage = info.message;

    // 3. Send via AWS SES Raw Command
    const command = new SendRawEmailCommand({
      RawMessage: { Data: rawMessage },
      ConfigurationSetName: configurationSet || undefined,
      Tags: [
        { Name: 'orgId', Value: String(job.data.orgId || 'unknown') },
        { Name: 'campaignId', Value: String(campaignId || 'none') },
        { Name: 'logId', Value: String(logId) }
      ]
    });

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
