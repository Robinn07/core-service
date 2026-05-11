// get-firebase-token.js
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyBcY5uqkykYV5aklAgzZzmuQtWrMHC21yQ", // Replace with your Firebase Web API Key
  authDomain: "loopx-d4c9b.firebaseapp.com",
  projectId: "loopx-d4c9b",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function getToken() {
  try {
    // Log in with the account you want to test
    const userCredential = await signInWithEmailAndPassword(auth, "abutalhasolanki@gmail.com", "!@maynard25AA");
    const idToken = await userCredential.user.getIdToken();
    
    console.log("\n--- COPY THIS ID TOKEN ---");
    console.log(idToken);
    console.log("--------------------------\n");
    process.exit();
  } catch (error) {
    console.error("Login failed:", error.message);
  }
}

getToken();