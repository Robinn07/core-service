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
  },
  isLandingPage: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: true
  },
  htmlContent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  designJson: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  behavioralTriggers: {
    type: DataTypes.JSONB,
    defaultValue: {
      exitIntent: false,
      scrollDepth: null, // e.g., 50 for 50%
      inactivityTimer: null // seconds
    }
  },
  isPopUp: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  popUpConfig: {
    type: DataTypes.JSONB,
    defaultValue: {
      type: 'MODAL',
      trigger: 'TIME',
      triggerValue: 5,
      frequency: 'ONCE_PER_SESSION'
    }
  },
  impressionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  conversionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'forms',
  scopes: {
    tenant(orgId) {
      return {
        where: { orgId }
      };
    }
  }
});

module.exports = Form;
