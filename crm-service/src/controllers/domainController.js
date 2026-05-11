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
    const dnsRecords = await domainService.getDnsRecords(id);
    res.json(dnsRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const domain = await domainService.checkVerificationStatus(id);
    res.json(domain);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
