const axios = require('axios');

async function testUpdateCampaign() {
  try {
    // 1. Get a template
    const templatesRes = await axios.get('http://localhost:4000/api/templates');
    const templateId = templatesRes.data[0].id;

    // 2. Create a campaign
    const createRes = await axios.post('http://localhost:4000/api/campaigns', { 
        name: 'Initial Name',
        type: 'REGULAR'
    });
    const campaignId = createRes.data.id;
    console.log(`Created campaign: ${campaignId}`);

    // 3. Update the campaign (the step that was failing in frontend)
    console.log('Updating campaign with name and templateId...');
    const updateRes = await axios.put(`http://localhost:4000/api/campaigns/${campaignId}`, {
        name: 'Updated Name',
        templateId: templateId
    });

    console.log('✅ Update successful:', JSON.stringify(updateRes.data, null, 2));
    if (updateRes.data.templateId === templateId && updateRes.data.name === 'Updated Name') {
        console.log('🎉 Verification passed: Name and templateId are correctly saved!');
    } else {
        console.error('❌ Verification failed: Values did not update as expected.');
    }

  } catch (error) {
    console.error('❌ Campaign update failed:', error.response ? error.response.data : error.message);
  }
}

testUpdateCampaign();
