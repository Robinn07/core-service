'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('domains', {
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
      domainName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      verificationStatus: {
        type: Sequelize.ENUM('pending', 'verified', 'failed'),
        defaultValue: 'pending'
      },
      dkimTokens: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true
      },
      spfRecord: {
        type: Sequelize.STRING,
        allowNull: true
      },
      dmarcRecord: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.dropTable('domains');
  }
};
