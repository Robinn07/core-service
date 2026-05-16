// ingestion-service/src/utils/config/loader.js
require('dotenv').config();

const getFirebaseCredentials = () => {
  const credsJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (credsJson) {
    try {
      // Try Base64 first
      return JSON.parse(Buffer.from(credsJson, 'base64').toString('utf-8'));
    } catch (e) {
      // Fallback to raw JSON
      return JSON.parse(credsJson);
    }
  }

  // Legacy path
  const path = process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccountKey.json';
  try {
    return require(path);
  } catch (e) {
    throw new Error('Firebase credentials not found in environment or file.');
  }
};

const getRabbitMQUrl = () => process.env.RABBITMQ_URL || 'amqp://localhost';
const getRedisUrl = () => process.env.REDIS_URL || 'redis://localhost:6379';

module.exports = {
  getFirebaseCredentials,
  getRabbitMQUrl,
  getRedisUrl
};
