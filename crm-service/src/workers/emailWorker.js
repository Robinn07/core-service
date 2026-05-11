const { Worker } = require('bullmq');
const connection = require('../config/redis');
const { Campaign, Template, Subscriber, CampaignLog, EventLog, List, Tag, SuppressionList } = require('../models');
const Handlebars = require('handlebars');
const { Op, Sequelize } = require('sequelize');
const dynamicSegmentService = require('../services/dynamicSegmentService');
const deliveryQueue = require('../queue/deliveryQueue');
const emailQueue = require('../queue/emailQueue');

/**
 * Optimized Email Worker
 * Implements: Streaming Cursors, Pre-compiled Templates, and Optimized Joins.
 * Enqueues to DeliveryQueue for Global Rate Limiting.
 */
const worker = new Worker('email-queue', async job => {
  if (job.name === 'process-campaign') {
    return handleCampaign(job.data.campaignId);
  }
  if (job.name === 'pick-winner') {
    return pickWinner(job.data.campaignId);
  }
  if (job.name === 'automation-email') {
    const { templateId, subscriberId, orgId } = job.data;
    return handleAutomationEmail(templateId, subscriberId, orgId);
  }
}, { 
  connection,
  concurrency: 5 // Process 5 campaigns in parallel
});

async function handleCampaign(campaignId) {
  const campaign = await Campaign.findByPk(campaignId, {
    include: [{ model: Template }]
  });

  if (!campaign || !campaign.Template) throw new Error('Campaign or Template not found');

  // A/B Testing Config
  const isABTest = campaign.type === 'AB_TEST';
  const abConfig = campaign.abTestConfig || {};

  // Load Variants Templates if needed
  let templateA = campaign.Template;
  let templateB = campaign.Template;

  if (isABTest) {
    if (abConfig.variantA?.templateId && abConfig.variantA.templateId !== campaign.templateId) {
      templateA = await Template.findByPk(abConfig.variantA.templateId) || campaign.Template;
    }
    if (abConfig.variantB?.templateId && abConfig.variantB.templateId !== campaign.templateId) {
      templateB = await Template.findByPk(abConfig.variantB.templateId) || campaign.Template;
    }
  }

  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:4000';

  const processTemplate = (template, variantSubject = null) => {
    let html = template.htmlContent.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi, (match, url) => {
      if (url.startsWith('http')) {
        const trackingUrl = `${baseUrl}/api/track/click/[[LOG_ID]]?url=${encodeURIComponent(url)}`;
        return match.replace(url, trackingUrl);
      }
      return match;
    });
    html += `<img src="${baseUrl}/api/track/open/[[LOG_ID]]" width="1" height="1" style="display:none;" />`;
    
    return {
      templateDelegate: Handlebars.compile(html),
      subjectDelegate: Handlebars.compile(variantSubject || template.subject)
    };
  };

  const variantA = processTemplate(templateA, abConfig.variantA?.subject);
  const variantB = isABTest ? processTemplate(templateB, abConfig.variantB?.subject) : variantA;

  // REC 3: Optimized Join for Suppression
  const { segmentConfig, orgId } = campaign;
  const queryOptions = {
    where: { 
      status: 'active',
      orgId
    },
    include: [
      {
        model: SuppressionList,
        as: 'Suppression',
        required: false,
        where: { orgId },
        attributes: ['id']
      },
      {
        model: CampaignLog,
        required: false,
        where: { campaignId: campaign.id },
        attributes: ['id']
      }
    ],
    subQuery: false 
  };

  // Exclude suppressed AND exclude those who already received this campaign
  queryOptions.where['$Suppression.id$'] = null;
  queryOptions.where['$CampaignLogs.id$'] = null;

  if (segmentConfig && segmentConfig.conditions) {
    const dynamicWhere = dynamicSegmentService.buildWhereClause(segmentConfig);
    queryOptions.where = { [Op.and]: [queryOptions.where, dynamicWhere] };
  }

  // REC 1: Streaming Cursor Implementation
  const BATCH_SIZE = 1000;
  let totalProcessed = 0;
  
  // For A/B Test phase 1
  let limit = null;
  if (isABTest && !abConfig.winner) {
    const totalAudience = await Subscriber.count(queryOptions);
    const testSizePercent = abConfig.testSize || 20;
    limit = Math.floor(totalAudience * (testSizePercent / 100));
    
    if (limit === 0 && totalAudience > 0) limit = Math.min(2, totalAudience); 
    
    await campaign.update({ status: 'TESTING' });
    console.log(`[Campaign ${campaignId}] Starting A/B Test. Test size: ${limit} / ${totalAudience}`);
  } else {
    await campaign.update({ status: 'SENDING' });
  }

  while (true) {
    const currentBatchSize = limit !== null ? Math.min(BATCH_SIZE, limit - totalProcessed) : BATCH_SIZE;
    if (currentBatchSize <= 0 && limit !== null) break;

    const subscribers = await Subscriber.findAll({
      ...queryOptions,
      limit: currentBatchSize,
      order: [['id', 'ASC']]
    });

    if (subscribers.length === 0) break;

    const enqueuePromises = subscribers.map((sub, index) => {
      let variantName = null;
      let delegates = variantA;

      if (isABTest) {
        if (abConfig.winner) {
          variantName = abConfig.winner;
          delegates = variantName === 'B' ? variantB : variantA;
        } else {
          variantName = (totalProcessed + index) % 2 === 0 ? 'A' : 'B';
          delegates = variantName === 'B' ? variantB : variantA;
        }
      }

      return enqueuePersonalizedEmail(sub, delegates.templateDelegate, delegates.subjectDelegate, { campaignId: campaign.id, orgId }, variantName);
    });

    await Promise.all(enqueuePromises);
    
    totalProcessed += subscribers.length;
    console.log(`[Campaign ${campaignId}] Enqueued ${totalProcessed} delivery jobs...`);

    if (limit !== null && totalProcessed >= limit) break;
  }

  if (isABTest && !abConfig.winner) {
    const delay = (abConfig.testDuration || 4) * 3600 * 1000;
    await emailQueue.add('pick-winner', { campaignId: campaign.id }, { delay });
    console.log(`[Campaign ${campaignId}] A/B Test phase 1 complete. Winner selection scheduled in ${abConfig.testDuration}h`);
  } else {
    await campaign.update({ status: 'SENT' });
  }
}

