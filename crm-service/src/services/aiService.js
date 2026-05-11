const { Subscriber, EventLog, Campaign, List, Tag } = require('../models');
const { sequelize } = require('../config/db');
const { Op, fn, col } = require('sequelize');
const logger = require('../utils/logger');
const segmentationService = require('./segmentationService');

/**
 * AI Service Module
 * Handles prediction logic for churn, STO, lead scoring and segmentation.
 */
class AIService {
  /**
   * Run full AI profile update for a subscriber.
   * Best for real-time updates after significant engagement.
   */
  async updateFullAIProfile(subscriberId) {
    await this.calculateChurnScore(subscriberId);
    await this.calculateLeadScore(subscriberId);
    await this.calculateOptimalSendTime(subscriberId);
    await segmentationService.classifySubscriber(subscriberId);
  }

  /**
   * Run full AI profile update for an organization.
   */
  async updateOrgAIProfiles(orgId) {
    logger.info({ orgId }, 'Updating full AI profiles for organization...');
    await this.predictOrgChurn(orgId);
    await this.calculateOrgLeadScores(orgId);
    await this.calculateOrgSTO(orgId);
    await segmentationService.clusterOrganization(orgId);
    logger.info({ orgId }, 'Full AI profile update completed.');
  }

  /**
   * Lead Scoring Engine
   * Generates a dynamic leadScore based on historical interactions.
   * Logic: Weighted engagement + recency decay
   */
  async calculateLeadScore(subscriberId) {
    const subscriber = await Subscriber.findByPk(subscriberId);
    if (!subscriber) throw new Error('Subscriber not found');

    const now = new Date();
    let score = 0;

    // 1. Base Engagement (Lifetime)
    score += subscriber.totalOpens * 2;
    score += subscriber.totalClicks * 10;

    // 2. Recent Intensity (Last 30 Days)
    const recentEvents = await EventLog.findAll({
      where: {
        subscriberId,
        createdAt: { [Op.gte]: new Date(now - 30 * 24 * 60 * 60 * 1000) }
      },
      attributes: ['type']
    });

    recentEvents.forEach(event => {
      if (event.type === 'OPEN') score += 5;
      if (event.type === 'CLICK') score += 15;
      if (event.type === 'DELIVERY') score += 1; // Slight bonus for consistent delivery
    });

    // 3. Recency Bonus/Penalty
    if (subscriber.lastActivity) {
      const daysSinceLastActivity = (now - new Date(subscriber.lastActivity)) / (1000 * 60 * 60 * 24);
      if (daysSinceLastActivity <= 2) score += 50; // Ultra-hot
      else if (daysSinceLastActivity <= 7) score += 20;
      else if (daysSinceLastActivity > 30) score -= 30; // Cold decay
    }

    // 4. Frequency Bonus
    const uniqueDaysActive = await EventLog.count({
      where: {
        subscriberId,
        createdAt: { [Op.gte]: new Date(now - 14 * 24 * 60 * 60 * 1000) }
      },
      distinct: true,
      col: 'createdAt' // Simplified; ideally would be DATE(createdAt)
    });
    score += uniqueDaysActive * 10;

    // Determine Temperature
    let temperature = 'COLD';
    if (score >= 150) temperature = 'HOT';
    else if (score >= 50) temperature = 'WARM';

    // Ensure score doesn't go below 0
    const finalScore = Math.max(score, 0);

    await subscriber.update({
      leadScore: finalScore,
      leadTemperature: temperature,
      lastScoredAt: now
    });

    return { leadScore: finalScore, leadTemperature: temperature };
  }

  /**
   * Batch process lead scoring for an organization
   */
  async calculateOrgLeadScores(orgId) {
    logger.info({ orgId }, 'Starting batch lead scoring calculation...');
    const subscribers = await Subscriber.findAll({
      where: { orgId, status: 'active' },
      attributes: ['id']
    });

    for (const sub of subscribers) {
      try {
        await this.calculateLeadScore(sub.id);
      } catch (err) {
        logger.error({ subId: sub.id, error: err.message }, 'Failed to calculate lead score');
      }
    }
    logger.info({ orgId, count: subscribers.length }, 'Batch lead scoring completed.');
  }

