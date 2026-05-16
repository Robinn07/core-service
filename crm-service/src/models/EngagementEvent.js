const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EngagementEvent = sequelize.define('EngagementEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  eventType: {
    type: DataTypes.ENUM('OPEN', 'CLICK'),
    allowNull: false
  },
  url: {
    type: DataTypes.TEXT, // For clicks
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'engagement_events'
});

module.exports = EngagementEvent;
