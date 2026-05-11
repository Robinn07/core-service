const admin = require('firebase-admin');
const serviceAccount = require('../../firebase-admin-sdk.json'); // Maps to your uploaded file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { admin, db };