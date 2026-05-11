const axios = require('axios');
const crypto = require('crypto');

const URL = 'http://localhost:8080/webhook-receive';
const SECRET = 'getloopx_test_secret_123';

async function runTests() {
  const payload = {
    event: 'email.opened',
    timestamp: new Date().toISOString(),
    data: { id: 'test-123' }
  };
  const bodyString = JSON.stringify(payload);

  console.log('--- TEST 1: Valid Signature ---');
  const validSignature = crypto.createHmac('sha256', SECRET).update(bodyString).digest('hex');
  
  try {
    const res1 = await axios.post(URL, payload, {
      headers: { 'X-GetLoopX-Signature': validSignature }
    });
    console.log(`Result: ${res1.status} ${JSON.stringify(res1.data)}`);
  } catch (err) {
    console.log(`Result: Failed! ${err.response?.status} ${JSON.stringify(err.response?.data)}`);
  }

  console.log('\n--- TEST 2: Invalid Signature ---');
  try {
    const res2 = await axios.post(URL, payload, {
      headers: { 'X-GetLoopX-Signature': 'wrong_signature' }
    });
    console.log(`Result: ${res2.status} (FAILED - Should have been 401)`);
  } catch (err) {
    console.log(`Result: ${err.response?.status} ${JSON.stringify(err.response?.data)} (PASSED)`);
  }

  console.log('\n--- TEST 3: Missing Header ---');
  try {
    const res3 = await axios.post(URL, payload);
    console.log(`Result: ${res3.status} (FAILED - Should have been 401)`);
  } catch (err) {
    console.log(`Result: ${err.response?.status} ${JSON.stringify(err.response?.data)} (PASSED)`);
  }
}

// Give the server a second to start
setTimeout(runTests, 2000);
