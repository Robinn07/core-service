const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  orgId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'QUEUED', 'SENDING', 'SENT', 'PAUSED', 'SCHEDULED', 'TESTING'),
    defaultValue: 'DRAFT'
  },
  type: {
    type: DataTypes.ENUM('REGULAR', 'AB_TEST'),
    defaultValue: 'REGULAR'
  },
  abTestConfig: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'UTC'
  },
  deliverAtLocalTime: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  segmentConfig: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  healthThresholds: {
    type: DataTypes.JSONB,
    defaultValue: {
      maxBounceRate: 0.05,
      maxUnsubscribeRate: 0.02,
      maxFailedRate: 0.10
    }
  },
  sentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  openCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  clickCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bounceCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  successConfig: {
    type: DataTypes.JSONB,
    defaultValue: {
      targetEvent: null, // e.g., 'team_member_invited'
      attributionWindow: 48, // hours
      successCount: 0
    }
  }
}, {
  timestamps: true,
  tableName: 'campaigns',
  defaultScope: {
    // Note: We don't add a hard default scope here because organizationId 
    // needs to be passed dynamically. Instead, we use a 'tenant' scope.
  },
  scopes: {
    tenant(orgId) {
      return {
        where: { orgId }
      };
    }
  }
});

module.exports = Campaign;
