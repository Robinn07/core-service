'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add new columns
    await queryInterface.addColumn('subscribers', 'confirmationToken', {
      type: Sequelize.UUID,
      allowNull: true
    });
    await queryInterface.addColumn('subscribers', 'confirmedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // 2. Update status ENUM to include 'pending'
    // In Postgres, we need to add the value to the existing type
    await queryInterface.sequelize.query('ALTER TYPE "enum_subscribers_status" ADD VALUE IF NOT EXISTS \'pending\'');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('subscribers', 'confirmationToken');
    await queryInterface.removeColumn('subscribers', 'confirmedAt');
    // Note: Removing a value from an ENUM in Postgres is complex and rarely done in down migrations.
  }
};
