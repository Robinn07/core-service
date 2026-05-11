const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Form = sequelize.define('Form', {
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
  listId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  fieldsConfig: {
    type: DataTypes.JSONB,
    defaultValue: [
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'firstName', label: 'First Name', type: 'text', required: false }
    ]
  },
  successMessage: {
    type: DataTypes.STRING,
    defaultValue: 'Thanks for subscribing! Please check your email to confirm.'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'forms'
});

module.exports = Form;