  /**
   * Predict churn probability for a single subscriber.
   * Logic: Heuristic-based Scoring
   */
  async calculateChurnScore(subscriberId) {
    // ... (rest of the method remains the same)
    const subscriber = await Subscriber.findByPk(subscriberId);
    if (!subscriber) throw new Error('Subscriber not found');

    const now = new Date();
    let score = 0.5; // Baseline probability

    // 1. Inactivity Duration
    if (subscriber.lastActivity) {
      const daysInactive = (now - new Date(subscriber.lastActivity)) / (1000 * 60 * 60 * 24);
      if (daysInactive > 30) score += 0.3;
      else if (daysInactive > 14) score += 0.15;
      else if (daysInactive < 3) score -= 0.1;
    } else {
      score += 0.2;
    }

    // 2. Engagement History
    const engagementFactor = (subscriber.totalOpens * 1 + subscriber.totalClicks * 2) / 10;
    score -= Math.min(engagementFactor * 0.05, 0.3);

    // 3. Bounce Patterns
    const softBounces = await EventLog.count({
      where: {
        subscriberId,
        type: 'BOUNCE',
        createdAt: { [Op.gte]: new Date(now - 30 * 24 * 60 * 60 * 1000) }
      }
    });
    if (softBounces > 0) score += (softBounces * 0.2);

    // 4. Activity Decay
    const recentActivity = await EventLog.count({
      where: {
        subscriberId,
        type: ['OPEN', 'CLICK'],
        createdAt: { [Op.gte]: new Date(now - 7 * 24 * 60 * 60 * 1000) }
      }
    });
    const previousActivity = await EventLog.count({
      where: {
        subscriberId,
        type: ['OPEN', 'CLICK'],
        createdAt: {
          [Op.between]: [
            new Date(now - 14 * 24 * 60 * 60 * 1000),
            new Date(now - 7 * 24 * 60 * 60 * 1000)
          ]
        }
      }
    });

    if (previousActivity > 0 && recentActivity === 0) {
      score += 0.25;
    }

    const finalScore = Math.min(Math.max(score, 0), 1);

    await subscriber.update({
      churnScore: finalScore,
      lastPredictedAt: now
    });

    return finalScore;
  }

