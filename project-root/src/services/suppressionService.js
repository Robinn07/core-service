const { db, admin } = require('../config/firebase');

/**
 * Suppression Service
 * Manages the Firestore suppressionList collection.
 */

const handleBounce = async (emails, bounceType) => {
  const batch = db.batch();
  const suppressedAt = admin.firestore.FieldValue.serverTimestamp();

  emails.forEach(email => {
    const docRef = db.collection('suppressionList').doc(email.toLowerCase());
    batch.set(docRef, {
      email: email.toLowerCase(),
      reason: 'BOUNCE',
      bounceType: bounceType || 'Permanent',
      suppressedAt
    });
  });

  await batch.commit();
  console.log(`🚫 Suppressed ${emails.length} emails due to Bounce (${bounceType})`);
};

const handleComplaint = async (emails) => {
  const batch = db.batch();
  const suppressedAt = admin.firestore.FieldValue.serverTimestamp();

  emails.forEach(email => {
    const docRef = db.collection('suppressionList').doc(email.toLowerCase());
    batch.set(docRef, {
      email: email.toLowerCase(),
      reason: 'COMPLAINT',
      suppressedAt
    });
  });

  await batch.commit();
  console.log(`🚫 Suppressed ${emails.length} emails due to Complaint`);
};

const isSuppressed = async (email) => {
  if (!email) return false;
  const doc = await db.collection('suppressionList').doc(email.toLowerCase()).get();
  return doc.exists;
};

module.exports = {
  handleBounce,
  handleComplaint,
  isSuppressed
};
