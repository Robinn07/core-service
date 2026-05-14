const { EventLog, Campaign, CampaignLog, CampaignAnalytics } = require('../models');
const { Sequelize, Op } = require('sequelize');

exports.getDeviceStats = async (req, res) => {
  const { id } = req.params; // campaignId
  const { orgId } = req.user;

  try {
    const stats = await CampaignAnalytics.findAll({
      where: { 
        campaignId: id, 
        orgId, 
        category: ['DEVICE_TYPE', 'OS', 'BROWSER'] 
      },
      attributes: ['category', 'key', 'count'],
      raw: true
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getGeoStats = async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;

  try {
    const stats = await CampaignAnalytics.findAll({
      where: { 
        campaignId: id, 
        orgId, 
        category: ['GEO_COUNTRY', 'GEO_CITY'] 
      },
      attributes: ['category', 'key', 'count'],
      raw: true
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEngagementTimeline = async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;

  try {
    const stats = await CampaignAnalytics.findAll({
      where: { 
        campaignId: id, 
        orgId, 
        category: 'TIMELINE_HOUR' 
      },
      attributes: ['key', 'count'],
      order: [['key', 'ASC']],
      raw: true
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOverallOrgStats = async (req, res) => {
  const { orgId } = req.user;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const stats = await EventLog.findAll({
      where: { 
        orgId, 
        createdAt: { [Op.gte]: thirtyDaysAgo } 
      },
      attributes: [
        'type',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
