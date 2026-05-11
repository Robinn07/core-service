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

    // Trigger webhook for new confirmed subscriber
    webhookService.dispatch(subscriber.orgId, 'subscriber.confirmed', {
      subscriberId: subscriber.id,
      email: subscriber.email
    });

    // Trigger Automations
    const automationService = require('../services/automationService');
    automationService.trigger(subscriber.orgId, 'subscriber_created', {
        subscriberId: subscriber.id
    });

    res.send('<h1>Subscription Confirmed!</h1><p>Thank you for confirming your email. You are now subscribed.</p>');
  } catch (error) {
    console.error('Confirmation Error:', error);
    res.status(500).send('<h1>Error</h1><p>An internal error occurred. Please try again later.</p>');
  }
};
