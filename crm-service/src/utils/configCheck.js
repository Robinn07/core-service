const logger = require('./logger');

const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_HOST',
  'REDIS_PORT',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'SES_FROM_EMAIL',
  'APP_BASE_URL'
];

function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`Critical configuration missing: ${missing.join(', ')}`);
    process.exit(1);
  }

  logger.info('Environment configuration validated.');
}

module.exports = validateEnv;
