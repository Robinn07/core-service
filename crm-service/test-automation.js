const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function runAutomationTest() {
  try {
    console.log('--- Starting Automation Test ---');

    // 1. Get a template ID (reuse the one from previous test if possible)
    console.log('1. Fetching templates...');
    const tempRes = await axios.get(`${BASE_URL}/templates`);
    const templateId = tempRes.data[0].id;
    console.log(`Using Template ID: ${templateId}`);

    // 2. Create Automation
    console.log('2. Creating Automation (Welcome Flow)...');
    const autoRes = await axios.post(`${BASE_URL}/automations`, {
      name: 'User Welcome Flow',
      triggerType: 'subscriber_created',
      actions: [
        {
          type: 'send_email',
          templateId: templateId,
          delay: 0, // Immediate
          order: 1
        },
        {
          type: 'send_email',
          templateId: templateId,
          delay: 10, // 10 seconds delay for testing (usually 24h)
          order: 2
        }
      ]
    });
    console.log('Automation created successfully.');

    // 3. Trigger Automation by creating a new subscriber
    const testEmail = `automation-user-${Date.now()}@gmail.com`;
    console.log(`3. Creating new subscriber: ${testEmail}`);
    const subRes = await axios.post(`${BASE_URL}/subscribers`, {
      email: testEmail,
      firstName: 'Automation',
      lastName: 'Tester',
      attributes: { plan: 'Trial' }
    });
    console.log('Subscriber created. Trigger emitted.');

    console.log('--- Test Initiation Complete ---');
    console.log('Monitor server logs. You should see TWO email send attempts:');
    console.log('1. One immediate.');
    console.log('2. One after 10 seconds.');

  } catch (error) {
    console.error('Automation Test Failed:', error.response ? error.response.data : error.message);
  }
}

runAutomationTest();
