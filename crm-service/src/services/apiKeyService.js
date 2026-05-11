const crypto = require('crypto');
const { ApiKey } = require('../models');

class ApiKeyService {
  /**
   * Generate a new API Key for an organization
   */
  async createKey(orgId, name, scopes = ['full_access']) {
    // 1. Generate a random 32-byte key
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyToProvide = `glx_${rawKey}`;
    
    // 2. Hash the key for storage
    const keyHash = this._hashKey(keyToProvide);
    
    // 3. Store in DB
    const apiKey = await ApiKey.create({
      orgId,
      name,
      keyHash,
      keyPrefix: keyToProvide.substring(0, 8), // glx_abcd...
      scopes
    });

    return {
      apiKey: keyToProvide,
      record: apiKey
    };
  }

  /**
   * Validate an API Key and return the organization ID
   */
  async validateKey(rawKey) {
    const keyHash = this._hashKey(rawKey);
    const apiKey = await ApiKey.findOne({
      where: { keyHash, isActive: true }
    });

    if (!apiKey) return null;

    // Update last used timestamp (async)
    apiKey.update({ lastUsedAt: new Date() }).catch(err => console.error('Failed to update lastUsedAt', err));

    return {
      orgId: apiKey.orgId,
      scopes: apiKey.scopes
    };
  }

  /**
   * Internal: Hash a raw API Key
   */
  _hashKey(rawKey) {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }
}

module.exports = new ApiKeyService();
