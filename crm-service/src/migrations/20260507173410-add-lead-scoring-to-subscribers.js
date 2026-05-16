'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('subscribers', 'leadScore', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });
    await queryInterface.addColumn('subscribers', 'leadTemperature', {
      type: Sequelize.ENUM('COLD', 'WARM', 'HOT'),
      defaultValue: 'COLD',
      allowNull: false
    });
    await queryInterface.addColumn('subscribers', 'lastScoredAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('subscribers', 'leadScore');
    await queryInterface.removeColumn('subscribers', 'leadTemperature');
    await queryInterface.removeColumn('subscribers', 'lastScoredAt');
    // Note: To truly undo ENUM creation in Postgres, more complex SQL might be needed,
    // but for this migration, removeColumn is sufficient for the field.
  }
};
