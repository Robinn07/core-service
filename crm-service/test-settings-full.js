const axios = require('axios');

const ID_TOKEN = "YOUR_ID_TOKEN_HERE"; // This will fail if not replaced, but I'll use a script to get a real one for a quick check or just use the dev skip auth if enabled.

async function testSettings() {
  const BASE_URL = 'http://localhost:4000/api';
  
  // Headers for authenticated requests (Assuming we might need a real token or skip auth is on)
  // For this local test, I'll try to use the SKIP_AUTH=true behavior if I can trigger it, 
  // but better to just hit the endpoints and see if they respond.
  
  console.log('🚀 Starting Settings Integration Tests...');

  try {
    // 1. Test Org Settings Retrieval
    console.log('\n--- 1. Testing Org Settings ---');
    const orgRes = await axios.get(`${BASE_URL}/org/settings`, {
      headers: { 'Authorization': `Bearer ${ID_TOKEN}` }
    });
    console.log('✅ GET /org/settings successful');
    console.log('Data:', JSON.stringify(orgRes.data, null, 2));

    // 2. Test Org Settings Update
    console.log('\n--- 2. Testing Org Settings Update ---');
    const updatePayload = {
      orgName: "LoopX Global HQ",
      supportEmail: "support@loopx.io",
      physicalAddress: "123 Innovation Drive, San Francisco, CA",
      timezone: "America/Los_Angeles",
      defaultFromName: "The LoopX Team"
    };
    const updateRes = await axios.put(`${BASE_URL}/org/settings`, updatePayload, {
      headers: { 'Authorization': `Bearer ${ID_TOKEN}` }
    });
    console.log('✅ PUT /org/settings successful');
    if (updateRes.data.orgName === updatePayload.orgName) {
      console.log('🎉 Data integrity verified!');
    }

    // 3. Test API Key Generation
    console.log('\n--- 3. Testing API Key Generation ---');
    const keyRes = await axios.post(`${BASE_URL}/api-keys`, {
      name: "Integration Test Key",
      scopes: ["full_access"]
    }, {
      headers: { 'Authorization': `Bearer ${ID_TOKEN}` }
    });
    console.log('✅ POST /api-keys successful');
    console.log('New Key:', keyRes.data.apiKey);
    const keyId = keyRes.data.id;

    // 4. Test API Key List
    console.log('\n--- 4. Testing API Key Listing ---');
    const keysListRes = await axios.get(`${BASE_URL}/api-keys`, {
      headers: { 'Authorization': `Bearer ${ID_TOKEN}` }
    });
    console.log(`✅ GET /api-keys successful. Found ${keysListRes.data.length} keys.`);

    // 5. Test Team Members
    console.log('\n--- 5. Testing Team Management ---');
    const teamRes = await axios.get(`${BASE_URL}/team`, {
      headers: { 'Authorization': `Bearer ${ID_TOKEN}` }
    });
    console.log(`✅ GET /team successful. Found ${teamRes.data.length} members.`);

    console.log('\n✨ ALL INTEGRATION TESTS PASSED!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

testSettings();
