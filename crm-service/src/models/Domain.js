const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Domain = sequelize.define('Domain', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orgId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  domainName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  verificationStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'failed'),
    defaultValue: 'pending'
  },
  dkimTokens: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  spfRecord: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dmarcRecord: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'domains',
  scopes: {
    tenant(orgId) {
      return {
        where: { orgId }
      };
    }
  }
});

module.exports = Domain;
