const { Campaign, CampaignLog } = require('../models');
const emailQueue = require('../queue/emailQueue');

exports.createCampaign = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { 
      name, 
      type, 
      templateId,
      abTestConfig, 
      scheduledAt, 
      timezone, 
      deliverAtLocalTime, 
      segmentConfig, 
      healthThresholds, 
      successConfig 
    } = req.body;

    const campaign = await Campaign.create({ 
      name, 
      type, 
      templateId,
      abTestConfig, 
      scheduledAt, 
      timezone, 
      deliverAtLocalTime, 
      segmentConfig, 
      healthThresholds, 
      successConfig,
      orgId 
    });
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { id } = req.params;
    const { 
      name, 
      type, 
      templateId,
      abTestConfig, 
      scheduledAt, 
      timezone, 
      deliverAtLocalTime, 
      segmentConfig, 
      healthThresholds, 
      successConfig 
    } = req.body;

    const campaign = await Campaign.findOne({ where: { id, orgId } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    await campaign.update({ 
      name, 
      type, 
      templateId,
      abTestConfig, 
      scheduledAt, 
      timezone, 
      deliverAtLocalTime, 
      segmentConfig, 
      healthThresholds, 
      successConfig 
    });

    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendCampaign = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const campaign = await Campaign.findOne({ where: { id: req.params.id, orgId } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    if (['SENDING', 'SENT', 'QUEUED', 'TESTING'].includes(campaign.status)) {
      return res.status(400).json({ error: `Campaign is already in ${campaign.status} state` });
    }

    const now = new Date();
    let delay = 0;

    if (campaign.scheduledAt && new Date(campaign.scheduledAt) > now) {
      delay = new Date(campaign.scheduledAt).getTime() - now.getTime();
      await campaign.update({ status: 'SCHEDULED' });
    } else {
      await campaign.update({ status: 'QUEUED' });
    }

    await emailQueue.add('process-campaign', 
      { campaignId: campaign.id },
      { delay: delay > 0 ? delay : 0 }
    );

    res.json({ 
      message: delay > 0 ? `Campaign scheduled for ${campaign.scheduledAt}` : 'Campaign queued for sending' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCampaignStatus = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, orgId },
      include: [{ model: CampaignLog, limit: 10 }]
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCampaignAnalytics = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { id } = req.params;
    
    const { Campaign, CampaignLog, EventLog, Template } = require('../models');
    const { Sequelize } = require('sequelize');

    const campaign = await Campaign.findOne({
      where: { id, orgId },
      include: [{ model: Template, attributes: ['name', 'subject'] }],
      paranoid: false // Allow viewing analytics for soft-deleted campaigns
    });

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    // 1. Delivery Stats
    const deliveryStats = await CampaignLog.findAll({
      where: { campaignId: id, orgId },
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // 2. Engagement Stats
    const engagementStats = await EventLog.findAll({
      where: { campaignId: id, orgId },
      attributes: [
        'type',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
        [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('subscriberId'))), 'unique']
      ],
      group: ['type'],
      raw: true
    });

    // 3. A/B Breakdown if applicable
    let abBreakdown = null;
    if (campaign.type === 'AB_TEST') {
        const abStats = await EventLog.findAll({
            where: { campaignId: id, orgId, type: ['OPEN', 'CLICK'] },
            attributes: [
                'ab_variant',
                'type',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
            ],
            group: ['ab_variant', 'type'],
            raw: true
        });

        const abDelivery = await CampaignLog.findAll({
            where: { campaignId: id, orgId, status: 'SENT' },
            attributes: [
                'ab_variant',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['ab_variant'],
            raw: true
        });

        abBreakdown = {
            config: campaign.abTestConfig,
            variants: {
                A: { sent: 0, opens: 0, clicks: 0 },
                B: { sent: 0, opens: 0, clicks: 0 }
            }
        };

        abDelivery.forEach(d => {
            if (d.ab_variant && abBreakdown.variants[d.ab_variant]) {
                abBreakdown.variants[d.ab_variant].sent = parseInt(d.count);
            }
        });

        abStats.forEach(s => {
            if (s.ab_variant && abBreakdown.variants[s.ab_variant]) {
                if (s.type === 'OPEN') abBreakdown.variants[s.ab_variant].opens = parseInt(s.total);
                if (s.type === 'CLICK') abBreakdown.variants[s.ab_variant].clicks = parseInt(s.total);
            }
        });
    }

    let successImpact = null;
    if (campaign.successConfig && campaign.successConfig.targetEvent) {
        const redis = require('../config/redis');
        const cacheKey = `success_impact:${id}`;
        
        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                successImpact = JSON.parse(cachedData);
            } else {
                const { OrgConfig } = require('../models');
                const orgConfig = await OrgConfig.findByPk(orgId);
                const fallbackHours = orgConfig ? orgConfig.defaultAttributionWindow : 48;

                const axios = require('axios');
                const ANALYTICS_URL = process.env.ANALYTICS_API_URL || 'http://localhost:8000';
                const targetEvent = campaign.successConfig.targetEvent;
                const windowHours = campaign.successConfig.attributionWindow || 0;
                
                const response = await axios.get(`${ANALYTICS_URL}/analytics/${orgId}/campaign-impact/${id}`, {
                    params: { 
                        target_event: targetEvent, 
                        window_hours: windowHours,
                        fallback_hours: fallbackHours 
                    },
                    headers: { Authorization: req.headers.authorization || '' }
                });
                successImpact = response.data;
                // Cache for 15 minutes to balance fresh data vs performance
                await redis.setex(cacheKey, 900, JSON.stringify(successImpact));
            }
        } catch (err) {
            console.error('Failed to fetch/cache success impact:', err.message);
        }
    }

    res.json({
      campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          type: campaign.type,
          template: campaign.Template,
          successConfig: campaign.successConfig
      },
      stats: {
          delivery: deliveryStats,
          engagement: engagementStats,
          successImpact: successImpact
      },
      abTest: abBreakdown
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      where: { orgId: req.user.orgId }
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
