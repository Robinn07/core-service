'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('subscribers', 'preferredSendHour', {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 23
      }
    });
    await queryInterface.addColumn('subscribers', 'stoConfidenceScore', {
      type: Sequelize.FLOAT,
      defaultValue: 0.0,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('subscribers', 'preferredSendHour');
    await queryInterface.removeColumn('subscribers', 'stoConfidenceScore');
  }
};