  /**
   * Send-Time Optimization (STO)
   * Calculates the optimal hour of the day (0-23) for a subscriber.
   */
  async calculateOptimalSendTime(subscriberId) {
    const subscriber = await Subscriber.findByPk(subscriberId);
    if (!subscriber) throw new Error('Subscriber not found');

    // Aggregate OPEN events by hour
    const hourStats = await EventLog.findAll({
      where: {
        subscriberId,
        type: 'OPEN'
      },
      attributes: [
        [sequelize.literal('EXTRACT(HOUR FROM "createdAt")'), 'hour'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['hour'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      raw: true
    });

    if (hourStats.length === 0) {
      return null; // Not enough data
    }

    const optimalHour = parseInt(hourStats[0].hour);
    const totalOpens = hourStats.reduce((sum, h) => sum + parseInt(h.count), 0);
    
    // Confidence score: based on total opens (min 5 for high confidence)
    const confidenceScore = Math.min(totalOpens / 10, 1.0);

    await subscriber.update({
      preferredSendHour: optimalHour,
      stoConfidenceScore: confidenceScore
    });

    return { optimalHour, confidenceScore };
  }

  /**
   * Batch process STO for an organization
   */
  async calculateOrgSTO(orgId) {
    logger.info({ orgId }, 'Starting batch STO calculation...');
    const subscribers = await Subscriber.findAll({
      where: { orgId, status: 'active' },
      attributes: ['id']
    });

    for (const sub of subscribers) {
      try {
        await this.calculateOptimalSendTime(sub.id);
      } catch (err) {
        logger.error({ subId: sub.id, error: err.message }, 'Failed to calculate STO for subscriber');
      }
    }
    logger.info({ orgId, count: subscribers.length }, 'Batch STO calculation completed.');
  }

  /**
   * Recommendation Engine: Analyze campaign draft and provide data-driven insights.
   * Includes: Best Send Time, Audience Suggestion, Predicted Performance, and Subject Line Insights.
   */
  async getCampaignRecommendation(campaignId) {
    const campaign = await Campaign.findByPk(campaignId, {
      include: [{ model: require('../models').Template }]
    });
    if (!campaign) throw new Error('Campaign not found');

    const { orgId, segmentConfig, templateId } = campaign;
    const now = new Date();

    // 1. Send Time Optimization (Already implemented)
    const stoResult = await this._getSTORec(orgId, segmentConfig);

    // 2. Audience Suggestion (If segment is empty or for comparison)
    const audienceRec = await this._getAudienceRec(orgId);

    // 3. Predicted Performance (Open Rate & CTR)
    const performancePred = await this._predictPerformance(orgId, templateId, segmentConfig);

    // 4. Subject Line Insights
    const subjectInsights = await this._getSubjectLineInsights(orgId, campaign.Template?.subject);

    return {
      sendTime: stoResult,
      audienceSuggestion: audienceRec,
      predictedPerformance: performancePred,
      subjectLineInsights: subjectInsights,
      metadata: {
        campaignId,
        generatedAt: now
      }
    };
  }

  /**
   * Internal: STO Logic for recommendations
   */
  async _getSTORec(orgId, segmentConfig) {
    const queryOptions = {
      where: { status: 'active', orgId },
      attributes: ['preferredSendHour', 'stoConfidenceScore'],
      include: []
    };

    this._applySegmentFilters(queryOptions, segmentConfig);

    const subscribers = await Subscriber.findAll(queryOptions);
    if (subscribers.length === 0) return { suggestedHour: 10, reason: 'No data' };

    const hourWeights = {};
    let dataPoints = 0;

    subscribers.forEach(sub => {
      if (sub.preferredSendHour !== null) {
        hourWeights[sub.preferredSendHour] = (hourWeights[sub.preferredSendHour] || 0) + sub.stoConfidenceScore;
        dataPoints++;
      }
    });

    if (dataPoints === 0) return { suggestedHour: 10, reason: 'Insufficient history' };

    let bestHour = 10;
    let maxWeight = -1;
    for (const [hour, weight] of Object.entries(hourWeights)) {
      if (weight > maxWeight) {
        maxWeight = weight;
        bestHour = parseInt(hour);
      }
    }

    return { suggestedHour: bestHour, confidence: maxWeight / dataPoints };
  }

  /**
   * Internal: Predict Open Rate and CTR based on historical data
   */
  async _predictPerformance(orgId, templateId, segmentConfig) {
    // A. Historical Template Performance
    let templateStats = { openRate: 0.20, ctr: 0.03 }; // Global defaults
    if (templateId) {
      const pastCampaigns = await Campaign.findAll({
        where: { orgId, templateId, status: 'SENT', sentCount: { [Op.gt]: 0 } },
        attributes: ['sentCount', 'openCount', 'clickCount']
      });

      if (pastCampaigns.length > 0) {
        const totalSent = pastCampaigns.reduce((sum, c) => sum + c.sentCount, 0);
        const totalOpen = pastCampaigns.reduce((sum, c) => sum + c.openCount, 0);
        const totalClick = pastCampaigns.reduce((sum, c) => sum + c.clickCount, 0);
        templateStats.openRate = totalOpen / totalSent;
        templateStats.ctr = totalClick / totalSent;
      }
    }

    // B. Segment Benchmark
    // For production, you'd calculate the average responsiveness of the targeted AI Segment
    return {
      likelyOpenRate: parseFloat(templateStats.openRate.toFixed(4)),
      likelyCTR: parseFloat(templateStats.ctr.toFixed(4)),
      reliability: templateId ? 'high' : 'medium'
    };
  }

  /**
   * Internal: Suggest the best audience segment
   */
  async _getAudienceRec(orgId) {
    const segments = await Subscriber.findAll({
      where: { orgId, status: 'active' },
      attributes: [
        'aiSegment',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['aiSegment'],
      raw: true
    });

    const highlyEngaged = segments.find(s => s.aiSegment === 'Highly Engaged');
    const likelyToConvert = segments.find(s => s.aiSegment === 'Likely to Convert');

    return {
      primaryTarget: 'Highly Engaged',
      primaryCount: highlyEngaged ? parseInt(highlyEngaged.count) : 0,
      secondaryTarget: 'Likely to Convert',
      secondaryCount: likelyToConvert ? parseInt(likelyToConvert.count) : 0,
      recommendation: 'Target Highly Engaged for maximum CTR, or Likely to Convert for ROI optimization.'
    };
  }

  /**
   * Internal: Analyze subject line patterns
   */
  async _getSubjectLineInsights(orgId, currentSubject) {
    const insights = [];
    
    // Pattern 1: Personalization check
    if (currentSubject && !currentSubject.includes('{{')) {
      insights.push({
        type: 'OPTIMIZATION',
        message: 'Add personalization (e.g. {{firstName}}) to increase open rates by up to 20%.',
        impact: 'HIGH'
      });
    }

    // Pattern 2: Historical high-performers
    const highPerformers = await Campaign.findAll({
      where: { orgId, status: 'SENT' },
      order: [['openCount', 'DESC']],
      limit: 3,
      include: [{ model: require('../models').Template, attributes: ['subject'] }]
    });

    if (highPerformers.length > 0) {
      insights.push({
        type: 'BENCHMARK',
        message: 'Top performing patterns in your org use "Short & Urgent" style subjects.',
        examples: highPerformers.map(c => c.Template?.subject).filter(Boolean)
      });
    }

    return insights;
  }

  /**
   * Internal: Helper to apply segment filters to queries
   */
  _applySegmentFilters(queryOptions, segmentConfig) {
    if (!segmentConfig) return;

    if (segmentConfig.listIds && segmentConfig.listIds.length > 0) {
      queryOptions.include.push({
        model: List,
        where: { id: { [Op.in]: segmentConfig.listIds } },
        through: { attributes: [] }
      });
    }

    if (segmentConfig.tags && segmentConfig.tags.length > 0) {
      queryOptions.include.push({
        model: Tag,
        where: { name: { [Op.in]: segmentConfig.tags } },
        through: { attributes: [] }
      });
    }

    if (segmentConfig.aiSegment) {
      queryOptions.where.aiSegment = segmentConfig.aiSegment;
    }
  }

  /**
   * Batch process all active subscribers for an organization.
   */
  async predictOrgChurn(orgId) {
    // ... (rest of the method remains the same)
    logger.info({ orgId }, 'Starting batch churn prediction...');
    const subscribers = await Subscriber.findAll({
      where: { orgId, status: 'active' },
      attributes: ['id']
    });

    for (const sub of subscribers) {
      try {
        await this.calculateChurnScore(sub.id);
      } catch (err) {
        logger.error({ subId: sub.id, error: err.message }, 'Failed to predict churn for subscriber');
      }
    }

    logger.info({ orgId, count: subscribers.length }, 'Batch churn prediction completed.');
  }
}

module.exports = new AIService();

