const axios = require('axios');
const logger = require('../utils/logger');
const { OrgConfig } = require('../models');

/**
 * Ingestion Service
 * Handles forwarding behavioral events to the high-scale Retentioneering stack.
 */
class IngestionService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Forward a behavioral event to the ingestion gateway.
   * @param {string} eventType - The type of event (e.g., 'email_opened')
   * @param {Object} context - The event context (subscriberId, campaignId, etc.)
   */
  async forwardEvent(eventType, context) {
    const orgId = context.orgId || process.env.CRM_ORG_ID || 'crm-system';
    
    // 1. Get Org-Specific Ingestion Config
    const config = await this._getConfig(orgId);
    if (!config || !config.ingestionKey) {
      // logger.debug({ orgId }, 'Ingestion not configured for this organization. Skipping.');
      return;
    }

    // 2. Map CRM event names to Ingestion-standard names
    const mappedEvent = this._mapEvent(eventType);

    const payload = {
      orgId: orgId,
      userId: context.subscriberId || 'unknown',
      event_type: mappedEvent,
      channel: 'EMAIL',
      campaignId: context.campaignId || 'manual',
      metadata: {
        messageId: context.messageId,
        url: context.url,
        ip: context.ipAddress,
        ua: context.userAgent
      }
    };

    try {
      await axios.post(`${config.ingestionUrl}/track-event`, payload, {
        headers: {
          'x-api-key': config.ingestionKey,
          'Content-Type': 'application/json'
        },
        timeout: 2000
      });
      logger.debug({ mappedEvent, orgId }, 'Event forwarded to ingestion-service');
    } catch (error) {
      logger.error({ error: error.message, eventType }, 'Failed to forward event to ingestion-service');
    }
  }

  /**
   * Map CRM events to Retentioneering-friendly names.
   */
  _mapEvent(crmEvent) {
    const mapping = {
      'email_opened': 'email_opened',
      'link_clicked': 'link_clicked',
      'bounced': 'bounced',
      'spam_reported': 'spam_reported',
      'email_delivered': 'email_delivered'
    };
    return mapping[crmEvent] || crmEvent;
  }

  /**
   * Internal helper with caching for OrgConfig
   */
  async _getConfig(orgId) {
    if (this.cache.has(orgId)) {
      const { data, expiry } = this.cache.get(orgId);
      if (Date.now() < expiry) return data;
    }

    const config = await OrgConfig.findByPk(orgId);
    if (config) {
      this.cache.set(orgId, {
        data: config,
        expiry: Date.now() + 60 * 60 * 1000 // Cache for 1 hour
      });
    }
    return config;
  }
}

module.exports = new IngestionService();
