
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// IMPORTANT: YOU MUST REPLACE ALL "YOUR_..." VALUES BELOW
// WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION.
// Find this in your Firebase project settings -> General -> Your apps -> Web app -> Config.
// The API key you provided is only one part of this configuration.
const firebaseConfig = {
  apiKey: "AIzaSyCzcOpDNUMmd3fskROMR6x5NBUhsJ8wGtA", // REPLACE WITH YOUR ACTUAL API KEY
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // REPLACE WITH YOUR ACTUAL AUTH DOMAIN
  projectId: "YOUR_PROJECT_ID", // REPLACE WITH YOUR ACTUAL PROJECT ID
  storageBucket: "YOUR_PROJECT_ID.appspot.com", // REPLACE WITH YOUR ACTUAL STORAGE BUCKET
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // REPLACE WITH YOUR ACTUAL MESSAGING SENDER ID
  appId: "YOUR_APP_ID", // REPLACE WITH YOUR ACTUAL APP ID
  measurementId: "YOUR_MEASUREMENT_ID" // Optional, REPLACE IF YOU USE IT
};

let app: FirebaseApp;

if (!getApps().length) {
  // Ensure firebaseConfig is not using placeholder values before initializing
  if (firebaseConfig.apiKey.startsWith("YOUR_") || firebaseConfig.projectId.startsWith("YOUR_")) {
    console.error(
      "Firebase configuration is incomplete. Please update src/lib/firebase.ts with your actual project credentials."
    );
    // Optionally, you could throw an error here or prevent initialization
    // to make it more obvious that the config is missing.
  }
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

if (typeof window !== 'undefined' && firebaseConfig.apiKey.startsWith("YOUR_")) {
  console.warn(
    "Firebase is using placeholder configuration. Please update src/lib/firebase.ts with your actual Firebase project configuration for the app to function correctly."
  );
}
