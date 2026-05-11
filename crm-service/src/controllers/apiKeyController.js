const apiKeyService = require('../services/apiKeyService');
const { ApiKey } = require('../models');

exports.generateKey = async (req, res) => {
  try {
    const { name, scopes } = req.body;
    const orgId = req.user?.orgId || req.headers['x-org-id'];

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const { apiKey, record } = await apiKeyService.createKey(orgId, name, scopes);
    
    // We only return the raw API Key ONCE during creation
    res.status(201).json({
      apiKey,
      id: record.id,
      name: record.name,
      scopes: record.scopes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getKeys = async (req, res) => {
  try {
    const orgId = req.user?.orgId || req.headers['x-org-id'];
    const keys = await ApiKey.findAll({
      where: { orgId },
      attributes: ['id', 'name', 'keyPrefix', 'scopes', 'lastUsedAt', 'isActive', 'createdAt']
    });
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.revokeKey = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.orgId || req.headers['x-org-id'];

    const apiKey = await ApiKey.findOne({ where: { id, orgId } });
    if (!apiKey) {
      return res.status(404).json({ error: 'API Key not found' });
    }

    await apiKey.update({ isActive: false });
    res.json({ message: 'API Key revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
