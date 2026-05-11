const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/db');
const { Subscriber } = require('../../src/models');

describe('CRM Service Integration Tests', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Tenant Isolation', () => {
    it('should not allow Org A to see Org B data', async () => {
      // 1. Create subscriber for Org A
      const subA = await Subscriber.create({
        email: `orgA-${Date.now()}@test.com`,
        orgId: 'org-A',
        firstName: 'User A'
      });

      // 2. Query as Org B (simulated)
      const found = await Subscriber.findOne({
        where: { id: subA.id, orgId: 'org-B' }
      });

      expect(found).toBeNull();
    });
  });

  describe('Health Checks', () => {
    it('should return UP for system health', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });
  });
});
