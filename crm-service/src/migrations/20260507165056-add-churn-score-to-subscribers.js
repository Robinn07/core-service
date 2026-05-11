'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('subscribers', 'churnScore', {
      type: Sequelize.FLOAT,
      defaultValue: 0.0,
      allowNull: false
    });
    await queryInterface.addColumn('subscribers', 'lastPredictedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('subscribers', 'churnScore');
    await queryInterface.removeColumn('subscribers', 'lastPredictedAt');
  }
};
