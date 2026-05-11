const aiService = require('../services/aiService');
const aiQueue = require('../queue/aiQueue');

/**
 * AI Controller
 * Manages manual/on-demand AI task triggers.
 */
exports.predictChurn = async (req, res) => {
  // ... existing implementation
  const { subscriberId, batch, orgId } = req.body;

  try {
    if (batch) {
      const targetOrgId = orgId || req.user.orgId;
      await aiQueue.add('batch-churn-prediction', { orgId: targetOrgId });
      return res.json({ message: 'Batch churn prediction queued successfully', orgId: targetOrgId });
    }

    if (subscriberId) {
      const score = await aiService.calculateChurnScore(subscriberId);
      return res.json({ subscriberId, churnScore: score });
    }

    res.status(400).json({ error: 'Either subscriberId or batch:true must be provided' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.calculateSTO = async (req, res) => {
  const { subscriberId, batch, orgId } = req.body;

  try {
    if (batch) {
      const targetOrgId = orgId || req.user.orgId;
      await aiQueue.add('batch-sto-calculation', { orgId: targetOrgId });
      return res.json({ message: 'Batch STO calculation queued successfully', orgId: targetOrgId });
    }

    if (subscriberId) {
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

  try {
    const recommendation = await aiService.getCampaignRecommendation(campaignId);
    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.calculateLeadScore = async (req, res) => {
  const { subscriberId, batch, orgId } = req.body;

  try {
    if (batch) {
      const targetOrgId = orgId || req.user.orgId;
      await aiQueue.add('batch-lead-scoring', { orgId: targetOrgId });
      return res.json({ message: 'Batch lead scoring queued successfully', orgId: targetOrgId });
    }

    if (subscriberId) {
      const result = await aiService.calculateLeadScore(subscriberId);
      return res.json({ subscriberId, ...result });
    }

    res.status(400).json({ error: 'Either subscriberId or batch:true must be provided' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.clusterAudience = async (req, res) => {
  const { orgId } = req.body;
  const targetOrgId = orgId || req.user.orgId;

  try {
    await aiQueue.add('batch-audience-clustering', { orgId: targetOrgId });
    res.json({ message: 'Audience clustering queued successfully', orgId: targetOrgId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { subscriberId } = req.body;

  if (!subscriberId) return res.status(400).json({ error: 'subscriberId is required' });

  try {
    await aiService.updateFullAIProfile(subscriberId);
    res.json({ message: 'Full AI profile updated successfully', subscriberId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



