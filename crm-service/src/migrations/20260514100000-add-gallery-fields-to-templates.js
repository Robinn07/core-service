'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('templates', 'category', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('templates', 'thumbnail', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('templates', 'isGallery', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('templates', 'category');
    await queryInterface.removeColumn('templates', 'thumbnail');
    await queryInterface.removeColumn('templates', 'isGallery');
  }
};
