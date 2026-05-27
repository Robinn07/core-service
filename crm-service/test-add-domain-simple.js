const axios = require('axios');

async function testSimpleAdd() {
  try {
    const res = await axios.post('http://localhost:4000/api/domains', { domainName: 'simple-test.com' });
    console.log('✅ Success:', res.data);
  } catch (error) {
    console.error('❌ Failed:', error.response ? error.response.data : error.message);
  }
}
testSimpleAdd();
