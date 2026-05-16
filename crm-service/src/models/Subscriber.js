const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Subscriber = sequelize.define('Subscriber', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  orgId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'unsubscribed', 'bounced', 'pending'),
    defaultValue: 'pending'
  },
  confirmationToken: {
    type: DataTypes.UUID,
    allowNull: true
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  attributes: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      marketing: true,
      transactional: true,
      newsletters: true,
      productUpdates: true
    }
  },
  totalOpens: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalClicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: true
  },
  churnScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
    allowNull: false
  },
  lastPredictedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  preferredSendHour: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 23
    }
  },
  stoConfidenceScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
    allowNull: false
  },
  leadScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  leadTemperature: {
    type: DataTypes.ENUM('COLD', 'WARM', 'HOT'),
    defaultValue: 'COLD',
    allowNull: false
  },
  lastScoredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  aiSegment: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'UTC'
  }
}, {
  timestamps: true,
  tableName: 'subscribers'
});

module.exports = Subscriber;
