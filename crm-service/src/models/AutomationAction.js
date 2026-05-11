const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AutomationAction = sequelize.define('AutomationAction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('send_email', 'add_tag', 'remove_tag', 'wait', 'split'),
    defaultValue: 'send_email'
  },
  nextActionId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  falseActionId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  delay: {
    type: DataTypes.INTEGER, // Delay in seconds
    defaultValue: 0
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  config: {
    type: DataTypes.JSONB, // Stores templateId, tag name, etc.
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'automation_actions'
});

module.exports = AutomationAction;
