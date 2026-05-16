const { WebhookSubscription } = require('../models');
const crypto = require('crypto');

exports.createSubscription = async (req, res) => {
  try {
    const { url, events } = req.body;
    const orgId = req.user?.orgId || req.headers['x-org-id'];

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    // Generate a random secret for signing
    const secret = crypto.randomBytes(32).toString('hex');

    const subscription = await WebhookSubscription.create({
      orgId,
      url,
      events: events || ['*'],
      secret
    });

    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubscriptions = async (req, res) => {
  try {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    const subscriptions = await WebhookSubscription.findAll({ where: { orgId } });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.orgId || req.headers['x-org-id'];

    const deleted = await WebhookSubscription.destroy({
      where: { id, orgId }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
