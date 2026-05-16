const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SuppressionList = sequelize.define('SuppressionList', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  orgId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reason: {
    type: DataTypes.ENUM('BOUNCE', 'COMPLAINT', 'MANUAL', 'UNSUBSCRIBE'),
    defaultValue: 'MANUAL'
  }
}, {
  timestamps: true,
  tableName: 'suppression_list'
});

module.exports = SuppressionList;
