const { Campaign, EventLog, CampaignLog } = require('../models');
const { emitToOrg } = require('../config/socket');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Anomaly Detection Service
 * Monitors real-time events and campaign health to trigger circuit breakers.
 */
class AnomalyService {
  /**
   * Main entry point for checking campaign health after a negative event (Bounce/Unsubscribe).
   */
  async checkCampaignHealth(campaignId) {
    if (!campaignId) return;

    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign || campaign.status !== 'SENDING') return;

    const { healthThresholds, sentCount, bounceCount, orgId, name } = campaign;
    if (sentCount < 50) return; // Prevent false positives on small sample size

    // 1. Check Bounce Rate
    const currentBounceRate = bounceCount / sentCount;
    if (currentBounceRate > healthThresholds.maxBounceRate) {
      return this._triggerCircuitBreaker(campaign, 'HIGH_BOUNCE_RATE', {
        rate: currentBounceRate,
        threshold: healthThresholds.maxBounceRate
      });
    }

    // 2. Check Unsubscribe/Complaint Rate
    const complaints = await EventLog.count({
      where: {
        campaignId,
        type: 'COMPLAINT'
      }
    });
    const unsubRate = complaints / sentCount;
    if (unsubRate > healthThresholds.maxUnsubscribeRate) {
      return this._triggerCircuitBreaker(campaign, 'HIGH_UNSUBSCRIBE_RATE', {
        rate: unsubRate,
        threshold: healthThresholds.maxUnsubscribeRate
      });
    }
  }

  /**
   * Click Fraud Detection
   * Monitors for abnormal click velocity from a single IP or subscriber.
   */
  async detectClickFraud(eventData) {
    const { subscriberId, ipAddress, orgId, campaignId } = eventData;
    const now = new Date();
    const oneMinuteAgo = new Date(now - 60 * 1000);

    // Check clicks from this IP in the last minute
    const ipClickCount = await EventLog.count({
      where: {
        ipAddress,
        type: 'CLICK',
        createdAt: { [Op.gte]: oneMinuteAgo }
      }
    });

    if (ipClickCount > 10) { // More than 10 clicks per minute from one IP
      logger.warn({ ipAddress, count: ipClickCount, orgId }, 'Potential Click Fraud Detected (IP Velocity)');
      emitToOrg(orgId, 'anomaly:click_fraud', {
        type: 'IP_VELOCITY',
        ipAddress,
        count: ipClickCount,
        severity: 'MEDIUM'
      });
    }

    // Check clicks from this Subscriber in the last minute
    const subClickCount = await EventLog.count({
      where: {
        subscriberId,
        type: 'CLICK',
        createdAt: { [Op.gte]: oneMinuteAgo }
      }
    });

    if (subClickCount > 5) {
      logger.warn({ subscriberId, count: subClickCount, orgId }, 'Potential Click Fraud Detected (Subscriber Velocity)');
      emitToOrg(orgId, 'anomaly:click_fraud', {
        type: 'SUB_VELOCITY',
        subscriberId,
        count: subClickCount,
        severity: 'HIGH'
      });
    }
  }

  /**
   * Trigger Circuit Breaker: Pause campaign and notify organization.
   */
  async _triggerCircuitBreaker(campaign, type, data) {
    logger.error({ 
      campaignId: campaign.id, 
      type, 
      orgId: campaign.orgId 
    }, `[CIRCUIT BREAKER] Pausing campaign due to ${type}`);

    await campaign.update({ status: 'PAUSED' });

    // Emit Real-time Socket.io Alert
    emitToOrg(campaign.orgId, 'campaign:anomaly', {
      campaignId: campaign.id,
      campaignName: campaign.name,
      type,
      details: data,
      timestamp: new Date()
    });

    return true;
  }
}

module.exports = new AnomalyService();
