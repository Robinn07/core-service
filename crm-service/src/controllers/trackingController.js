const { EventLog, CampaignLog, Campaign, Subscriber } = require('../models');
const { forwardEvent } = require('../services/ingestionService');
const { emitToOrg } = require('../config/socket');
const anomalyService = require('../services/anomalyService');
const webhookService = require('../services/webhookService');
const automationService = require('../services/automationService');
const analyticsAggregator = require('../services/analyticsAggregator');
const analyticsQueue = require('../queue/analyticsQueue');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

const parseMetadata = (ip, ua) => {
  const geo = geoip.lookup(ip);
  const parser = new UAParser(ua);
  const device = parser.getDevice();
  const os = parser.getOS();
  const browser = parser.getBrowser();

  return {
    country: geo ? geo.country : null,
    city: geo ? geo.city : null,
    os: os.name ? `${os.name} ${os.version || ''}` : null,
    browser: browser.name ? `${browser.name} ${browser.version || ''}` : null,
    deviceType: device.type || 'desktop'
  };
};

const jwt = require('jsonwebtoken');

exports.handleConsent = async (req, res) => {
  const { subscriberId, consentType, granted } = req.body;
  const orgId = req.user.orgId;

  try {
    const subscriber = await Subscriber.findOne({ where: { id: subscriberId, orgId } });
    if (!subscriber) return res.status(404).json({ error: 'Subscriber not found' });

    const updateData = granted 
      ? { consentGrantedAt: new Date(), consentRevokedAt: null }
      : { consentRevokedAt: new Date(), consentGrantedAt: null };

    await subscriber.update(updateData);

    // Issue a signed consent token (JWT)
    const token = jwt.sign(
      { subscriberId, orgId, granted }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '24h' }
    );

    res.json({ status: 'consent_updated', token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const validateConsent = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    return decoded.granted === true;
  } catch (err) {
    return false;
  }
};

exports.trackOpen = async (req, res) => {
  const { logId } = req.params;
  const { lx_consent } = req.query; // Consent token sent from client
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!validateConsent(lx_consent)) {
    logger.warn({ logId, ipAddress }, '🚫 Track Open rejected: Missing or invalid consent token');
    // Return transparent pixel even if rejected to avoid breaking UI/Email
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    return res.status(200).contentType('image/gif').send(pixel);
  }

  try {
    const log = await CampaignLog.findByPk(logId);
    if (log) {
      const metadata = parseMetadata(ipAddress, userAgent);
      const eventData = {
        campaignId: log.campaignId,
        subscriberId: log.subscriberId,
        messageId: log.messageId,
        orgId: log.orgId || 'unknown',
        ab_variant: log.ab_variant,
        ipAddress,
        userAgent,
        ...metadata
      };

      await EventLog.create({
        type: 'OPEN',
        ...eventData
      });

      emitToOrg(eventData.orgId, 'event:open', eventData);
      
      // Aggregated Analytics
      analyticsAggregator.aggregate(eventData);

      if (log.subscriberId) {
        await Subscriber.increment('totalOpens', { where: { id: log.subscriberId } });
        await Subscriber.update({ lastActivity: new Date() }, { where: { id: log.subscriberId } });
        // Decoupled AI Update
        analyticsQueue.add('update-subscriber-ai', { subscriberId: log.subscriberId });
      }

      forwardEvent('email_opened', eventData);
      if (eventData.orgId !== 'unknown') {
        webhookService.dispatch(eventData.orgId, 'email.opened', eventData);
        // Unified Automation Trigger via Emitter
        const { Subscriber } = require('../models');
        const subscriber = await Subscriber.findByPk(eventData.subscriberId);
        if (subscriber) {
          appEmitter.emit('event_occurred', { 
            subscriber, 
            eventType: 'OPEN', 
            metadata: { campaignId: eventData.campaignId } 
          });
        }
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
  const { url, lx_consent } = req.query;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!url) return res.status(400).send('URL is required');

  if (!validateConsent(lx_consent)) {
    logger.warn({ logId, ipAddress }, '🚫 Track Click rejected: Missing or invalid consent token');
    return res.redirect(url);
  }

  try {
    const log = await CampaignLog.findByPk(logId);
    if (log) {
      const metadata = parseMetadata(ipAddress, userAgent);
      
      // Build attribution URL
      const attributionUrl = new URL(url);
      attributionUrl.searchParams.append('lx_cid', log.campaignId);
      attributionUrl.searchParams.append('lx_sid', log.subscriberId);
      const finalUrl = attributionUrl.toString();

      const eventData = {
        campaignId: log.campaignId,
        subscriberId: log.subscriberId,
        messageId: log.messageId,
        orgId: log.orgId || 'unknown',
        ab_variant: log.ab_variant,
        url: finalUrl,
        ipAddress,
        userAgent,
        ...metadata
      };

      await EventLog.create({
        type: 'CLICK',
        ...eventData
      });

      emitToOrg(eventData.orgId, 'event:click', eventData);

      // Aggregated Analytics
      analyticsAggregator.aggregate(eventData);

      if (log.subscriberId) {
        await Subscriber.increment('totalClicks', { where: { id: log.subscriberId } });
        await Subscriber.update({ lastActivity: new Date() }, { where: { id: log.subscriberId } });
        // Decoupled AI Update
        analyticsQueue.add('update-subscriber-ai', { subscriberId: log.subscriberId });
      }

      forwardEvent('link_clicked', eventData);
      if (eventData.orgId !== 'unknown') {
        webhookService.dispatch(eventData.orgId, 'email.clicked', eventData);
        // Unified Automation Trigger via Emitter
        const { Subscriber } = require('../models');
        const subscriber = await Subscriber.findByPk(eventData.subscriberId);
        if (subscriber) {
          appEmitter.emit('event_occurred', { 
            subscriber, 
            eventType: 'CLICK', 
            metadata: { campaignId: eventData.campaignId, url: eventData.url } 
          });
        }
      }

      if (log.campaignId) {
        await Campaign.increment('clickCount', { where: { id: log.campaignId } });
        // AI-Powered Click Fraud Check
        anomalyService.detectClickFraud(eventData);
      }

      return res.redirect(finalUrl);
    }
  } catch (error) {
    console.error('Track Click Error:', error);
  }

  res.redirect(url);
};
