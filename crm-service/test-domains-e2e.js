const axios = require('axios');

async function testDomainWorkflow() {
  const BASE_URL = 'http://localhost:4000/api';
  const testDomain = `test-${Date.now()}.com`;

  try {
    console.log(`🚀 Starting Domain E2E Test for: ${testDomain}`);

    // 1. Add Domain
    console.log('\nStep 1: Adding new domain...');
    const addRes = await axios.post(`${BASE_URL}/domains`, { domainName: testDomain });
    const domainId = addRes.data.id;
    console.log('✅ Domain added successfully. ID:', domainId);

    // 2. Fetch DNS Records
    console.log('\nStep 2: Fetching generated DNS records...');
    const dnsRes = await axios.get(`${BASE_URL}/domains/${domainId}/dns`);
    console.log('✅ DNS Records generated:');
    console.log('- DKIM Records:', dnsRes.data.dkim.length);
    console.log('- SPF Record:', dnsRes.data.spf.value);
    console.log('- DMARC Record:', dnsRes.data.dmarc.value);

    // 3. Check Verification Status (Expected to be pending initially)
    console.log('\nStep 3: Checking initial verification status...');
    const verifyRes = await axios.post(`${BASE_URL}/domains/${domainId}/verify`, {});
    console.log('✅ Current Status:', verifyRes.data.verificationStatus);

    // 4. Check Blacklist Status (Mocked)
    console.log('\nStep 4: Running blacklist check...');
    const blacklistRes = await axios.get(`${BASE_URL}/domains/${domainId}/blacklist`);
    console.log('✅ Health Status:', blacklistRes.data.status);
    console.log('✅ Blacklists checked:', blacklistRes.data.results.length);

    // 5. Fetch Deliverability Dashboard
    console.log('\nStep 5: Fetching Deliverability Dashboard...');
    const dashboardRes = await axios.get(`${BASE_URL}/domains/dashboard`);
    console.log('✅ Dashboard Metrics:');
    console.log('- Reputation (Bounce Rate):', dashboardRes.data.reputation.bounceRate + '%');
    console.log('- Active Domains:', dashboardRes.data.domains.length);
    console.log('- Recommendations:', dashboardRes.data.recommendations.length);

    console.log('\n🎉 SUCCESS: All domain management endpoints are working correctly!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

testDomainWorkflow();
