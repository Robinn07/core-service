const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CampaignAnalytics = sequelize.define('CampaignAnalytics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  orgId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('GEO_COUNTRY', 'GEO_CITY', 'DEVICE_TYPE', 'OS', 'BROWSER', 'TIMELINE_HOUR'),
    allowNull: false
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false
  },
  count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'campaign_analytics',
  indexes: [
    { unique: true, fields: ['campaignId', 'category', 'key'] },
    { fields: ['orgId'] }
  ]
});

module.exports = CampaignAnalytics;
