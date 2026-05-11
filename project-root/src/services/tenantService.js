const { admin, db } = require('../config/firebase');
const crypto = require('crypto');

/**
 * PRODUCTION-GRADE AUTO-PROVISIONING
 * This ensures every user gets a private space the moment they sign up.
 */
const provisionTenant = async (user) => {
  const tenantRef = db.collection('tenants').doc(user.uid);
  const doc = await tenantRef.get();

  if (!doc.exists) {
    // Generate a high-entropy API key for their external integrations
    const apiKey = `lx_live_${crypto.randomBytes(32).toString('hex')}`;

    const newTenantData = {
      tenantId: user.uid,
      name: user.displayName || "New Workspace",
      email: user.email,
      apiKey: apiKey,
      plan: "free",
      usageLimit: 1000, // Monthly quota
      currentUsage: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "active",
      config: {
        region: "us-east-1",
        trackingEnabled: true
      }
    };

    await tenantRef.set(newTenantData);
    console.log(`✅ Provisioned workspace for ${user.uid}`);
    return newTenantData;
  }

  return doc.data();
};

/**
 * PRODUCTION-GRADE CAMPAIGN CREATOR
 * Forces the tenantId to match the requester's ID.
 */
const createCampaign = async (userId, campaignDetails) => {
  const campaignData = {
    ...campaignDetails,
    tenantId: userId, // CRITICAL: Strict isolation
    status: 'queued',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    stats: {
      sent: 0,
      opened: 0,
      clicked: 0
    }
  };

  const ref = await db.collection('campaigns').add(campaignData);
  return { id: ref.id, ...campaignData };
};

module.exports = { provisionTenant, createCampaign };