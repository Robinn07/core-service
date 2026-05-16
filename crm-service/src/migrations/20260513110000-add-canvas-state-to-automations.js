'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('automations', 'canvasState', {
      type: Sequelize.JSONB,
      defaultValue: {},
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('automations', 'canvasState');
  }
};
