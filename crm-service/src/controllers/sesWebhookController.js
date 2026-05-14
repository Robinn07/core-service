const { SuppressionList, EventLog, CampaignLog, Campaign } = require('../models');
const analyticsAggregator = require('../services/analyticsAggregator');
const axios = require('axios');

exports.handleSesEvent = async (req, res) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // 1. Handle SNS Subscription Confirmation
    if (body.Type === 'SubscriptionConfirmation') {
      console.log(`[SES Webhook] Confirming subscription: ${body.SubscribeURL}`);
      await axios.get(body.SubscribeURL);
      return res.status(200).send('OK');
    }

    // 2. Handle SNS Notifications
    if (body.Type === 'Notification') {
      const message = JSON.parse(body.Message);
      const { notificationType, mail, bounce, complaint } = message;

      // Extract Tags (orgId, campaignId) from the mail object
      const tags = mail.tags || {};
      const orgId = tags.orgId ? tags.orgId[0] : 'unknown';
      const campaignId = tags.campaignId ? tags.campaignId[0] : null;
      const logId = tags.logId ? tags.logId[0] : null;

      const recipient = mail.destination[0];

      console.log(`[SES Webhook] Received ${notificationType} for ${recipient} (Org: ${orgId})`);

      if (notificationType === 'Bounce') {
        const bounceType = bounce.bounceType; // Permanent or Transient
        if (bounceType === 'Permanent') {
          // Hard Bounce - Add to Suppression List
          await SuppressionList.findOrCreate({
            where: { email: recipient, orgId },
            defaults: { reason: 'BOUNCE' }
          });
          
          await logEvent(orgId, campaignId, recipient, 'BOUNCE', bounce);
        }
      } else if (notificationType === 'Complaint') {
        // Spam Complaint - Add to Suppression List
        await SuppressionList.findOrCreate({
          where: { email: recipient, orgId },
          defaults: { reason: 'COMPLAINT' }
        });

        await logEvent(orgId, campaignId, recipient, 'COMPLAINT', complaint);
      }

      return res.status(200).send('OK');
    }

    res.status(200).send('Ignored');
  } catch (error) {
    console.error('[SES Webhook Error]:', error.message);
    res.status(500).json({ error: error.message });
  }
};

async function logEvent(orgId, campaignId, email, type, raw) {
  try {
    // 1. Create Event Log for Analytics
    const event = await EventLog.create({
      orgId,
      campaignId,
      type,
      recipient: email,
      metadata: raw
    });

    // 2. Aggregated Analytics
    if (campaignId && campaignId !== 'none') {
        analyticsAggregator.aggregate(event);
    }

    // 3. Increment Campaign Stats if applicable
    if (campaignId && campaignId !== 'none') {
        if (type === 'BOUNCE') {
            await Campaign.increment('bounceCount', { where: { id: campaignId } });
        }
    }
  } catch (err) {
    console.error('[SES Webhook Log Event Error]:', err.message);
  }
}
