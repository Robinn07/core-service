import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const rawFirebaseConfig = {
  apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY ?? "").trim(),
  authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "").trim(),
  projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "").trim(),
  storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "").trim(),
  messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "").trim(),
  appId: String(import.meta.env.VITE_FIREBASE_APP_ID ?? "").trim(),
};

function isValidFirebaseValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return !normalized.includes("your_firebase") && !normalized.includes("placeholder");
}

const invalidFirebaseKeys = Object.entries(rawFirebaseConfig)
  .filter(([, value]) => !isValidFirebaseValue(value))
  .map(([key]) => key);

const hasFirebaseConfig = invalidFirebaseKeys.length === 0;
const firebaseConfig = hasFirebaseConfig ? rawFirebaseConfig : null;

if (!hasFirebaseConfig && import.meta.env.DEV) {
  // Helpful signal during setup: identifies which env keys are currently invalid.
  console.warn("Firebase config invalid. Check VITE_FIREBASE_* values.", {
    invalidKeys: invalidFirebaseKeys,
    resolvedValues: Object.fromEntries(
      Object.entries(rawFirebaseConfig).map(([key, value]) => [key, value ? `${value.slice(0, 6)}...` : "<empty>"]),
    ),
  });
}

const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;

export { auth, hasFirebaseConfig };
