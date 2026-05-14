'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('forms', 'isPopUp', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    await queryInterface.addColumn('forms', 'popUpConfig', {
      type: Sequelize.JSONB,
      defaultValue: {
        type: 'MODAL', // MODAL, BAR, SLIDEIN
        trigger: 'TIME', // TIME, SCROLL, EXIT_INTENT
        triggerValue: 5, // 5 seconds, 50% scroll, etc.
        frequency: 'ONCE_PER_SESSION' // ALWAYS, ONCE_PER_SESSION
      }
    });
    await queryInterface.addColumn('forms', 'impressionCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    await queryInterface.addColumn('forms', 'conversionCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('forms', 'isPopUp');
    await queryInterface.removeColumn('forms', 'popUpConfig');
    await queryInterface.removeColumn('forms', 'impressionCount');
    await queryInterface.removeColumn('forms', 'conversionCount');
  }
};
