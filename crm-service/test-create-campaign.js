const axios = require('axios');

async function testCreateCampaign() {
  try {
    // 1. Get a template first
    const templatesRes = await axios.get('http://localhost:4000/api/templates');
    if (!templatesRes.data || templatesRes.data.length === 0) {
      console.error('No templates found. Please seed the database or create a template first.');
      return;
    }
    const templateId = templatesRes.data[0].id;
    console.log(`Using template: ${templateId}`);

    // 2. Try to create a campaign
    const campaignData = {
      name: `Test Campaign ${Date.now()}`,
      type: 'REGULAR',
      templateId: templateId,
      segmentConfig: { all: true }
    };

    console.log('Sending campaign data:', JSON.stringify(campaignData, null, 2));

    const response = await axios.post('http://localhost:4000/api/campaigns', campaignData);
    console.log('✅ Campaign created successfully');
    console.log('Keys in response:', Object.keys(response.data));
    console.log('templateId value:', response.data.templateId);
    console.log('TemplateId value:', response.data.TemplateId);
    console.log('template_id value:', response.data.template_id);

  } catch (error) {
    console.error('❌ Campaign creation failed:', error.response ? error.response.data : error.message);
  }
}

testCreateCampaign();
