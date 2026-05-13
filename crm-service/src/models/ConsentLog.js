const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ConsentLog = sequelize.define('ConsentLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  subscriberId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  orgId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  source: {
    type: DataTypes.STRING, // e.g., 'API', 'Form: Contact Us', 'Import'
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  consentType: {
    type: DataTypes.STRING,
    defaultValue: 'SUBSCRIBE'
  }
}, {
  timestamps: true,
  tableName: 'consent_logs',
  updatedAt: false // We only care about the creation timestamp
});

module.exports = ConsentLog;
