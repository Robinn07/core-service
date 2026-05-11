const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
const resolvedPath = path.resolve(serviceAccountPath);

try {
  const serviceAccount = require(resolvedPath);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized successfully.');
  }
} catch (error) {
  console.warn('Firebase Admin initialization skipped: serviceAccountKey.json not found or invalid.');
}

module.exports = admin;
