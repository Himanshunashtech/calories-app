
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';

// IMPORTANT: Replace with your actual Firebase project configuration
// You can find this in your Firebase project settings -> General -> Your apps -> Web app
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional
};

let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Optional: Set auth persistence. browserLocalPersistence is default.
// setPersistence(auth, browserLocalPersistence)
//   .catch((error) => {
//     console.error("Error setting auth persistence:", error);
//   });

if (typeof window !== 'undefined' && !getApps().length) {
  console.warn(
    "Firebase has not been initialized. Make sure you have replaced the placeholder firebaseConfig in src/lib/firebase.ts with your actual Firebase project configuration."
  );
}
