const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EventLog = sequelize.define('EventLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('OPEN', 'CLICK', 'BOUNCE', 'COMPLAINT', 'DELIVERY'),
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
  }
}, {
  timestamps: true,
  tableName: 'event_logs',
  indexes: [
    { fields: ['messageId'] },
    { fields: ['campaignId'] },
    { fields: ['subscriberId'] }
  ]
});

module.exports = EventLog;
