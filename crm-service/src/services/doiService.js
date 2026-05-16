const { v4: uuidv4 } = require('uuid');
const deliveryQueue = require('../queue/deliveryQueue');
const { CampaignLog } = require('../models');

class DOIService {
  /**
   * Send a confirmation email to a new subscriber
   */
  async sendConfirmationEmail(subscriber) {
    const token = uuidv4();
    await subscriber.update({ 
      confirmationToken: token,
      status: 'pending' 
    });

    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:4000';
    const confirmationUrl = `${baseUrl}/api/public/confirm?token=${token}`;
    const subject = "Please confirm your subscription";

    const htmlBody = `
      <h1>Confirm your subscription</h1>
      <p>Hello ${subscriber.firstName || 'there'},</p>
      <p>Please click the link below to confirm your subscription to our list.</p>
      <a href="${confirmationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Confirm Subscription</a>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `;

    // Create a transactional log for DOI
    const log = await CampaignLog.create({
      orgId: subscriber.orgId,
      subscriberId: subscriber.id,
      status: 'PENDING'
    });

    try {
      await deliveryQueue.add('deliver-email', {
        htmlBody,
        subject,
        recipient: subscriber.email,
        logId: log.id
      });
      return true;
    } catch (error) {
      console.error('DOI Enqueue Error:', error);
      await log.update({ status: 'FAILED', error: error.message });
      return false;
    }
  }
}

module.exports = new DOIService();
