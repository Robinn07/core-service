// ingestion-service/auth.js
const admin = require('firebase-admin');
const { getFirebaseCredentials } = require('./src/utils/config/loader');
const redis = require('./src/config/redis');
const logger = require('pino')();
const crypto = require('crypto');

if (!admin.apps.length) {
  const serviceAccount = getFirebaseCredentials();
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Shared Firebase Authentication Middleware with RBAC support and Redis Caching.
 */
async function firebaseAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  try {
    // 1. Bearer Token Validation (Dashboard)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Check Revocation List
      const isRevoked = await redis.get(`revoked:${tokenHash}`);
      if (isRevoked) {
        return res.status(403).json({ error: "Token has been revoked" });
      }

      // Check Cache
      const cached = await redis.get(`auth:token:${tokenHash}`);
      if (cached) {
        const decoded = JSON.parse(cached);
        req.tenantId = decoded.uid;
        req.userRole = decoded.role;
        return next();
      }

      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const authData = { uid: decodedToken.uid, role: decodedToken.role || 'viewer' };
        
        // Cache successful auth for 60 seconds
        await redis.set(`auth:token:${tokenHash}`, JSON.stringify(authData), 'EX', 60);

        req.tenantId = authData.uid;
        req.userRole = authData.role;
        return next();
      } catch (firebaseErr) {
        // Fallback: If Firebase is down but we have a valid cache, it was already handled above.
        if (firebaseErr.code === 'app/network-error' || firebaseErr.code === 'auth/internal-error') {
            logger.warn('Firebase Auth unreachable — returning 503');
            res.setHeader('Retry-After', '30');
            return res.status(503).json({ error: "Authentication service temporarily unreachable" });
        }
        throw firebaseErr;
      }
    }

    // 2. API Key Validation (B2B / External)
    if (apiKey) {
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      const cachedKey = await redis.get(`auth:key:${keyHash}`);
      if (cachedKey) {
        const decoded = JSON.parse(cachedKey);
        req.tenantId = decoded.id;
        req.userRole = 'admin';
        return next();
      }

      try {
        const db = admin.firestore();
        const tenantQuery = await db.collection('tenants').where('apiKey', '==', apiKey).limit(1).get();
        
        if (tenantQuery.empty) {
          return res.status(403).json({ error: "Invalid API Key" });
        }
        
        const tenantDoc = tenantQuery.docs[0];
        const tenantData = { id: tenantDoc.id };
        
        await redis.set(`auth:key:${keyHash}`, JSON.stringify(tenantData), 'EX', 60);

        req.tenantId = tenantData.id;
        req.userRole = 'admin';
        return next();
      } catch (dbErr) {
        logger.error({ err: dbErr.message }, 'Database error during API key validation');
        return res.status(503).json({ error: "Authentication database unreachable" });
      }
    }

    return res.status(401).json({ error: "Authentication required" });
  } catch (error) {
    logger.error({ err: error.message }, "Auth Error");
    return res.status(403).json({ error: "Unauthorized" });
  }
}

/**
 * RBAC Helper
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: `Forbidden: Requires one of [${roles}]` });
    }
    next();
  };
};

module.exports = { 
  apiKeyAuth: firebaseAuth,
  authorize 
};
