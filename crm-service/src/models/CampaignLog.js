const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CampaignLog = sequelize.define('CampaignLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  messageId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  orgId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('DELIVERED', 'BOUNCED', 'COMPLAINED', 'PENDING'),
    defaultValue: 'PENDING'
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  automationActionId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  ab_variant: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'campaign_logs',
  scopes: {
    tenant(orgId) {
      return {
        where: { orgId }
      };
    }
  }
});

module.exports = CampaignLog;
