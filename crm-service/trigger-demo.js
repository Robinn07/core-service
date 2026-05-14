require('dotenv').config();
const axios = require('axios');

async function triggerDemo() {
  console.log('🚀 Triggering Demo Campaign for Integration Verification...');
  
  const BASE_URL = process.env.CRM_API_URL || 'http://localhost:4000';
  
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // 1. Create a dummy campaign
    console.log('Step 1: Creating Campaign...');
    const campaignResponse = await axios.post(`${BASE_URL}/api/campaigns`, {
      name: 'Integration Verification Demo',
      type: 'REGULAR',
      templateId: '7b938007-ec17-4877-8a93-9c5dbd55357a', 
      segmentConfig: { listIds: ['b3877205-f6e8-48e2-b872-ecab1d5cfcac'] }
    });

    const campaignId = campaignResponse.data.id;
    console.log(`✅ Campaign created with ID: ${campaignId}`);

    // 2. Trigger Send
    console.log('Step 2: Triggering Send...');
    await axios.post(`${BASE_URL}/api/campaigns/${campaignId}/send`, {});

    console.log('✅ Campaign queued for delivery!');
    console.log('\n--- Trace Guide ---');
    console.log(`1. Check BullMQ: Job should move from 'email-queue' (CRM) to 'delivery-queue' (Delivery).`);
    console.log(`2. Check Logs: 'project-root' worker should log "Email sent and usage updated".`);
    console.log(`3. Check Analytics: 'email_sent' event should appear in ClickHouse.`);
    
  } catch (error) {
    console.error('❌ Demo Trigger Failed:', error.response?.data || error.message);
  }
}

triggerDemo();
