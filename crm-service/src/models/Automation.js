const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Automation = sequelize.define('Automation', {
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
  triggerType: {
    type: DataTypes.ENUM('subscriber_created', 'list_joined', 'tag_added', 'event_occurred'),
    allowNull: false
  },
  triggerConfig: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  canvasState: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'automations'
});

module.exports = Automation;