async function pickWinner(campaignId) {
  const campaign = await Campaign.findByPk(campaignId);
  if (!campaign || campaign.type !== 'AB_TEST') return;

  const abConfig = campaign.abTestConfig || {};
  const metric = abConfig.testMetric || 'open_count';

  const results = await CampaignLog.findAll({
    where: { campaignId },
    attributes: [
      'ab_variant',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
      [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN status = \'SENT\' THEN 1 ELSE 0 END')), 'sent']
    ],
    group: ['ab_variant'],
    raw: true
  });

  const engagements = await EventLog.findAll({
    where: { 
      campaignId,
      type: metric === 'click_count' ? 'CLICK' : 'OPEN'
    },
    attributes: [
      'ab_variant',
      [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('subscriberId'))), 'count']
    ],
    group: ['ab_variant'],
    raw: true
  });

  const stats = {
    A: { total: 0, sent: 0, engagement: 0, rate: 0 },
    B: { total: 0, sent: 0, engagement: 0, rate: 0 }
  };

  results.forEach(r => {
    if (r.ab_variant && stats[r.ab_variant]) {
      stats[r.ab_variant].total = parseInt(r.total) || 0;
      stats[r.ab_variant].sent = parseInt(r.sent) || 0;
    }
  });

  engagements.forEach(e => {
    if (e.ab_variant && stats[e.ab_variant]) {
      stats[e.ab_variant].engagement = parseInt(e.count) || 0;
    }
  });

  stats.A.rate = stats.A.sent > 0 ? stats.A.engagement / stats.A.sent : 0;
  stats.B.rate = stats.B.sent > 0 ? stats.B.engagement / stats.B.sent : 0;

  let winner = 'A';
  
  if (stats.B.rate > stats.A.rate) {
    winner = 'B';
  } else if (stats.B.rate === stats.A.rate) {
    // Tie-breaker: Better delivery success rate or just A
    const deliveryRateA = stats.A.total > 0 ? stats.A.sent / stats.A.total : 0;
    const deliveryRateB = stats.B.total > 0 ? stats.B.sent / stats.B.total : 0;
    winner = deliveryRateB > deliveryRateA ? 'B' : 'A';
  }

  // Fallback: If engagement is very low, we might still want to pick A by default
  if (stats.A.engagement === 0 && stats.B.engagement === 0) {
    winner = abConfig.fallbackVariant || 'A';
  }
  
  console.log(`[Campaign ${campaignId}] A/B Test results: A=${stats.A.rate.toFixed(4)}, B=${stats.B.rate.toFixed(4)}. Winner: ${winner}`);

  const updatedConfig = { ...abConfig, winner, stats, evaluatedAt: new Date() };
  await campaign.update({ abTestConfig: updatedConfig });

  await emailQueue.add('process-campaign', { campaignId: campaign.id });
}

async function handleAutomationEmail(templateId, subscriberId, orgId) {
  const subscriber = await Subscriber.findByPk(subscriberId);
  const templateModel = await Template.findByPk(templateId);

  if (!subscriber || !templateModel) return;

  // Check suppression
  const isSuppressed = await SuppressionList.findOne({
    where: { email: subscriber.email, orgId }
  });
  if (isSuppressed) return;

  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:4000';
  let processedHtml = templateModel.htmlContent.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi, (match, url) => {
    if (url.startsWith('http')) {
      const trackingUrl = `${baseUrl}/api/track/click/[[LOG_ID]]?url=${encodeURIComponent(url)}`;
      return match.replace(url, trackingUrl);
    }
    return match;
  });
  processedHtml += `<img src="${baseUrl}/api/track/open/[[LOG_ID]]" width="1" height="1" style="display:none;" />`;

  const templateDelegate = Handlebars.compile(processedHtml);
  const subjectDelegate = Handlebars.compile(templateModel.subject);

  await enqueuePersonalizedEmail(subscriber, templateDelegate, subjectDelegate, { orgId });
}

async function enqueuePersonalizedEmail(subscriber, templateDelegate, subjectDelegate, context, variant = null) {
  // Create log first to get ID for placeholder replacement
  const log = await CampaignLog.create({
    ...context,
    subscriberId: subscriber.id,
    status: 'PENDING',
    ab_variant: variant
  });

  // Rapid Placeholder Replacement
  const htmlBody = templateDelegate({
    firstName: subscriber.firstName,
    lastName: subscriber.lastName,
    email: subscriber.email,
    ...subscriber.attributes
  }).replace(/\[\[LOG_ID\]\]/g, log.id);

  const subject = subjectDelegate({
    firstName: subscriber.firstName,
    lastName: subscriber.lastName,
    ...subscriber.attributes
  });

  await deliveryQueue.add('deliver-email', {
    htmlBody,
    subject,
    recipient: subscriber.email,
    logId: log.id,
    campaignId: context.campaignId,
    ab_variant: variant
  });
}


module.exports = worker;
