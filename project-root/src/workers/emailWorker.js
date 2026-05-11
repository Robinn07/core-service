const { Worker } = require('bullmq');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { db, admin } = require('../config/firebase');
const connection = require('../config/redis');
const { publishEvent } = require('../config/rabbitmq');
const { v4: uuidv4 } = require('uuid');

// Initialize SES 
const ses = new SESClient({ region: process.env.AWS_REGION });

const worker = new Worker('email-queue', async (job) => {
  // ✅ Added tenantId to the destructured data
  const { campaignId, tenantId, to, subject, body, from } = job.data;

  const command = new SendEmailCommand({
    Destination: { ToAddresses: [to] },
    Message: {
      Body: { Html: { Data: body } },
      Subject: { Data: subject },
    },
    Source: from || process.env.SES_FROM_EMAIL,
  });

  try {
    // 1. Send the Email via AWS SES
    await ses.send(command);
    
    // 2. SUCCESS: Update Campaign status & Usage
    const batch = db.batch();
    
    batch.update(db.collection('campaigns').doc(campaignId), {
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (tenantId) {
      batch.update(db.collection('tenants').doc(tenantId), {
        currentUsage: admin.firestore.FieldValue.increment(1),
        pendingUsage: admin.firestore.FieldValue.increment(-1)
      });
    }
    
    await batch.commit();
    console.log(`✅ Email sent and usage updated for tenant: ${tenantId}`);

    // 3. PIPELINE: Publish Event to RabbitMQ for Analytics
    await publishEvent({
      event_id: uuidv4(),
      orgId: tenantId || 'UNKNOWN',
      userId: to,
      event_type: 'Campaign_Sent',
      channel: 'EMAIL',
      campaignId: campaignId,
      timestamp: new Date().toISOString(),
      metadata: {
        subject,
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