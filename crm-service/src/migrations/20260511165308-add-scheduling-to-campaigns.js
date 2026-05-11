'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add 'SCHEDULED' to the ENUM type
    await queryInterface.sequelize.query('ALTER TYPE "enum_campaigns_status" ADD VALUE IF NOT EXISTS \'SCHEDULED\'');

    // 2. Add scheduling fields
    await queryInterface.addColumn('campaigns', 'scheduledAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('campaigns', 'timezone', {
      type: Sequelize.STRING,
      defaultValue: 'UTC'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('campaigns', 'scheduledAt');
    await queryInterface.removeColumn('campaigns', 'timezone');
  }
};
