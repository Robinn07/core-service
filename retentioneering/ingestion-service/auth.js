// ingestion-service/auth.js
const admin = require('firebase-admin');
const { getFirebaseCredentials } = require('./src/utils/config/loader');

if (!admin.apps.length) {
  const serviceAccount = getFirebaseCredentials();
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const redis = require('./src/config/redis');

/**
 * Shared Firebase Authentication Middleware with RBAC support.
 */
async function firebaseAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  try {
    // 1. Bearer Token Validation (Dashboard)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      req.tenantId = decodedToken.uid;
      req.userRole = decodedToken.role || 'viewer';
      
      return next();
    }

    // 2. API Key Validation (B2B / External) with Redis Cache
    if (apiKey) {
      // Check Cache First
      const cacheKey = `api_key_auth:${apiKey}`;
      const cachedTenantId = await redis.get(cacheKey);
      
      if (cachedTenantId) {
        req.tenantId = cachedTenantId;
        req.userRole = 'admin';
        return next();
      }

      const db = admin.firestore();
      const tenantQuery = await db.collection('tenants').where('apiKey', '==', apiKey).limit(1).get();
      
      if (tenantQuery.empty) {
        return res.status(403).json({ error: "Invalid API Key" });
      }
      
      const tenantDoc = tenantQuery.docs[0];
      const tenantId = tenantDoc.id;

      // Cache for 10 minutes
      await redis.setex(cacheKey, 600, tenantId);

      req.tenantId = tenantId;
      req.userRole = 'admin';
      
      return next();
    }

    return res.status(401).json({ error: "Authentication required" });
  } catch (error) {
    console.error("Auth Error:", error.message);
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
