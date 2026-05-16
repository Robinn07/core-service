'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add 'PAUSED' to the ENUM type for PostgreSQL
    // Note: This assumes the enum type is named 'enum_campaigns_status'
    await queryInterface.sequelize.query('ALTER TYPE "enum_campaigns_status" ADD VALUE IF NOT EXISTS \'PAUSED\'');
    
    // 2. Add healthThresholds to Campaign to allow per-campaign limits
    await queryInterface.addColumn('campaigns', 'healthThresholds', {
      type: Sequelize.JSONB,
      defaultValue: {
        maxBounceRate: 0.05, // 5%
        maxUnsubscribeRate: 0.02, // 2%
        maxFailedRate: 0.10 // 10%
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // ENUM values cannot be easily removed in Postgres without dropping/recreating.
    // We will just remove the healthThresholds column.
    await queryInterface.removeColumn('campaigns', 'healthThresholds');
  }
};
