'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Update Campaign status ENUM
    await queryInterface.sequelize.query('ALTER TYPE "enum_campaigns_status" ADD VALUE IF NOT EXISTS \'TESTING\'');

    // 2. Add fields to Campaign
    await queryInterface.addColumn('campaigns', 'type', {
      type: Sequelize.ENUM('REGULAR', 'AB_TEST'),
      defaultValue: 'REGULAR'
    });

    await queryInterface.addColumn('campaigns', 'abTestConfig', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    // 3. Add variant to logs
    await queryInterface.addColumn('campaign_logs', 'ab_variant', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('event_logs', 'ab_variant', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('event_logs', 'ab_variant');
    await queryInterface.removeColumn('campaign_logs', 'ab_variant');
    await queryInterface.removeColumn('campaigns', 'abTestConfig');
    await queryInterface.removeColumn('campaigns', 'type');
  }
};
