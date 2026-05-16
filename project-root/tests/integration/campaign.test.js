const request = require('supertest');
const app = require('../../src/app');
const { db } = require('../../src/config/firebase');
const emailQueue = require('../../src/queue/emailQueue');

jest.mock('../../src/config/firebase', () => {
  const mockGet = jest.fn();
  const mockLimit = jest.fn(() => ({ get: mockGet }));
  const mockWhere = jest.fn(() => ({ limit: mockLimit }));
  const mockDoc = jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn()
  }));
  const mockCollection = jest.fn(() => ({
    doc: mockDoc,
    where: mockWhere
  }));
  const mockRunTransaction = jest.fn();

  return {
    admin: {
      firestore: {
        FieldValue: {
          serverTimestamp: () => 'timestamp',
          increment: (val) => val
        }
      }
    },
    db: {
      collection: mockCollection,
      runTransaction: mockRunTransaction
    }
  };
});

jest.mock('../../src/queue/emailQueue', () => ({
  add: jest.fn()
}));

describe('Campaign Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully queue an email campaign', async () => {
    // 1. Mock Authentication
    db.collection().where().limit().get.mockResolvedValue({
      empty: false,
      docs: [{
        id: 'tenant_123',
        data: () => ({ 
          currentUsage: 10, 
          pendingUsage: 0, 
          usageLimit: 100, 
          apiKey: 'test_key' 
        })
      }]
    });

    // 2. Mock Transaction
    db.runTransaction.mockImplementation(async (callback) => {
      return await callback({
        set: jest.fn(),
        update: jest.fn()
      });
    });

    // 3. Perform Request
    const response = await request(app)
      .post('/api/v1/campaigns/send')
      .set('x-api-key', 'test_key')
      .send({
        to: 'test@example.com',
        subject: 'Hello',
        body: 'World'
      });

    // 4. Assertions
    expect(response.status).toBe(202);
    expect(response.body.success).toBe(true);
    expect(emailQueue.add).toHaveBeenCalled();
  });

  it('should return 400 if fields are missing', async () => {
    // Mock Auth for success
    db.collection().where().limit().get.mockResolvedValue({
      empty: false,
      docs: [{
        id: 'tenant_123',
        data: () => ({ 
          currentUsage: 10, 
          pendingUsage: 0, 
          usageLimit: 100, 
          apiKey: 'test_key' 
        })
      }]
    });

    const response = await request(app)
      .post('/api/v1/campaigns/send')
      .set('x-api-key', 'test_key')
      .send({
        to: 'test@example.com'
        // missing subject and body
      });

    expect(response.status).toBe(400);
  });
});