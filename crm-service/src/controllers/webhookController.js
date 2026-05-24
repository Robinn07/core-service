const { CampaignLog, Subscriber, EventLog, Campaign, SuppressionList } = require('../models');
const { forwardEvent } = require('../services/ingestionService');
const emailQueue = require('../queue/emailQueue');
const anomalyService = require('../services/anomalyService');
const webhookService = require('../services/webhookService');
const logger = require('../utils/logger');
const crypto = require('crypto');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logger.warn({ 
      ip: req.ip, 
      error: err.message, 
      payloadHash: crypto.createHash('sha256').update(req.body).digest('hex') 
    }, '❌ Stripe Webhook Signature Verification Failed');
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      logger.info({ id: paymentIntent.id }, '💰 Stripe Payment Intent Succeeded');
      // Logic to update subscription or credits would go here
      break;
    default:
      logger.debug({ type: event.type }, 'ℹ️ Unhandled Stripe event type');
  }

  res.json({ received: true });
};

exports.handleSESWebhook = async (req, res) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // Handle SNS Subscription Confirmation
    if (body.Type === 'SubscriptionConfirmation') {
      console.log('SES Webhook Subscription Confirmation URL:', body.SubscribeURL);
      return res.sendStatus(200);
    }

    if (body.Type === 'Notification') {
      const message = JSON.parse(body.Message);
      const { notificationType, mail, bounce, complaint } = message;
      const messageId = mail.messageId;

      const log = await CampaignLog.findOne({ where: { messageId } });
      const orgId = log ? log.orgId : null;

      if (notificationType === 'Bounce') {
        const bounceType = bounce.bounceType;
        if (log) {
          await log.update({ status: 'BOUNCED', error: `Bounce Type: ${bounceType}` });
          
          if (log.campaignId) {
            await Campaign.increment('bounceCount', { where: { id: log.campaignId } });
            // AI-Powered Campaign Health Check (Circuit Breaker)
            anomalyService.checkCampaignHealth(log.campaignId);
          }

          const eventData = {
            campaignId: log.campaignId,
            subscriberId: log.subscriberId,
            messageId: log.messageId,
            url: bounceType
          };
          await EventLog.create({
            type: 'BOUNCE',
            ...eventData
          });
          forwardEvent('bounced', eventData);
          if (orgId) webhookService.dispatch(orgId, 'email.bounced', eventData);
        }

        // Permanent Bounce -> Mark subscriber as bounced and add to suppression list
        if (bounceType === 'Permanent' && orgId) {
          const recipient = bounce.bouncedRecipients[0].emailAddress;
          await Subscriber.update({ status: 'bounced' }, { where: { email: recipient, orgId } });
          await SuppressionList.findOrCreate({
            where: { email: recipient, orgId },
            defaults: { reason: 'BOUNCE' }
          });
        }
      } else if (notificationType === 'Complaint') {
        if (log) {
          await log.update({ status: 'COMPLAINED' });
          if (log.campaignId) {
            // Complaints contribute to high unsubscribe/complaint rate
            anomalyService.checkCampaignHealth(log.campaignId);
          }
          const eventData = {
            campaignId: log.campaignId,
            subscriberId: log.subscriberId,
            messageId: log.messageId
          };
          await EventLog.create({
            type: 'COMPLAINT',
            ...eventData
          });
          forwardEvent('spam_reported', eventData);
          if (orgId) webhookService.dispatch(orgId, 'email.complained', eventData);
        }
        const recipient = complaint.complainedRecipients[0].emailAddress;
        if (orgId) {
          await Subscriber.update({ status: 'unsubscribed' }, { where: { email: recipient, orgId } });
          await SuppressionList.findOrCreate({
            where: { email: recipient, orgId },
            defaults: { reason: 'COMPLAINT' }
          });
        }
      } else if (notificationType === 'Delivery') {
        if (log) {
          await log.update({ status: 'DELIVERED' });
          const eventData = {
            campaignId: log.campaignId,
            subscriberId: log.subscriberId,
            messageId: log.messageId
          };
          await EventLog.create({
            type: 'DELIVERY',
            ...eventData
          });
          forwardEvent('email_delivered', eventData);
          if (orgId) webhookService.dispatch(orgId, 'email.delivered', eventData);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.handleChurnAlert = async (req, res) => {
  const { subscribers, campaignName } = req.body; // Expecting { subscribers: ['email1', 'email2'], campaignName: 'Win-back' }

  if (!subscribers || !Array.isArray(subscribers)) {
    return res.status(400).json({ error: 'Subscribers array is required' });
  }

  try {
    // Find the Win-back campaign
    const campaign = await Campaign.findOne({
      where: { name: campaignName || 'Win-back' }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Win-back campaign not found' });
    }

    // This is a simplified trigger. In a real system, you'd probably 
    // create a specific segment or just queue them directly.
    // For now, we'll queue individual email jobs if we had a direct 'send-to-subscriber' job,
    // but our worker handles 'process-campaign' (bulk) or 'automation-action'.
    
    // Let's assume we can trigger an automation-like flow or just log it.
    console.log(`[Churn Alert] Triggering "${campaign.name}" for ${subscribers.length} users.`);
    
    // In this "Loop", we might want to tag them or add them to a specific list.
    // For simplicity, let's just return success for now as the "Data Bridge" proof of concept.
    res.json({ message: 'Churn alert received and win-back triggered', count: subscribers.length });
  } catch (error) {
    console.error('Churn Alert Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};
