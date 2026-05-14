const { Worker } = require('bullmq');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { db, admin } = require('../config/firebase');
const connection = require('../config/redis');
const { publishEvent } = require('../config/rabbitmq');
const { v4: uuidv4 } = require('uuid');

// Initialize SES 
const ses = new SESClient({ region: process.env.AWS_REGION });

const worker = new Worker('delivery-queue', async (job) => {
  // ✅ Harmonized payload to support both CRM and legacy structures
  const { 
    campaignId, 
    tenantId, 
    orgId,
    to, 
    recipient,
    subject, 
    body, 
    htmlBody,
    from,
    fromEmail,
    logId 
  } = job.data;

  const targetTenantId = tenantId || orgId || 'UNKNOWN';
  const targetRecipient = to || recipient;
  const targetBody = body || htmlBody;
  const targetFrom = from || fromEmail || process.env.SES_FROM_EMAIL;

  const command = new SendEmailCommand({
    Destination: { ToAddresses: [targetRecipient] },
    Message: {
      Body: { Html: { Data: targetBody } },
      Subject: { Data: subject },
    },
    Source: targetFrom,
    // ✅ Added SES Tags for feedback loop tracking
    Tags: [
      { Name: 'orgId', Value: String(targetTenantId) },
      { Name: 'campaignId', Value: String(campaignId || 'none') },
      { Name: 'logId', Value: String(logId || job.id) }
    ]
  });

  try {
    // 1. Send the Email via AWS SES
    const response = await ses.send(command);
    
    // 2. SUCCESS: Update Campaign status & Usage (if campaignId exists in Firebase)
    const batch = db.batch();
    
    // Check if campaignId is a Firebase ID (usually longer/different than SQL IDs)
    // For CRM-integrated sends, we might skip Firebase campaign updates if they aren't synced
    if (campaignId && String(campaignId).length > 10) {
      batch.update(db.collection('campaigns').doc(String(campaignId)), {
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    if (targetTenantId && targetTenantId !== 'UNKNOWN') {
      const tenantRef = db.collection('tenants').doc(String(targetTenantId));
      const tenantDoc = await tenantRef.get();
      if (tenantDoc.exists) {
        batch.update(tenantRef, {
          currentUsage: admin.firestore.FieldValue.increment(1),
          pendingUsage: admin.firestore.FieldValue.increment(-1)
        });
      }
    }
    
    await batch.commit();
    console.log(`✅ Email sent and usage updated for tenant: ${targetTenantId}`);

    // 3. PIPELINE: Publish Event to RabbitMQ for Analytics
    await publishEvent({
      event_id: uuidv4(),
      orgId: targetTenantId,
      userId: targetRecipient,
      event_type: 'email_sent', // ✅ Standardized to lowercase
      channel: 'EMAIL',
      campaignId: campaignId || 'manual',
      timestamp: new Date().toISOString(),
      metadata: {
        subject,
        messageId: response.MessageId,
        jobId: job.id
      }
    });

  } catch (error) {
    console.error(`❌ Worker Error for Job ${job.id}:`, error.message);

    // FAILURE: Log the error in Firestore (temporary status)
    await db.collection('campaigns').doc(campaignId).update({
      status: 'retrying',
      errorMessage: error.message,
      lastErrorAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    throw error; // Re-throw so BullMQ handles retries automatically
  }
}, { connection });

// 🚀 THE DEAD LETTER QUEUE & CLEANUP
worker.on('completed', (job) => {
  console.log(`✨ Job ${job.id} completed successfully`);
});

worker.on('failed', async (job, err) => {
  const { campaignId, tenantId } = job.data;
  
  // Check if this was the final attempt
  if (job.attemptsMade >= job.opts.attempts) {
    console.log(`🚨 Job ${job.id} PERMANENTLY failed after ${job.attemptsMade} attempts`);

    const batch = db.batch();

    // 1. Mark campaign as failed
    batch.update(db.collection('campaigns').doc(campaignId), {
      status: 'failed',
      errorMessage: err.message,
      failedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. REFUND: Decrement pending usage
    if (tenantId) {
      batch.update(db.collection('tenants').doc(tenantId), {
        pendingUsage: admin.firestore.FieldValue.increment(-1)
      });
    }

    // 3. DEAD LETTER QUEUE: Log to failed_campaigns
    const dqlRef = db.collection('failed_campaigns').doc(campaignId);
    batch.set(dqlRef, {
      ...job.data,
      error: err.message,
      attemptsMade: job.attemptsMade,
      failedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
  }
});

console.log("🛠️ Email Worker is active, listening, and tracking usage...");