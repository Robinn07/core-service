const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EventLog = sequelize.define('EventLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('OPEN', 'CLICK', 'BOUNCE', 'COMPLAINT', 'DELIVERY', 'UNSUBSCRIBE'),
    allowNull: false
  },
  orgId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  subscriberId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  messageId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ab_variant: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  os: {
    type: DataTypes.STRING,
    allowNull: true
  },
  browser: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deviceType: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'event_logs',
  indexes: [
    { fields: ['messageId'] },
    { fields: ['campaignId'] },
    { fields: ['subscriberId'] },
    { fields: ['createdAt'] }
  ],
  scopes: {
    tenant(orgId) {
      return {
        where: { orgId }
      };
    }
  }
});

/**
 * ARCHIVAL STRATEGY NOTE:
 * All new high-volume behavioral events (page views, button clicks) should be 
 * directed to ClickHouse via the ingestion-service. This Postgres table is 
 * reserved for campaign-scoped audit trails (opens, clicks, bounces) 
 * for the last 90 days only.
 */

module.exports = EventLog;
