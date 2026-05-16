'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Update triggerType ENUM to include behavioral events
    await queryInterface.sequelize.query('ALTER TYPE "enum_automations_triggerType" ADD VALUE IF NOT EXISTS \'event_occurred\'');
    
    // 2. Add triggerConfig to Automation
    await queryInterface.addColumn('automations', 'triggerConfig', {
      type: Sequelize.JSONB,
      defaultValue: {},
      allowNull: false
    });

    // 3. Update AutomationAction type ENUM to include wait and split
    await queryInterface.sequelize.query('ALTER TYPE "enum_automation_actions_type" ADD VALUE IF NOT EXISTS \'wait\'');
    await queryInterface.sequelize.query('ALTER TYPE "enum_automation_actions_type" ADD VALUE IF NOT EXISTS \'split\'');

    // 4. Add branching fields to AutomationAction
    await queryInterface.addColumn('automation_actions', 'nextActionId', {
      type: Sequelize.UUID,
      allowNull: true
    });
    await queryInterface.addColumn('automation_actions', 'falseActionId', {
      type: Sequelize.UUID,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('automations', 'triggerConfig');
    await queryInterface.removeColumn('automation_actions', 'nextActionId');
    await queryInterface.removeColumn('automation_actions', 'falseActionId');
  }
};
