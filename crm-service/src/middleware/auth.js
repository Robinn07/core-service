const admin = require('../config/firebase');
const logger = require('../utils/logger');
const apiKeyService = require('../services/apiKeyService');
const { UserRole } = require('../models');

const authenticate = async (req, res, next) => {
  // 1. Skip Auth for local dev
  if (process.env.SKIP_AUTH === 'true') {
    req.user = { uid: 'dev-user', email: 'dev@example.com', orgId: 'crm-system', role: 'ADMIN' };
    return next();
  }

  // 2. Check for API Key first (Programmatic access)
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    const keyData = await apiKeyService.validateKey(apiKey);
    if (keyData) {
      req.user = {
        orgId: keyData.orgId,
        isApiKey: true,
        scopes: keyData.scopes
      };
      return next();
    }
    return res.status(403).json({ error: 'Unauthorized: Invalid API Key' });
  }

  // 3. Check for Firebase Bearer Token (Dashboard access)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No credentials provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const orgId = decodedToken.orgId || decodedToken.uid;
    
    // Fetch Role from DB
    const userRole = await UserRole.findOne({ where: { uid: decodedToken.uid, orgId } });
    const role = userRole ? userRole.role : 'ADMIN'; // Default to ADMIN for first user/owner

    req.user = { uid: decodedToken.uid, email: decodedToken.email, orgId, role };
    next();
  } catch (error) {
    logger.error('Auth Error:', error.message);
    res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Sequelize Multi-tenant Scope Hook
 * Automatically injects orgId into all queries.
 */
const injectOrgId = (req) => {
  return (options) => {
    if (!req.user || !req.user.orgId) return;

    options.where = options.where || {};
    options.where.orgId = req.user.orgId;

    // For creates/updates
    if (options.attributes && !options.attributes.orgId) {
      options.attributes.orgId = req.user.orgId;
    }
  };
};

/**
 * RBAC Authorization Middleware
 * @param {string[]} allowedRoles 
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (process.env.SKIP_AUTH === 'true') return next();
    
    // Role Hierarchy
    const roleHierarchy = {
      'ADMIN': ['ADMIN', 'MANAGER', 'EDITOR', 'VIEWER'],
      'MANAGER': ['MANAGER', 'EDITOR', 'VIEWER'],
      'EDITOR': ['EDITOR', 'VIEWER'],
      'VIEWER': ['VIEWER']
    };

    const userRole = req.user?.role || 'VIEWER';
    const effectiveRoles = roleHierarchy[userRole] || ['VIEWER'];

    const isAuthorized = allowedRoles.some(role => effectiveRoles.includes(role));

    if (!req.user || !isAuthorized) {
      return res.status(403).json({ 
        error: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}. Your role: ${userRole}` 
      });
    }
    next();
  };
};

module.exports = { authenticate, injectOrgId, authorize };
