'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Composite Index for Subscribers (orgId + email)
    await queryInterface.addIndex('subscribers', ['orgId', 'email'], {
      name: 'idx_subscribers_org_email'
    });

    // 2. Composite Index for Suppression List (orgId + email)
    await queryInterface.addIndex('suppression_list', ['orgId', 'email'], {
      name: 'idx_suppression_org_email'
    });

    // 3. Index for Event Logs to speed up AI calculations
    await queryInterface.addIndex('event_logs', ['subscriberId', 'type', 'createdAt'], {
      name: 'idx_events_sub_type_date'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('subscribers', 'idx_subscribers_org_email');
    await queryInterface.removeIndex('suppression_list', 'idx_suppression_org_email');
    await queryInterface.removeIndex('event_logs', 'idx_events_sub_type_date');
  }
};
