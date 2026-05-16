'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('subscribers', 'aiSegment', {
      type: Sequelize.STRING,
      allowNull: true
    });
    // Add index for performance since segments will be heavily used for filtering
    await queryInterface.addIndex('subscribers', ['aiSegment']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('subscribers', ['aiSegment']);
    await queryInterface.removeColumn('subscribers', 'aiSegment');
  }
};
