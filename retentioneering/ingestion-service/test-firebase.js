// test-firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

console.log("Project ID:", serviceAccount.project_id);
console.log("Client Email:", serviceAccount.client_email);
console.log("Private key has \\r (Windows corruption):", serviceAccount.private_key.includes('\r'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://loopx-d4c9b-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

async function test() {
  try {
    console.log("Attempting Firestore write...");
    await db.collection('test').doc('ping').set({ ping: true, ts: new Date().toISOString() });
    console.log("✅ SUCCESS — Firestore write worked!");
  } catch (err) {
    console.error("❌ FIRESTORE ERROR CODE:", err.code);
    console.error("❌ FIRESTORE ERROR MSG:", err.message);
  }
}

test();