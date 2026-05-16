const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function runTest() {
  try {
    console.log('--- Starting E2E Campaign Test ---');

    // 1. Seed Subscriber
    console.log('1. Seeding Subscriber...');
    const subRes = await axios.post(`${BASE_URL}/subscribers`, {
      email: 'abutalhasolanki@gmail.com',
      firstName: 'Talha',
      lastName: 'Solanki',
      attributes: { plan: 'Enterprise', company: 'GetLoopX' }
    }).catch(err => {
        if (err.response && err.response.data.error === 'Subscriber already exists') {
            console.log('Subscriber already exists, proceeding...');
            return { data: { email: 'abutalhasolanki@gmail.com' } };
        }
        throw err;
    });
    console.log('Subscriber ready.');

    // 2. Create Template
    console.log('2. Creating Template...');
    const tempRes = await axios.post(`${BASE_URL}/templates`, {
      name: 'Welcome CLI Template',
      subject: 'Welcome to GetLoopX, {{firstName}}!',
      htmlContent: '<h1>Hi {{firstName}}!</h1><p>Welcome to the {{plan}} plan at {{company}}.</p>'
    });
    const templateId = tempRes.data.id;
    console.log(`Template created: ${templateId}`);

    // 3. Create Campaign
    console.log('3. Creating Campaign...');
    const campRes = await axios.post(`${BASE_URL}/campaigns`, {
      name: 'E2E Test Campaign',
      templateId: templateId,
      segmentConfig: { attributes: { plan: 'Enterprise' } }
    });
    const campaignId = campRes.data.id;
    console.log(`Campaign created: ${campaignId}`);

    // 4. Trigger Send
    console.log('4. Triggering Send...');
    const sendRes = await axios.post(`${BASE_URL}/campaigns/${campaignId}/send`);
    console.log('Send response:', sendRes.data);

    console.log('--- Test Flow Complete ---');
    console.log('Monitor the server logs to see BullMQ and SES processing.');

  } catch (error) {
    console.error('Test Failed:', error.response ? error.response.data : error.message);
  }
}

runTest();
