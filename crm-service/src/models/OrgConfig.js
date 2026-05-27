const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrgConfig = sequelize.define('OrgConfig', {
  orgId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  ingestionKey: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ingestionUrl: {
    type: DataTypes.STRING,
    defaultValue: 'http://localhost:3000'
  },
  defaultAttributionWindow: {
    type: DataTypes.INTEGER,
    defaultValue: 48
  },
  // Branding
  orgName: {
    type: DataTypes.STRING,
    defaultValue: 'My Organization'
  },
  supportEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Compliance & Email Settings
  physicalAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'UTC'
  },
  defaultFromName: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'org_configs'
});

module.exports = OrgConfig;
