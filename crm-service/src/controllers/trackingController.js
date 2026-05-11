const { EventLog, CampaignLog, Campaign, Subscriber } = require('../models');
const { forwardEvent } = require('../services/ingestionService');
const { emitToOrg } = require('../config/socket');
const anomalyService = require('../services/anomalyService');
const webhookService = require('../services/webhookService');
const automationService = require('../services/automationService');
const analyticsQueue = require('../queue/analyticsQueue');

exports.trackOpen = async (req, res) => {
// ... existing code
  const { logId } = req.params;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const log = await CampaignLog.findByPk(logId);
    if (log) {
      const eventData = {
        campaignId: log.campaignId,
        subscriberId: log.subscriberId,
        messageId: log.messageId,
        orgId: log.orgId || 'unknown',
        ab_variant: log.ab_variant,
        ipAddress,
        userAgent
      };

      await EventLog.create({
        type: 'OPEN',
        ...eventData
      });

      emitToOrg(eventData.orgId, 'event:open', eventData);

      if (log.subscriberId) {
        await Subscriber.increment('totalOpens', { where: { id: log.subscriberId } });
        await Subscriber.update({ lastActivity: new Date() }, { where: { id: log.subscriberId } });
        // Decoupled AI Update
        analyticsQueue.add('update-subscriber-ai', { subscriberId: log.subscriberId });
      }

      forwardEvent('email_opened', eventData);
      if (eventData.orgId !== 'unknown') {
        webhookService.dispatch(eventData.orgId, 'email.opened', eventData);
        // Trigger Automation
        automationService.trigger(eventData.orgId, 'event_occurred', { 
          subscriberId: eventData.subscriberId, 
          eventType: 'email.opened' 
        });
      }

      if (log.campaignId) {
        await Campaign.increment('openCount', { where: { id: log.campaignId } });
      }
    }
  } catch (error) {
    console.error('Track Open Error:', error);
  }

  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end(pixel);
};

exports.trackClick = async (req, res) => {
  const { logId } = req.params;
  const { url } = req.query;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!url) return res.status(400).send('URL is required');

  try {
    const log = await CampaignLog.findByPk(logId);
    if (log) {
      const eventData = {
        campaignId: log.campaignId,
        subscriberId: log.subscriberId,
        messageId: log.messageId,
        orgId: log.orgId || 'unknown',
        ab_variant: log.ab_variant,
        url,
        ipAddress,
        userAgent
      };

      await EventLog.create({
        type: 'CLICK',
        ...eventData
      });

      emitToOrg(eventData.orgId, 'event:click', eventData);

      if (log.subscriberId) {
        await Subscriber.increment('totalClicks', { where: { id: log.subscriberId } });
        await Subscriber.update({ lastActivity: new Date() }, { where: { id: log.subscriberId } });
        // Decoupled AI Update
        analyticsQueue.add('update-subscriber-ai', { subscriberId: log.subscriberId });
      }

      forwardEvent('link_clicked', eventData);
      if (eventData.orgId !== 'unknown') {
        webhookService.dispatch(eventData.orgId, 'email.clicked', eventData);
        // Trigger Automation
        automationService.trigger(eventData.orgId, 'event_occurred', { 
          subscriberId: eventData.subscriberId, 
          eventType: 'email.clicked' 
        });
      }

      if (log.campaignId) {
        await Campaign.increment('clickCount', { where: { id: log.campaignId } });
        // AI-Powered Click Fraud Check
        anomalyService.detectClickFraud(eventData);
      }
    }
  } catch (error) {
    console.error('Track Click Error:', error);
  }

  res.redirect(url);
};
