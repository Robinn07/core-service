'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('ALTER TYPE "enum_event_logs_type" ADD VALUE IF NOT EXISTS \'UNSUBSCRIBE\'');
  },

  down: async (queryInterface, Sequelize) => {
    // Note: Postgres doesn't support removing ENUM values easily.
    // This is generally safe to leave as is in down migrations for ENUM expansions.
  }
};
