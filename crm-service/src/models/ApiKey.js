const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ApiKey = sequelize.define('ApiKey', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orgId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  keyHash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  keyPrefix: {
    type: DataTypes.STRING,
    allowNull: false
  },
  scopes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['full_access'],
    allowNull: false
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'api_keys'
});

module.exports = ApiKey;
