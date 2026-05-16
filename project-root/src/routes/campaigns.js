const express = require('express');
const router = express.Router();
const authenticateTenant = require('../middleware/auth');
const { db, admin } = require('../config/firebase');
const emailQueue = require('../queue/emailQueue');

// POST /api/v1/campaigns/send
router.post('/send', authenticateTenant, async (req, res) => {
  const { to, subject, body } = req.body;
  const { tenantId, tenantData } = req;

  // Basic validation to prevent empty emails
  if (!to || !subject || !body) {
    return res.status(400).json({ error: "Missing required fields: to, subject, or body" });
  }

  try {
    // 1. ATOMIC TRANSACTION: Create Campaign & Increment Usage
    // We do this in one block so if the DB fails, nothing is charged
    const campaignId = await db.runTransaction(async (transaction) => {
      const tenantRef = db.collection('tenants').doc(tenantId);
      const campaignRef = db.collection('campaigns').doc(); // Auto-generate ID

      // Create the campaign record
      transaction.set(campaignRef, {
        tenantId: tenantId,
        subject: subject,
        recipient: to,
        body: body, // Stored for history
        status: "queued",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          plan: tenantData.plan || "Free"
        }
      });

      // Increment the user's pending usage count by 1 in Firestore
      transaction.update(tenantRef, {
        pendingUsage: admin.firestore.FieldValue.increment(1)
      });

      return campaignRef.id;
    });

    // 2. PUSH TO WORKER (BullMQ)
    // This moves the heavy lifting to your Redis-backed worker
    await emailQueue.add('send-email', {
      campaignId,
      tenantId,
      to,
      subject,
      body,
      // Uses your verified sender from .env as fallback
      from: process.env.SES_FROM_EMAIL 
    }, {
      attempts: 3, // Retry 3 times if AWS SES fails
      backoff: { 
        type: 'exponential', 
        delay: 2000 
      }
    });

    // 3. SUCCESS RESPONSE
    res.status(202).json({
      success: true,
      campaignId: campaignId,
      message: "Email queued successfully",
      // Calculated remaining quota to show in your frontend
      remainingQuota: tenantData.usageLimit - ((tenantData.currentUsage || 0) + (tenantData.pendingUsage || 0) + 1)
    });

  } catch (error) {
    console.error("Campaign Route Error:", error);
    res.status(500).json({ error: "Internal server error while queuing campaign" });
  }
});

module.exports = router;