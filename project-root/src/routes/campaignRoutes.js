const express = require('express');
const router = express.Router();
const authenticateTenant = require('../middleware/auth');
const { db, admin } = require('../config/firebase');
const { Queue } = require('bullmq');
const connection = require('../config/redis');

const emailQueue = new Queue('email-queue', { connection });

// 1. SEND EMAIL (POST /api/v1/campaigns/send)
router.post('/send', authenticateTenant, async (req, res) => {
  const { to, subject, body } = req.body;
  const { tenantId, tenantData } = req;

  try {
    // Quota Check
    if (tenantData.currentUsage >= tenantData.usageLimit) {
      return res.status(403).json({ error: "Quota exceeded. Please upgrade." });
    }

    const campaignId = await db.runTransaction(async (transaction) => {
      const tenantRef = db.collection('tenants').doc(tenantId);
      const campaignRef = db.collection('campaigns').doc();

      transaction.update(tenantRef, {
        currentUsage: admin.firestore.FieldValue.increment(1)
      });

      transaction.set(campaignRef, {
        tenantId,
        subject,
        to,
        status: "queued",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return campaignRef.id;
    });

    await emailQueue.add('dispatch-email', {
      campaignId,
      tenantId,
      from: tenantData.verifiedSender || process.env.SES_FROM_EMAIL,
      to,
      subject,
      body
    });

    res.status(202).json({ success: true, campaignId });
  } catch (error) {
    res.status(500).json({ error: "Failed to queue campaign" });
  }
});

// 2. GET HISTORY (GET /api/v1/campaigns)
router.get('/', authenticateTenant, async (req, res) => {
  try {
    const snapshot = await db.collection('campaigns')
      .where('tenantId', '==', req.tenantId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

module.exports = router;