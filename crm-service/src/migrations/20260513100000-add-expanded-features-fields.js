'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add fields to event_logs for Geo and Device Analytics
    await queryInterface.addColumn('event_logs', 'country', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('event_logs', 'city', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('event_logs', 'os', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('event_logs', 'browser', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('event_logs', 'deviceType', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // 2. Add ampHtmlContent to templates
    await queryInterface.addColumn('templates', 'ampHtmlContent', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // 3. Add Landing Page fields to forms
    await queryInterface.addColumn('forms', 'isLandingPage', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    await queryInterface.addColumn('forms', 'slug', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('forms', 'htmlContent', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // Add unique constraint for slug per org (optional but recommended)
    // await queryInterface.addIndex('forms', ['orgId', 'slug'], {
    //   unique: true,
    //   where: { isLandingPage: true }
    // });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('event_logs', 'country');
    await queryInterface.removeColumn('event_logs', 'city');
    await queryInterface.removeColumn('event_logs', 'os');
    await queryInterface.removeColumn('event_logs', 'browser');
    await queryInterface.removeColumn('event_logs', 'deviceType');
    await queryInterface.removeColumn('templates', 'ampHtmlContent');
    await queryInterface.removeColumn('forms', 'isLandingPage');
    await queryInterface.removeColumn('forms', 'slug');
    await queryInterface.removeColumn('forms', 'htmlContent');
  }
};
