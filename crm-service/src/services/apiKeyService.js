const crypto = require('crypto');
const { ApiKey } = require('../models');
const redis = require('../config/redis');
const logger = require('../utils/logger');

const ALLOWED_SCOPES = ['full_access', 'read_only', 'marketing_only'];

class ApiKeyService {
  /**
   * Generate a new secure API Key for an organization
   */
  async createKey(orgId, name, scopes = ['full_access']) {
    // 1. Validate Scopes
    const invalidScopes = scopes.filter(s => !ALLOWED_SCOPES.includes(s));
    if (invalidScopes.length > 0) {
      throw new Error(`Invalid scopes: ${invalidScopes.join(', ')}`);
    }

    // 2. Generate a random 32-byte key
    const prefix = 'glx_';
    const rawEntropy = crypto.randomBytes(32).toString('hex');
    const rawKey = `${prefix}${rawEntropy}`;
    
    // 3. Hash the key for secure storage (SHA-256)
    const keyHash = this._hashKey(rawKey);
    
    // 4. Create a UI-friendly mask
    const mask = `${rawKey.substring(0, 8)}********${rawKey.substring(rawKey.length - 4)}`;
    
    // 5. Set Expiration (90 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);
    
    // 6. Store in DB
    const apiKey = await ApiKey.create({
      orgId,
      name,
      keyHash,
      mask,
      scopes,
      expiresAt
    });

    logger.info({ orgId, apiKeyId: apiKey.id }, 'API Key created');

    return {
      apiKey: rawKey,
      record: apiKey
    };
  }

  /**
   * High-performance validation with Redis caching
   */
  async validateKey(rawKey) {
    if (!rawKey) return null;
    
    const keyHash = this._hashKey(rawKey);
    const cacheKey = `auth:apikey:${keyHash}`;

    // 1. Try Cache Lookup
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        // Check expiration
        if (new Date() > new Date(data.expiresAt)) {
            await this.revokeKey(data.id, data.orgId);
            return null;
        }
        this._updateLastUsed(data.id);
        return data;
      }
    } catch (err) {
      console.error('Redis Cache Error:', err);
    }

    // 2. DB Fallback
    const apiKey = await ApiKey.findOne({
      where: { keyHash, isActive: true }
    });

    if (!apiKey) return null;
    
    // Check expiration
    if (new Date() > new Date(apiKey.expiresAt)) {
        await this.revokeKey(apiKey.id, apiKey.orgId);
        logger.info({ apiKeyId: apiKey.id }, 'API Key expired and revoked');
        return null;
    }

    const authData = {
      id: apiKey.id,
      orgId: apiKey.orgId,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt
    };

    // 3. Populate Cache
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(authData));
    } catch (err) {
      console.error('Failed to set Redis cache:', err);
    }

    this._updateLastUsed(apiKey.id);

    return authData;
  }

  /**
   * Revoke an API Key and invalidate cache instantly
   */
  async revokeKey(id, orgId) {
    const apiKey = await ApiKey.findOne({ where: { id, orgId } });
    if (!apiKey) return false;

    // 1. Invalidate Cache
    const cacheKey = `auth:apikey:${apiKey.keyHash}`;
    await redis.del(cacheKey);

    // 2. Update DB status
    await apiKey.update({ isActive: false });
    
    logger.info({ orgId, apiKeyId: id }, 'API Key revoked');
    return true;
  }

  /**
   * Internal: SHA-256 Hashing
   */
  _hashKey(rawKey) {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  /**
   * Internal: Async update of lastUsed timestamp
   */
  async _updateLastUsed(id) {
    try {
      await ApiKey.update({ lastUsedAt: new Date() }, { where: { id } });
    } catch (err) {
      console.error('Failed to update lastUsedAt:', err);
    }
  }
}

module.exports = new ApiKeyService();
