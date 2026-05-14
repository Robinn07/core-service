'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('subscribers', 'timezone', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'UTC'
    });
    await queryInterface.addColumn('campaigns', 'deliverAtLocalTime', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('subscribers', 'timezone');
    await queryInterface.removeColumn('campaigns', 'deliverAtLocalTime');
  }
};
