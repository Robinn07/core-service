'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Note: We don't have an 'organizations' table in the current schema (multi-tenancy is via string orgId).
    // In a real system, we would have an Org model. For this project, we might need a way to store 
    // ingestion settings per orgId. Let's create an OrgConfig table.
    
    await queryInterface.createTable('org_configs', {
      orgId: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      ingestionKey: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ingestionUrl: {
        type: Sequelize.STRING,
        defaultValue: 'http://localhost:3000'
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('org_configs');
  }
};
