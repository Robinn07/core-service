const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Template = sequelize.define('Template', {
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
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  htmlContent: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  mjmlContent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  designData: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  ampHtmlContent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'templates'
});

module.exports = Template;
