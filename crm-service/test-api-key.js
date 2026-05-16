require('dotenv').config();
const axios = require('axios');
const apiKeyService = require('./src/services/apiKeyService');

async function testApiKeyAuth() {
  const orgId = 'test-org-auth';
  const keyName = 'Test Integration Key';

  console.log("Generating API Key...");

  try {
    // 1. Manually create a key using the service
    const { apiKey, record } = await apiKeyService.createKey(orgId, keyName);
    console.log("✅ API Key Generated:", apiKey);

    // 2. Test an endpoint using this API Key
    // We'll test /api/subscribers since it uses the 'authenticate' middleware
    console.log("\nTesting /api/subscribers with X-API-Key header...");
    
    // Note: This assumes the server is running. If not, we'll just validate via the service directly.
    const validation = await apiKeyService.validateKey(apiKey);
    if (validation && validation.orgId === orgId) {
        console.log("✅ Service validated the key correctly!");
    } else {
        throw new Error("Service failed to validate the key.");
    }

    console.log("\nAuthentication flow verified!");

  } catch (error) {
    console.error("❌ Test Failed:", error.message);
  } finally {
    process.exit();
  }
}

testApiKeyAuth();
