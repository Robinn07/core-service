const { admin, db } = require('../config/firebase');
const crypto = require('crypto');

const authenticateTenant = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  try {
    let tenantId;
    let tenantData;

    // SCENARIO 1: Bearer Token (Dashboard/Script login)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      tenantId = decodedToken.uid;

      // Check if tenant exists, if not, create them (Auto-Provisioning)
      let tenantDoc = await db.collection('tenants').doc(tenantId).get();
      
      if (!tenantDoc.exists) {
        console.log(`🚀 Provisioning new workspace for: ${decodedToken.email}`);
        const newKey = `lx_live_${crypto.randomBytes(24).toString('hex')}`;
        tenantData = {
          name: decodedToken.name || "Asif Solanki",
          email: decodedToken.email,
          apiKey: newKey,
          plan: "Free",
          usageLimit: 1000,
          currentUsage: 0,
          pendingUsage: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "active"
        };
        await db.collection('tenants').doc(tenantId).set(tenantData);
      } else {
        tenantData = tenantDoc.data();
      }
    } 
    // SCENARIO 2: API Key (B2B Automation)
    else if (apiKey) {
      const tenantQuery = await db.collection('tenants').where('apiKey', '==', apiKey).limit(1).get();
      if (tenantQuery.empty) return res.status(403).json({ error: "Invalid API Key" });
      
      const tenantDoc = tenantQuery.docs[0];
      tenantId = tenantDoc.id;
      tenantData = tenantDoc.data();
    } else {
      return res.status(401).json({ error: "Authentication required" });
    }

    // ✅ THE LAST MILE GUARD: Check Usage Limit
    const totalUsage = (tenantData.currentUsage || 0) + (tenantData.pendingUsage || 0);
    if (totalUsage >= tenantData.usageLimit) {
      return res.status(403).json({ 
        error: "Usage limit exceeded. Please upgrade your plan." 
      });
    }

    // Attach to request for use in routes
    req.tenantId = tenantId;
    req.tenantData = tenantData;
    return next();

  } catch (error) {
    console.error("Auth Error:", error.message);
    return res.status(403).json({ error: "Security validation failed" });
  }
};

module.exports = authenticateTenant;