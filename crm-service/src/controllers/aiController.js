const aiService = require('../services/aiService');
const aiQueue = require('../queue/aiQueue');

/**
 * AI Controller
 * Manages manual/on-demand AI task triggers.
 */
const { Subscriber, Campaign } = require('../models');

exports.predictChurn = async (req, res) => {
  const { subscriberId, batch } = req.body;
  const orgId = req.user.orgId;

  try {
    if (batch) {
      await aiQueue.add('batch-churn-prediction', { orgId });
      return res.json({ message: 'Batch churn prediction queued successfully', orgId });
    }

    if (subscriberId) {
      const subscriber = await Subscriber.findOne({ where: { id: subscriberId, orgId } });
      if (!subscriber) return res.status(404).json({ error: 'Subscriber not found' });

      const score = await aiService.calculateChurnScore(subscriberId);
      return res.json({ subscriberId, churnScore: score });
    }

    res.status(400).json({ error: 'Either subscriberId or batch:true must be provided' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.calculateSTO = async (req, res) => {
  const { subscriberId, batch } = req.body;
  const orgId = req.user.orgId;

  try {
    if (batch) {
      await aiQueue.add('batch-sto-calculation', { orgId });
      return res.json({ message: 'Batch STO calculation queued successfully', orgId });
    }

    if (subscriberId) {
      const subscriber = await Subscriber.findOne({ where: { id: subscriberId, orgId } });
      if (!subscriber) return res.status(404).json({ error: 'Subscriber not found' });

      const result = await aiService.calculateOptimalSendTime(subscriberId);
      return res.json({ subscriberId, ...result });
    }

    res.status(400).json({ error: 'Either subscriberId or batch:true must be provided' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCampaignRecommendation = async (req, res) => {
  const { campaignId } = req.params;
  const orgId = req.user.orgId;

  try {
    const campaign = await Campaign.findOne({ where: { id: campaignId, orgId } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const recommendation = await aiService.getCampaignRecommendation(campaignId);
    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.calculateLeadScore = async (req, res) => {
  const { subscriberId, batch } = req.body;
  const orgId = req.user.orgId;

  try {
    if (batch) {
      await aiQueue.add('batch-lead-scoring', { orgId });
      return res.json({ message: 'Batch lead scoring queued successfully', orgId });
    }

    if (subscriberId) {
      const subscriber = await Subscriber.findOne({ where: { id: subscriberId, orgId } });
      if (!subscriber) return res.status(404).json({ error: 'Subscriber not found' });

      const result = await aiService.calculateLeadScore(subscriberId);
      return res.json({ subscriberId, ...result });
    }

    res.status(400).json({ error: 'Either subscriberId or batch:true must be provided' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.clusterAudience = async (req, res) => {
  const orgId = req.user.orgId;

  try {
    await aiQueue.add('batch-audience-clustering', { orgId });
    res.json({ message: 'Audience clustering queued successfully', orgId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { subscriberId } = req.body;
  const orgId = req.user.orgId;

  if (!subscriberId) return res.status(400).json({ error: 'subscriberId is required' });

  try {
    const subscriber = await Subscriber.findOne({ where: { id: subscriberId, orgId } });
    if (!subscriber) return res.status(404).json({ error: 'Subscriber not found' });

    await aiService.updateFullAIProfile(subscriberId);
    res.json({ message: 'Full AI profile updated successfully', subscriberId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.scoreSubjectLine = async (req, res) => {
  const { subject } = req.body;
  const orgId = req.user.orgId;

  try {
    const intelligenceService = require('../services/intelligenceService');
    const result = await intelligenceService.scoreSubjectLine(subject, orgId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.analyzeSpamRisk = async (req, res) => {
  const { subject, htmlBody } = req.body;

  try {
    const intelligenceService = require('../services/intelligenceService');
    const result = await intelligenceService.analyzeSpamRisk({ subject, htmlBody });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



