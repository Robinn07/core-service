const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const aiQueue = require('../queue/aiQueue');
const { Subscriber } = require('../models');
const { sequelize } = require('./db');

const initMaintenanceJobs = () => {
  // 1. Cleanup /uploads every 24 hours at midnight
  cron.schedule('0 0 * * *', () => {
    logger.info('Running maintenance: Cleaning up uploads folder...');
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (fs.existsSync(uploadsDir)) {
      fs.readdir(uploadsDir, (err, files) => {
        if (err) {
          logger.error('Failed to read uploads directory:', err);
          return;
        }

        files.forEach(file => {
          const filePath = path.join(uploadsDir, file);
          fs.stat(filePath, (err, stats) => {
            if (err) return;

            const now = new Date().getTime();
            const fileAge = now - stats.mtime.getTime();
            const oneDay = 24 * 60 * 60 * 1000;

            if (fileAge > oneDay) {
              fs.unlink(filePath, (err) => {
                if (err) logger.error(`Failed to delete ${file}:`, err);
                else logger.info(`Deleted old file: ${file}`);
              });
            }
          });
        });
      });
    }
  });

  // 2. Daily Churn Prediction at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running daily AI maintenance: Triggering churn predictions...');
    try {
      const organizations = await Subscriber.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('orgId')), 'orgId']],
        raw: true
      });

      for (const org of organizations) {
        if (org.orgId) {
          await aiQueue.add('batch-churn-prediction', { orgId: org.orgId });
        }
      }
      logger.info(`Queued churn prediction for ${organizations.length} organizations.`);
    } catch (err) {
      logger.error('Failed to queue daily churn predictions:', err);
    }
  });

  // 3. Weekly STO Recalculation (Sundays at 3 AM)
  cron.schedule('0 3 * * 0', async () => {
    logger.info('Running weekly AI maintenance: Recalculating STO for all organizations...');
    try {
      const organizations = await Subscriber.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('orgId')), 'orgId']],
        raw: true
      });

      for (const org of organizations) {
        if (org.orgId) {
          await aiQueue.add('batch-sto-calculation', { orgId: org.orgId });
        }
      }
      logger.info(`Queued STO recalculation for ${organizations.length} organizations.`);
    } catch (err) {
      logger.error('Failed to queue weekly STO calculations:', err);
    }
  });

  // 4. Daily Lead Scoring (4 AM)
  cron.schedule('0 4 * * *', async () => {
    logger.info('Running daily AI maintenance: Recalculating lead scores...');
    try {
      const organizations = await Subscriber.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('orgId')), 'orgId']],
        raw: true
      });

      for (const org of organizations) {
        if (org.orgId) {
          await aiQueue.add('batch-lead-scoring', { orgId: org.orgId });
        }
      }
      logger.info(`Queued lead scoring for ${organizations.length} organizations.`);
    } catch (err) {
      logger.error('Failed to queue daily lead scoring:', err);
    }
  });

  // 5. Weekly Full Audience Clustering (Saturdays at 2 AM)
  cron.schedule('0 2 * * 6', async () => {
    logger.info('Running weekly AI maintenance: Full audience clustering...');
    try {
      const organizations = await Subscriber.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('orgId')), 'orgId']],
        raw: true
      });

      for (const org of organizations) {
        if (org.orgId) {
          await aiQueue.add('batch-audience-clustering', { orgId: org.orgId });
        }
      }
      logger.info(`Queued clustering for ${organizations.length} organizations.`);
    } catch (err) {
      logger.error('Failed to queue weekly audience clustering:', err);
    }
  });

  // 6. Daily Date-Based Automation Check (9 AM)
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running daily date-based automation check...');
    try {
      const { Automation, Subscriber } = require('../models');
      const { Op } = require('sequelize');
      const automationService = require('../services/automationService');

      const dateAutomations = await Automation.findAll({
        where: { triggerType: 'date_based', active: true }
      });

      for (const auto of dateAutomations) {
        const { field, offsetDays } = auto.triggerConfig;
        if (!field) continue;

        const targetDate = new Date();
        if (offsetDays) targetDate.setDate(targetDate.getDate() - offsetDays);

        const month = targetDate.getMonth() + 1;
        const day = targetDate.getDate();

        // This is a simplified check for month/day matching (ignoring year for birthdays/anniversaries)
        // For more complex field types, we'd need more logic.
        const subscribers = await Subscriber.findAll({
          where: {
            orgId: auto.orgId,
            [Op.and]: [
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`MONTH FROM "${field}"`)), month),
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`DAY FROM "${field}"`)), day)
            ]
          }
        });

        for (const sub of subscribers) {
          await automationService.trigger(auto.orgId, 'date_based', {
            subscriberId: sub.id,
            field
          });
        }
      }
      logger.info(`Processed ${dateAutomations.length} date-based automations.`);
    } catch (err) {
      logger.error('Failed to run date-based automation check:', err);
    }
  });

  logger.info('Maintenance jobs initialized.');
};

module.exports = initMaintenanceJobs;
