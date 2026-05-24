const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const List = sequelize.define('List', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  orgId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'lists',
  scopes: {
    tenant(orgId) {
      return {
        where: { orgId }
      };
    }
  }
});

module.exports = List;
