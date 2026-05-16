'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('subscribers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      orgId: { type: Sequelize.STRING, allowNull: false },
      firstName: { type: Sequelize.STRING },
      lastName: { type: Sequelize.STRING },
      status: { type: Sequelize.ENUM('active', 'unsubscribed', 'bounced'), defaultValue: 'active' },
      attributes: { type: Sequelize.JSONB, defaultValue: {} },
      totalOpens: { type: Sequelize.INTEGER, defaultValue: 0 },
      totalClicks: { type: Sequelize.INTEGER, defaultValue: 0 },
      lastActivity: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('templates', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      orgId: { type: Sequelize.STRING, allowNull: false },
      subject: { type: Sequelize.STRING, allowNull: false },
      htmlContent: { type: Sequelize.TEXT, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('campaigns', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      orgId: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.ENUM('DRAFT', 'QUEUED', 'SENDING', 'SENT'), defaultValue: 'DRAFT' },
      templateId: {
        type: Sequelize.UUID,
        references: { model: 'templates', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      segmentConfig: { type: Sequelize.JSONB, defaultValue: {} },
      sentCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      openCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      clickCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.createTable('event_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      type: { type: Sequelize.ENUM('OPEN', 'CLICK', 'BOUNCE', 'COMPLAINT', 'DELIVERY'), allowNull: false },
      orgId: { type: Sequelize.STRING, allowNull: false },
      campaignId: { type: Sequelize.UUID },
      subscriberId: { type: Sequelize.UUID },
      messageId: { type: Sequelize.STRING },
      url: { type: Sequelize.TEXT },
      ipAddress: { type: Sequelize.STRING },
      userAgent: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('event_logs');
    await queryInterface.dropTable('campaigns');
    await queryInterface.dropTable('templates');
    await queryInterface.dropTable('subscribers');
  }
};
