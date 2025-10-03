import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase configuration with default production values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyACmbQq896POzJilZF9LlDdCCoRX6FbojM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "draggynote.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "draggynote",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "draggynote.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "231426073899",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:231426073899:web:d763d649623b6488b2d16e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Q1DY5GM3TY",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Connect to Firebase Auth emulator for development if enabled
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('Connected to Firebase Auth emulator');
  } catch (error) {
    console.warn('Firebase Auth emulator connection failed:', error);
  }
}

export { app };
export default app;
