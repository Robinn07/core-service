const apiKeyService = require('../services/apiKeyService');
const { ApiKey } = require('../models');

exports.generateKey = async (req, res) => {
  try {
    const { name, scopes } = req.body;
    const orgId = req.user?.orgId;

    if (!name) {
      return res.status(400).json({ error: 'Key name is required' });
    }

    const { apiKey, record } = await apiKeyService.createKey(orgId, name, scopes);
    
    // Return raw API Key ONLY during creation
    res.status(201).json({
      apiKey,
      id: record.id,
      name: record.name,
      mask: record.mask,
      scopes: record.scopes,
      createdAt: record.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getKeys = async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    const keys = await ApiKey.findAll({
      where: { orgId },
      attributes: ['id', 'name', 'mask', 'scopes', 'lastUsedAt', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.revokeKey = async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.orgId;

    const success = await apiKeyService.revokeKey(id, orgId);
    
    if (!success) {
      return res.status(404).json({ error: 'API Key not found or unauthorized' });
    }

    res.json({ message: 'API Key revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
