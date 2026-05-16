'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('templates', 'mjmlContent', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('templates', 'designData', {
      type: Sequelize.JSONB,
      defaultValue: {},
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('templates', 'mjmlContent');
    await queryInterface.removeColumn('templates', 'designData');
  }
};
