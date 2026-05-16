require('dotenv').config();
const { faker } = require('@faker-js/faker');
const { Subscriber, Campaign, Template, List } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Database connected for seeding...');

    // 1. Wipe and re-create schema to support NOT NULL orgId
    await sequelize.sync({ force: true }); 
    console.log('Database schema reset and synchronized.');

    const ORG_ID = 'crm-system';

    // 2. Create a Sample List
    const [list] = await List.findOrCreate({
      where: { name: 'Demo Main List', orgId: ORG_ID },
      defaults: { description: 'Primary list for demo purposes', orgId: ORG_ID }
    });

    // 3. Create 50 Subscribers
    const subscribers = [];
    for (let i = 0; i < 50; i++) {
      subscribers.push({
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        status: 'active',
        orgId: ORG_ID,
        attributes: {
          city: faker.location.city(),
          company: faker.company.name(),
          source: 'seed-script'
        }
      });
    }
    const createdSubscribers = await Subscriber.bulkCreate(subscribers, { ignoreDuplicates: true });
    await list.addSubscribers(createdSubscribers);
    console.log(`Created 50 subscribers and added them to "${list.name}"`);

    // 4. Create a Template
    const [template] = await Template.findOrCreate({
      where: { name: 'Demo Welcome Template', orgId: ORG_ID },
      defaults: {
        subject: 'Welcome to GetLoopX, {{firstName}}!',
        orgId: ORG_ID,
        htmlContent: '<h1>Hello {{firstName}}!</h1><p>Thanks for joining us from {{city}}.</p><a href="https://getloopx.com">Visit our site</a>'
      }
    });

    // 5. Create 5 Campaigns
    const campaigns = [];
    for (let i = 1; i <= 5; i++) {
      campaigns.push({
        name: `Demo Campaign ${i}`,
        orgId: ORG_ID,
        status: i % 2 === 0 ? 'SENT' : 'DRAFT',
        templateId: template.id,
        segmentConfig: { listIds: [list.id] },
        sentCount: i % 2 === 0 ? 50 : 0,
        openCount: i % 2 === 0 ? faker.number.int({ min: 10, max: 40 }) : 0,
        clickCount: i % 2 === 0 ? faker.number.int({ min: 1, max: 10 }) : 0
      });
    }
    await Campaign.bulkCreate(campaigns);
    console.log('Created 5 demo campaigns.');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
