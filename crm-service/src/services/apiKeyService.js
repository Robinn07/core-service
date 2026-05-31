const crypto = require('crypto');
const { ApiKey } = require('../models');
const redis = require('../config/redis');

class ApiKeyService {
  /**
   * Generate a new secure API Key for an organization
   */
  async createKey(orgId, name, scopes = ['full_access']) {
    // 1. Generate a random 32-byte key with custom prefix
    const prefix = 'glx_';
    const rawEntropy = crypto.randomBytes(32).toString('hex');
    const rawKey = `${prefix}${rawEntropy}`;
    
    // 2. Hash the key for secure storage (SHA-256)
    const keyHash = this._hashKey(rawKey);
    
    // 3. Create a UI-friendly mask (e.g., glx_dda9********)
    const mask = `${rawKey.substring(0, 8)}********${rawKey.substring(rawKey.length - 4)}`;
    
    // 4. Store in DB
    const apiKey = await ApiKey.create({
      orgId,
      name,
      keyHash,
      mask,
      scopes
    });

    return {
      apiKey: rawKey, // Raw key returned ONLY once
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

    // 1. Try Cache Lookup (Latency < 1ms)
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        // Async update lastUsedAt in DB (don't block the request)
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

    const authData = {
      id: apiKey.id,
      orgId: apiKey.orgId,
      scopes: apiKey.scopes
    };

    // 3. Populate Cache (TTL 1 hour)
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(authData));
    } catch (err) {
      console.error('Failed to set Redis cache:', err);
    }

    // Async update lastUsedAt in DB
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
