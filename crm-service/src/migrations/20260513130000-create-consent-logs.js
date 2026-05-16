'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('consent_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      subscriberId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'subscribers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      orgId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      source: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      consentType: {
        type: Sequelize.STRING,
        defaultValue: 'SUBSCRIBE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('consent_logs', ['subscriberId']);
    await queryInterface.addIndex('consent_logs', ['orgId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('consent_logs');
  }
};
