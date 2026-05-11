const { db } = require('../config/firebase');
const crypto = require('crypto');

/**
 * REGENERATE API KEY
 * Instantly replaces the old key with a new one
 */
const regenerateApiKey = async (req, res) => {
  try {
    const { tenantId } = req;
    const newKey = `lx_live_${crypto.randomBytes(32).toString('hex')}`;

    await db.collection('tenants').doc(tenantId).update({
      apiKey: newKey,
      keyUpdatedAt: new Date()
    });

    res.status(200).json({
      message: "API Key regenerated successfully",
      newKey: newKey
    });
  } catch (error) {
    console.error("Regeneration Error:", error);
    res.status(500).json({ error: "Failed to rotate API Key" });
  }
};

module.exports = {
  regenerateApiKey
};