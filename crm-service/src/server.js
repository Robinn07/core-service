require('dotenv').config();
const validateEnv = require('./utils/configCheck');
const logger = require('./utils/logger');

// 1. Validate Environment before anything else
validateEnv();

const app = require('./app');
const { sequelize } = require('./config/db');
const redisClient = require('./config/redis');
const emailWorker = require('./workers/emailWorker');
const aiWorker = require('./workers/aiWorker');
const { initWebSockets } = require('./config/socket');
const initMaintenanceJobs = require('./config/maintenance');

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // 2. Sync Database
    logger.info('Database connected.');

    // 3. Initialize Jobs
    initMaintenanceJobs();

    // 4. Start Server with WebSockets
    const server = initWebSockets(app);
    server.listen(PORT, () => {
      logger.info(`CRM Service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // 4. Graceful Shutdown Implementation
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      // Close Server (Stop accepting new requests)
      server.close(() => {
        logger.info('HTTP server closed.');
      });

      // Close BullMQ Workers
      try {
        await Promise.all([
          emailWorker.close(),
          aiWorker.close()
        ]);
        logger.info('BullMQ workers closed.');
      } catch (err) {
        logger.error('Error closing BullMQ workers:', err);
      }

      // Close Redis Connection
      try {
        await redisClient.quit();
        logger.info('Redis connection closed.');
      } catch (err) {
        logger.error('Error closing Redis:', err);
      }

      // Close Database Connection
      try {
        await sequelize.close();
        logger.info('Database connection closed.');
      } catch (err) {
        logger.error('Error closing Database:', err);
      }

      logger.info('Graceful shutdown complete. Exiting.');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
