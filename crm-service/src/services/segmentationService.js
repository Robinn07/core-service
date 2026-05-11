const { Subscriber } = require('../models');
const logger = require('../utils/logger');

/**
 * AI Segmentation Service
 * Implements audience clustering based on behavioral vectors (Churn, Lead Score, Activity).
 */
class SegmentationService {
  /**
   * Cluster a single subscriber into an AI segment.
   */
  async classifySubscriber(subscriberId) {
    const subscriber = await Subscriber.findByPk(subscriberId);
    if (!subscriber) throw new Error('Subscriber not found');

    const { churnScore, leadScore, lastActivity } = subscriber;
    const now = new Date();
    
    let segment = 'Neutral';

    // 1. Highly Engaged (Power Users)
    // Criteria: Low churn risk, high lead score, active recently
    if (churnScore < 0.2 && leadScore > 200) {
      segment = 'Highly Engaged';
    }

    // 2. Likely to Convert (Prospects)
    // Criteria: Warm/Hot temperature, low churn, moderate/high activity
    else if (churnScore < 0.4 && leadScore >= 100) {
      segment = 'Likely to Convert';
    }

    // 3. At-Risk (Churning soon)
    // Criteria: High churn score (> 0.6)
    else if (churnScore >= 0.6) {
      segment = 'At-Risk';
    }

    // 4. Dormant (Lost users)
    // Criteria: Inactive for > 60 days AND high churn score OR zero lead score
    const daysInactive = lastActivity ? (now - new Date(lastActivity)) / (1000 * 60 * 60 * 24) : 999;
    if (daysInactive > 60 && (churnScore > 0.8 || leadScore === 0)) {
      segment = 'Dormant';
    }

    // 5. New/Passive
    // Default fallback

    await subscriber.update({ aiSegment: segment });
    return segment;
  }

  /**
   * Run batch clustering for an entire organization.
   */
  async clusterOrganization(orgId) {
    logger.info({ orgId }, 'Starting organization audience clustering...');
    const subscribers = await Subscriber.findAll({
      where: { orgId, status: 'active' },
      attributes: ['id']
    });

    for (const sub of subscribers) {
      try {
        await this.classifySubscriber(sub.id);
      } catch (err) {
        logger.error({ subId: sub.id, error: err.message }, 'Clustering failed for subscriber');
      }
    }
    logger.info({ orgId, count: subscribers.length }, 'Organization clustering completed.');
  }
}

module.exports = new SegmentationService();
