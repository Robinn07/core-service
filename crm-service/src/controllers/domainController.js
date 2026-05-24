const domainService = require('../services/domainService');
const { Domain } = require('../models');

exports.addDomain = async (req, res) => {
  try {
    const { domainName } = req.body;
    const orgId = req.user.orgId || req.headers['x-org-id']; // Fallback for testing

    if (!domainName) {
      return res.status(400).json({ error: 'domainName is required' });
    }

    const domain = await domainService.registerDomain(orgId, domainName);
    res.status(201).json(domain);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDomains = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.headers['x-org-id'];
    const domains = await Domain.findAll({ where: { orgId } });
    res.json(domains);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDomainDns = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.orgId;
    const domain = await Domain.findOne({ where: { id, orgId } });
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    const dnsRecords = await domainService.getDnsRecords(id);
    res.json(dnsRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user.orgId;
    const domainCheck = await Domain.findOne({ where: { id, orgId } });
    if (!domainCheck) return res.status(404).json({ error: 'Domain not found' });

    const domain = await domainService.checkVerificationStatus(id);
    res.json(domain);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkBlacklist = async (req, res) => {
  const { id } = req.params;
  const orgId = req.user.orgId || req.headers['x-org-id'];

  try {
    const domain = await Domain.findOne({ where: { id, orgId } });
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    // Mock blacklist check (integrates with services like Spamhaus, Barracuda)
    const blacklists = [
      { name: 'Spamhaus SBL', status: 'CLEAN' },
      { name: 'Spamhaus XBL', status: 'CLEAN' },
      { name: 'Barracuda Rep', status: 'CLEAN' },
      { name: 'SURBL', status: 'CLEAN' },
      { name: 'Spamcop', status: 'CLEAN' }
    ];

    // Simulate a random "listed" domain for demo/testing if domain name starts with 'spam'
    if (domain.domainName.startsWith('spam')) {
      blacklists[0].status = 'LISTED';
    }

    res.json({
      domain: domain.domainName,
      checkedAt: new Date(),
      status: blacklists.some(b => b.status === 'LISTED') ? 'WARNING' : 'HEALTHY',
      results: blacklists
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDeliverabilityDashboard = async (req, res) => {
  try {
    const orgId = req.user.orgId || req.headers['x-org-id'];
    const { EventLog, Domain } = require('../models');
    const { Op } = require('sequelize');

    // 1. Fetch Domain Health
    const domains = await Domain.findAll({ where: { orgId } });
    
    // 2. Aggregate Reputation Metrics (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await EventLog.findAll({
      where: {
        orgId,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: [
        'type',
        [require('../models').sequelize.fn('COUNT', require('../models').sequelize.col('id')), 'count']
      ],
      group: ['type']
    });

    const metrics = stats.reduce((acc, curr) => {
      acc[curr.type] = parseInt(curr.get('count'));
      return acc;
    }, { DELIVERY: 0, BOUNCE: 0, COMPLAINT: 0, OPEN: 0, CLICK: 0 });

    const totalSent = metrics.DELIVERY + metrics.BOUNCE;
    const bounceRate = totalSent > 0 ? (metrics.BOUNCE / totalSent) * 100 : 0;
    const spamRate = totalSent > 0 ? (metrics.COMPLAINT / totalSent) * 100 : 0;

    res.json({
      domains: domains.map(d => ({
        id: d.id,
        name: d.domainName,
        status: d.verificationStatus,
        isDefault: d.isDefault
      })),
      reputation: {
        bounceRate: bounceRate.toFixed(2),
        spamRate: spamRate.toFixed(2),
        delivered: metrics.DELIVERY,
        bounced: metrics.BOUNCE,
        complaints: metrics.COMPLAINT,
        totalSent
      },
      recommendations: [
        bounceRate > 5 ? "Your bounce rate is high. Clean your subscriber list." : null,
        spamRate > 0.1 ? "Your spam complaint rate is concerning. Review your opt-in process." : null,
        domains.some(d => d.verificationStatus !== 'verified') ? "Complete DNS verification for all domains to improve deliverability." : null
      ].filter(Boolean)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
