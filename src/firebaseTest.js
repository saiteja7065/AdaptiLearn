// Firebase Connection Test
// This file tests if Firebase is properly configured
import { auth, db } from './firebase/config';
import { connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';

const testFirebaseConnection = async () => {
  console.log('Testing Firebase Connection...');
  
  // Test Firebase Auth
  if (auth) {
    console.log('✅ Firebase Auth initialized successfully');
    console.log('Auth config:', {
      apiKey: auth.config.apiKey?.substring(0, 10) + '...',
      authDomain: auth.config.authDomain,
      projectId: auth.config.projectId
    });
  } else {
    console.error('❌ Firebase Auth failed to initialize');
  }
  
  // Test Firestore
  if (db) {
    console.log('✅ Firestore initialized successfully');
    console.log('Firestore app:', db.app.name);
    
    // Test Firestore connectivity
    try {
      console.log('🔄 Testing Firestore connectivity...');
      await enableNetwork(db);
      console.log('✅ Firestore network enabled');
    } catch (error) {
      console.warn('⚠️ Firestore connectivity issue:', error.message);
      
      if (error.message.includes('offline') || error.message.includes('400')) {
        console.log('📋 FIRESTORE SETUP NEEDED:');
        console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
        console.log('2. Select project: adaptilearn-312da');
        console.log('3. Go to Firestore Database → Rules');
        console.log('4. Set rules to: allow read, write: if true;');
        console.log('5. Click Publish');
      }
    }
  } else {
    console.error('❌ Firestore failed to initialize');
  }
  
  console.log('Firebase connection test complete');
};

// Auto-run test when imported
if (typeof window !== 'undefined') {
  // Run test after a short delay to ensure Firebase is initialized
  setTimeout(testFirebaseConnection, 1000);
}

export default testFirebaseConnection;
