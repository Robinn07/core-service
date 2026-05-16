const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserRole = sequelize.define('UserRole', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  uid: {
    type: DataTypes.STRING, // Firebase UID
    allowNull: false
  },
  orgId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'EDITOR', 'VIEWER'),
    defaultValue: 'EDITOR',
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'user_roles',
  indexes: [
    { unique: true, fields: ['uid', 'orgId'] }
  ]
});

module.exports = UserRole;
