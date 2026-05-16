const authenticateTenant = require('../../src/middleware/auth');
const { db } = require('../../src/config/firebase');

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

  return {
    admin: {
      auth: () => ({
        verifyIdToken: jest.fn()
      }),
      firestore: {
        FieldValue: {
          serverTimestamp: () => 'timestamp'
        }
      }
    },
    db: {
      collection: mockCollection
    }
  };
});

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if no auth headers provided', async () => {
    await authenticateTenant(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });

  it('should authenticate via API Key', async () => {
    req.headers['x-api-key'] = 'valid_key';
    
    // Accessing the mock via the chained calls
    db.collection().where().limit().get.mockResolvedValue({
      empty: false,
      docs: [{
        id: 'tenant_123',
        data: () => ({ currentUsage: 10, usageLimit: 100, apiKey: 'valid_key' })
      }]
    });

    await authenticateTenant(req, res, next);
    
    expect(req.tenantId).toBe('tenant_123');
    expect(next).toHaveBeenCalled();
  });

  it('should block if usage limit is exceeded', async () => {
    req.headers['x-api-key'] = 'valid_key';
    
    db.collection().where().limit().get.mockResolvedValue({
      empty: false,
      docs: [{
        id: 'tenant_123',
        data: () => ({ currentUsage: 100, pendingUsage: 0, usageLimit: 100 })
      }]
    });

    await authenticateTenant(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Usage limit exceeded. Please upgrade your plan.' });
  });
});