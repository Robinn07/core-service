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
  }
}, {
  timestamps: true,
  tableName: 'org_configs'
});

module.exports = OrgConfig;
