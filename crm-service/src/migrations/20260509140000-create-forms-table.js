'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('forms', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      orgId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      listId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      fieldsConfig: {
        type: Sequelize.JSONB,
        defaultValue: [
          { name: 'email', label: 'Email Address', type: 'email', required: true },
          { name: 'firstName', label: 'First Name', type: 'text', required: false }
        ]
      },
      successMessage: {
        type: Sequelize.STRING,
        defaultValue: 'Thanks for subscribing! Please check your email to confirm.'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('forms');
  }
};
