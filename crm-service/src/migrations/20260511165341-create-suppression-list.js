'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('suppression_list', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      orgId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      reason: {
        type: Sequelize.ENUM('BOUNCE', 'COMPLAINT', 'MANUAL', 'UNSUBSCRIBE'),
        allowNull: false,
        defaultValue: 'MANUAL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addConstraint('suppression_list', {
      fields: ['email', 'orgId'],
      type: 'unique',
      name: 'unique_email_per_org_suppression'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('suppression_list');
  }
};
