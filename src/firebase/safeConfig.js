// Firestore Safe Initialization
// Prevents INTERNAL ASSERTION FAILED errors during app startup

import { initializeApp } from 'firebase/app';
import { getFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Safe Firebase initialization with error handling
let app = null;
let db = null;
let auth = null;
let isInitialized = false;

const initializeFirebaseSafely = () => {
  if (isInitialized) {
    return { app, db, auth };
  }

  try {
    // Initialize Firebase app
    app = initializeApp(firebaseConfig);
    
    // Initialize Firestore with minimal settings to prevent assertion errors
    db = getFirestore(app);
    
    // Initialize Auth
    auth = getAuth(app);
    
    // Skip persistence to avoid INTERNAL ASSERTION FAILED errors
    console.log('⚠️ Skipping Firestore persistence to prevent assertion errors');
    
    isInitialized = true;
    console.log('✅ Firebase initialized safely');
    
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    // Create mock objects to prevent app crashes
    db = {
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({ exists: false }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve()
        }),
        add: () => Promise.resolve({ id: 'mock-doc' })
      })
    };
  }

  return { app, db, auth };
};

// Initialize Firebase safely
const { app: firebaseApp, db: firestore, auth: firebaseAuth } = initializeFirebaseSafely();

export { firebaseApp as app, firestore as db, firebaseAuth as auth };
export default { app: firebaseApp, db: firestore, auth: firebaseAuth };
