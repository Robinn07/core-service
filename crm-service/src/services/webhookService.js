const webhookQueue = require('../queue/webhookQueue');
const { WebhookSubscription } = require('../models');
const { Op } = require('sequelize');

class WebhookService {
  /**
   * Dispatch an event to all interested webhook subscriptions
   */
  async dispatch(orgId, event, data) {
    const subscriptions = await WebhookSubscription.findAll({
      where: {
        orgId,
        isActive: true,
        [Op.or]: [
          { events: { [Op.contains]: [event] } },
          { events: { [Op.contains]: ['*'] } }
        ]
      }
    });

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data
    };

    for (const sub of subscriptions) {
      await webhookQueue.add('deliver-webhook', {
        url: sub.url,
        payload,
        secret: sub.secret
      });
    }
  }
}

module.exports = new WebhookService();
