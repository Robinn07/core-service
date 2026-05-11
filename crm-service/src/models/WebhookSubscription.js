const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WebhookSubscription = sequelize.define('WebhookSubscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orgId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  events: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['*'], // '*' for all events
    allowNull: false
  },
  secret: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'webhook_subscriptions'
});

module.exports = WebhookSubscription;
