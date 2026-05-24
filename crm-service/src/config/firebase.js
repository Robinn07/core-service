const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';

try {
  const resolvedPath = path.resolve(serviceAccountPath);
  const serviceAccount = require(resolvedPath);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized successfully with service account.');
  }
} catch (error) {
  console.warn('Firebase Admin serviceAccountKey.json not found. Initializing with Project ID for token verification only.');
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'loopx-d4c9b'
    });
    console.log('Firebase Admin initialized with Project ID.');
  }
}

module.exports = admin;
