const { OrgConfig } = require('./src/models');

async function setupAnalytics() {
  try {
    console.log('--- Setting up Analytics for CRM-System ---');
    
    // 1. Seed OrgConfig so events are forwarded
    await OrgConfig.findOrCreate({
      where: { orgId: 'crm-system' },
      defaults: {
        ingestionKey: 'loopx_internal_key',
        ingestionUrl: 'http://localhost:3000'
      }
    });

    console.log('✅ Analytics configuration seeded for "crm-system".');
    console.log('Events will now be automatically forwarded to the Retentioneering stack.');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

setupAnalytics();
