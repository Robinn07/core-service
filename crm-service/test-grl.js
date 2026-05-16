const { Campaign, Template, Subscriber, CampaignLog } = require('./src/models');
const { sequelize } = require('./src/config/db');
const deliveryQueue = require('./src/queue/deliveryQueue');
const emailQueue = require('./src/queue/emailQueue');

async function verifyGRL() {
  const orgId = 'grl-verify-' + Date.now();
  
  try {
    console.log('--- GRL Verification Test ---');

    // 1. Seed Data (50 subscribers to observe 14/sec rate)
    console.log('Seeding 50 subscribers...');
    const subscribers = [];
    for (let i = 0; i < 50; i++) {
      subscribers.push({
        email: `grl-user-${i}@example.com`,
        orgId,
        status: 'active',
        firstName: 'GRL',
        attributes: { test: 'true' }
      });
    }
    await Subscriber.bulkCreate(subscribers);

    const template = await Template.create({
      name: 'GRL Test Template',
      subject: 'GRL Verification',
      htmlContent: '<h1>GRL Test</h1><p>Testing rate limiting logic.</p>',
      orgId
    });

    const campaign = await Campaign.create({
      name: 'GRL Campaign',
      templateId: template.id,
      orgId
    });

    console.log('Triggering campaign...');
    await emailQueue.add('process-campaign', { campaignId: campaign.id });

    console.log('\nMonitoring Delivery Queue...');
    console.log('Observe the terminal logs for "Processed" and "Enqueued" messages.');
    console.log('Since the rate is 14/sec, 50 emails should take ~4 seconds to clear.');

    // Wait a bit to allow processing
    setTimeout(async () => {
        const counts = await deliveryQueue.getJobCounts();
        console.log('\nDelivery Queue Status:', counts);
        
        // Cleanup (optional, but good for cleanliness)
        // await Subscriber.destroy({ where: { orgId } });
        // await Campaign.destroy({ where: { orgId } });
        // await Template.destroy({ where: { orgId } });
        
        console.log('\nVerification script finished enqueuing. Keep workers running to see GRL in action.');
        process.exit(0);
    }, 5000);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verifyGRL();
