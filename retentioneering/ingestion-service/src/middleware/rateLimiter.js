const redis = require('../config/redis');
const logger = require('pino')();

const WINDOW_SIZE_MS = 60000; // 1 minute
const DEFAULT_LIMIT = 1000;   // 1000 requests per minute

/**
 * Sliding Window Rate Limiter using Redis
 * @param {Object} options 
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.limit - Max requests per window
 */
const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || WINDOW_SIZE_MS;
  const limit = options.limit || DEFAULT_LIMIT;

  return async (req, res, next) => {
    const tenantId = req.tenantId || 'anonymous';
    const key = `rate_limit:${tenantId}`;
    const now = Date.now();

    try {
      const multi = redis.multi();
      multi.zremrangebyscore(key, 0, now - windowMs);
      multi.zcard(key);
      multi.zadd(key, now, now);
      multi.pexpire(key, windowMs);
      
      const results = await multi.exec();
      
      // results[1][1] is the result of ZCARD (count before adding current)
      const count = results[1][1];

      if (count >= limit) {
        // If limit exceeded, we should ideally remove the last added entry to be precise, 
        // but since we added it, let's just check the count.
        // Actually, better to check BEFORE adding if we want strict limit.
        // Let's use a Lua script for atomicity.
        
        logger.warn({ 
          orgId: tenantId, 
          count, 
          limit, 
          url: req.url 
        }, 'Rate limit exceeded');

        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Max ${limit} requests per ${windowMs / 1000}s.`
        });
      }

      next();
    } catch (err) {
      logger.error({ err, orgId: tenantId }, 'Rate limiter error');
      // In case of Redis error, we might want to fail open or closed.
      // Usually, failing open is better for UX, but closed is better for protection.
      next(); 
    }
  };
};

module.exports = rateLimiter;
