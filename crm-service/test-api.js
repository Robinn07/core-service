const axios = require('axios');

const ID_TOKEN = "YOUR_ID_TOKEN_HERE";

async function testApi() {
  try {
    const response = await axios.get('http://localhost:4000/api/subscribers', {
      headers: {
        Authorization: `Bearer ${ID_TOKEN}`
      }
    });
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    if (response.data.subscribers) {
        console.log('Subscribers count:', response.data.subscribers.length);
    }
    console.log('✅ API check passed!');
  } catch (error) {
    console.error('API check failed:', error.response ? error.response.data : error.message);
  }
}

testApi();
