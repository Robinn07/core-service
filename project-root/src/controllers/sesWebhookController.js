const axios = require('axios');
const { handleBounce, handleComplaint } = require('../services/suppressionService');

/**
 * SES Webhook Controller
 * Handles AWS SNS notifications for SES events.
 */
const handleWebhook = async (req, res) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // 1. Handle SNS Subscription Confirmation
    if (body.Type === 'SubscriptionConfirmation') {
      console.log(`[SES Webhook] Confirming SNS subscription: ${body.SubscribeURL}`);
      await axios.get(body.SubscribeURL);
      return res.status(200).send('Subscription Confirmed');
    }

    // 2. Handle SNS Notifications
    if (body.Type === 'Notification') {
      const message = JSON.parse(body.Message);
      const { notificationType } = message;

      if (notificationType === 'Bounce') {
        const { bounce } = message;
        const emails = bounce.bouncedRecipients.map(r => r.emailAddress);
        const bounceType = bounce.bounceType; // e.g., Permanent
        
        if (bounceType === 'Permanent') {
          await handleBounce(emails, bounceType);
        }
      } else if (notificationType === 'Complaint') {
        const { complaint } = message;
        const emails = complaint.complainedRecipients.map(r => r.emailAddress);
        
        await handleComplaint(emails);
      }

      return res.status(200).send('Notification Processed');
    }

    res.status(200).send('Ignored Event Type');
  } catch (error) {
    console.error('[SES Webhook Error]:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  handleWebhook
};
