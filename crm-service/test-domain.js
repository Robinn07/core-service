require('dotenv').config();
const domainService = require('./src/services/domainService');
const { Domain } = require('./src/models');

async function testDomainRegistration() {
  const domainName = 'getloopx.com';
  const orgId = 'test-org-123';

  console.log(`Attempting to register domain: ${domainName}...`);

  try {
    // 1. Register
    const domain = await domainService.registerDomain(orgId, domainName);
    console.log("✅ Domain registered in DB and SES!");
    console.log("Domain ID:", domain.id);
    console.log("DKIM Tokens:", domain.dkimTokens);

    // 2. Fetch DNS Records
    const dnsRecords = await domainService.getDnsRecords(domain.id);
    console.log("\n📋 Required DNS Records:");
    console.log(JSON.stringify(dnsRecords, null, 2));

    // 3. Verify status (likely 'pending' initially)
    const status = await domainService.checkVerificationStatus(domain.id);
    console.log(`\nVerification Status: ${status.verificationStatus}`);

  } catch (error) {
    console.error("❌ Test Failed:");
    console.error(error.message);
  } finally {
      process.exit();
  }
}

testDomainRegistration();
