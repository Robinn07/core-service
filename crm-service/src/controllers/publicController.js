const { Subscriber } = require('../models');
const webhookService = require('../services/webhookService');

exports.confirmSubscription = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('<h1>Invalid Link</h1><p>Confirmation token is missing.</p>');
  }

  try {
    const subscriber = await Subscriber.findOne({ where: { confirmationToken: token } });

    if (!subscriber) {
      return res.status(404).send('<h1>Link Expired</h1><p>We could not find your subscription request.</p>');
    }

    if (subscriber.status === 'active') {
      return res.send('<h1>Already Confirmed</h1><p>Your subscription is already active. Thank you!</p>');
    }

    await subscriber.update({
      status: 'active',
      confirmedAt: new Date(),
      confirmationToken: null // Clear token after use
    });

    // Log Confirmation Consent
    const { ConsentLog } = require('../models');
    await ConsentLog.create({
      subscriberId: subscriber.id,
      orgId: subscriber.orgId,
      source: 'Double Opt-In Confirmation',
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      consentType: 'CONFIRM'
    });

    // Trigger webhook for new confirmed subscriber
    webhookService.dispatch(subscriber.orgId, 'subscriber.confirmed', {
      subscriberId: subscriber.id,
      email: subscriber.email
    });

    // Trigger Automations via Emitter
    const appEmitter = require('../utils/events');
    appEmitter.emit('subscriber_created', subscriber);

    res.send('<h1>Subscription Confirmed!</h1><p>Thank you for confirming your email. You are now subscribed.</p>');
  } catch (error) {
    console.error('Confirmation Error:', error);
    res.status(500).send('<h1>Error</h1><p>An internal error occurred. Please try again later.</p>');
  }
};

exports.oneClickUnsubscribe = async (req, res) => {
  const { logId } = req.query;
  const { CampaignLog, Subscriber } = require('../models');

  try {
    const log = await CampaignLog.findByPk(logId);
    if (!log) return res.status(404).send('Invalid unsubscribe link');

    const subscriber = await Subscriber.findByPk(log.subscriberId);
    if (!subscriber) return res.status(404).send('Subscriber not found');

    if (subscriber.status !== 'unsubscribed') {
      await subscriber.update({ status: 'unsubscribed' });

      // Log the event
      const { EventLog } = require('../models');
      await EventLog.create({
        type: 'UNSUBSCRIBE',
        orgId: subscriber.orgId,
        campaignId: log.campaignId,
        subscriberId: subscriber.id,
        messageId: log.messageId,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.headers['x-forwarded-for']
      });

      webhookService.dispatch(subscriber.orgId, 'subscriber.unsubscribed', {
        subscriberId: subscriber.id,
        email: subscriber.email,
        campaignId: log.campaignId
      });

      // Trigger Automation via Emitter
      const appEmitter = require('../utils/events');
      appEmitter.emit('unsubscribed', subscriber);
    }

    // Gmail/Yahoo 2024 requires a 200 OK for the POST request
    if (req.method === 'POST') {
      return res.status(200).json({ status: 'unsubscribed' });
    }

    res.send('<h1>Unsubscribed Successfully</h1><p>You have been removed from our list. We are sorry to see you go.</p>');
  } catch (error) {
    console.error('Unsubscribe Error:', error);
    res.status(500).send('Error processing unsubscribe request');
  }
};
