require('dotenv').config();
const webhookService = require('./src/services/webhookService');
const { WebhookSubscription } = require('./src/models');

async function testWebhooks() {
  const orgId = 'test-org-123';
  const testUrl = 'https://webhook.site/your-unique-id'; // You can use webhook.site for testing
  
  console.log("Setting up test webhook subscription...");

  try {
    // 1. Create a subscription
    const sub = await WebhookSubscription.create({
      orgId,
      url: testUrl,
      events: ['email.opened', 'email.clicked'],
      secret: 'super-secret-key'
    });
    console.log("✅ Subscription created:", sub.id);

    // 2. Dispatch a dummy event
    console.log("Dispatching test 'email.opened' event...");
    await webhookService.dispatch(orgId, 'email.opened', {
      campaignId: 'camp-1',
      subscriberId: 'sub-1',
      email: 'test@example.com'
    });

    console.log("✅ Event dispatched to queue! (Make sure your Redis and Worker are running)");

  } catch (error) {
    console.error("❌ Test Failed:", error.message);
  } finally {
    process.exit();
  }
}

testWebhooks();
