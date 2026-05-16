const admin = require('./src/config/firebase').admin;

async function getTestToken(uid) {
  try {
    // This creates a custom token tied DIRECTLY to your project ID
    const customToken = await admin.auth().createCustomToken(uid);
    console.log("--- YOUR PROJECT TOKEN ---");
    console.log(customToken);
    console.log("--------------------------");
    process.exit();
  } catch (error) {
    console.error("Error creating token:", error);
  }
}

// Use your actual UID from Firestore (the 'test-user-mumbai-2026' one)
getTestToken('test-user-mumbai-2026');