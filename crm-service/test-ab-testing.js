const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function runABTest() {
  try {
    console.log('--- Starting A/B Testing Framework Test ---');

    // 1. Seed Multiple Subscribers
    console.log('1. Seeding Subscribers...');
    for (let i = 1; i <= 10; i++) {
        await axios.post(`${BASE_URL}/subscribers`, {
            email: `test${i}@example.com`,
            firstName: `User${i}`,
            lastName: 'Test',
            attributes: { segment: 'ab-test' }
        }).catch(() => {});
    }
    console.log('Subscribers ready.');

    // 2. Create Template
    console.log('2. Creating Template...');
    const tempRes = await axios.post(`${BASE_URL}/templates`, {
      name: 'A/B Test Template',
      subject: 'Original Subject',
      htmlContent: '<h1>Hello!</h1><p>Test content.</p>'
    });
    const templateId = tempRes.data.id;
    console.log(`Template created: ${templateId}`);

    // 3. Create A/B Test Campaign
    console.log('3. Creating A/B Test Campaign...');
    const campRes = await axios.post(`${BASE_URL}/campaigns`, {
      name: 'A/B Test Campaign',
      templateId: templateId,
      type: 'AB_TEST',
      segmentConfig: { 
        logic: 'AND',
        conditions: [
            { field: 'attr.segment', operator: 'eq', value: 'ab-test' }
        ] 
      },
      abTestConfig: {
        variantA: { subject: 'Subject A: Special Offer!' },
        variantB: { subject: 'Subject B: Don\'t miss out!' },
        testSize: 40, // 40% of 10 = 4 subscribers
        testDuration: 0.001, // Very short for testing
        testMetric: 'open_count'
      }
    });
    const campaignId = campRes.data.id;
    console.log(`Campaign created: ${campaignId}`);

    // 4. Trigger Send
    console.log('4. Triggering A/B Test...');
    await axios.post(`${BASE_URL}/campaigns/${campaignId}/send`);
    
    console.log('A/B Test triggered. Status should be TESTING.');
    console.log('Check server logs for "Starting A/B Test" and "Enqueued X delivery jobs".');
    console.log('After the test duration, it will pick a winner and resume sending.');

    console.log('--- Test Script Finished ---');

  } catch (error) {
    console.error('Test Failed:', error.response ? error.response.data : error.message);
  }
}

runABTest();
