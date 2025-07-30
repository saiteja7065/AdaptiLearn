// Firebase Configuration and Initialization
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, where, orderBy, onSnapshot, getDocs, serverTimestamp, disableNetwork, enableNetwork } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export Firestore utilities for connection manager
export { disableNetwork, enableNetwork };

// Enhanced Firestore connection management with error protection
let firestoreInitialized = false;
let connectionAttempts = 0;
const maxConnectionAttempts = 3;

const initializeFirestoreConnection = async () => {
  if (firestoreInitialized || connectionAttempts >= maxConnectionAttempts) return;
  
  connectionAttempts++;
  
  try {
    console.log(`🔧 Initializing Firestore connection (attempt ${connectionAttempts}/${maxConnectionAttempts})...`);
    
    // Test basic connectivity first
    const testDoc = doc(db, 'test', 'connection');
    await getDoc(testDoc);
    
    firestoreInitialized = true;
    console.log('✅ Firestore connection initialized successfully');
    
  } catch (error) {
    console.log(`⚠️ Firestore initialization attempt ${connectionAttempts} failed:`, error.message);
    
    if (connectionAttempts >= maxConnectionAttempts) {
      console.log('🛡️ Max connection attempts reached, enabling offline mode');
      firestoreInitialized = true; // Prevent further attempts
    } else {
      // Retry after delay
      setTimeout(() => {
        initializeFirestoreConnection();
      }, 2000 * connectionAttempts);
    }
  }
};

// Initialize connection with delay to avoid race conditions
setTimeout(() => {
  initializeFirestoreConnection();
}, 1000);

// Handle visibility changes to prevent connection conflicts
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('📱 Page hidden - maintaining Firestore connection');
    } else {
      console.log('📱 Page visible - Firestore connection active');
    }
  });
}

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Authentication functions
export const signInWithGooglePopup = () => signInWithPopup(auth, googleProvider);

export const signInWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const createUserWithEmail = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signOutUser = () => signOut(auth);

export const onAuthStateChangedListener = (callback) => onAuthStateChanged(auth, callback);

// Firestore helper functions
export const createUserDocumentFromAuth = async (userAuth, additionalInformation = {}) => {
  if (!userAuth) return;
  
  const userDocRef = doc(db, 'users', userAuth.uid);
  
  try {
    const userSnapshot = await getDoc(userDocRef);
    
    if (!userSnapshot.exists()) {
      const { displayName, email } = userAuth;
      const createdAt = new Date();
      
      try {
        await setDoc(userDocRef, {
          displayName,
          email,
          createdAt,
          ...additionalInformation
        });
        console.log('✅ User document created successfully');
      } catch (error) {
        console.log('❌ Error creating user document:', error.message);
        // Return reference anyway for app to continue functioning
      }
    } else {
      console.log('✅ User document already exists');
    }
  } catch (error) {
    console.log('❌ Error checking user document:', error.message);
    // Continue without crashing the app
  }
  
  return userDocRef;
};

// User profile functions
export const updateUserProfile = async (userId, profileData) => {
  const userDocRef = doc(db, 'users', userId);
  try {
    await setDoc(userDocRef, profileData, { merge: true });
    return true;
  } catch (error) {
    console.log('Error updating user profile:', error.message);
    return false;
  }
};

export const getUserProfile = async (userId) => {
  const userDocRef = doc(db, 'users', userId);
  const userSnapshot = await getDoc(userDocRef);
  
  if (userSnapshot.exists()) {
    return userSnapshot.data();
  }
  return null;
};

// Updated functions for UserContext integration
export const getUserDocument = async (userId) => {
  const userDocRef = doc(db, 'users', userId);
  try {
    const userSnapshot = await getDoc(userDocRef);
    if (userSnapshot.exists()) {
      return userSnapshot.data();
    }
    return null;
  } catch (error) {
    console.log('Error getting user document:', error.message);
    return null;
  }
};

export const updateUserDocument = async (userId, userData) => {
  const userDocRef = doc(db, 'users', userId);
  try {
    await setDoc(userDocRef, userData, { merge: true });
    return true;
  } catch (error) {
    console.log('Error updating user document:', error.message);
    return false;
  }
};

export const saveUserAssessment = async (userId, assessmentData) => {
  try {
    const assessmentRef = collection(db, 'users', userId, 'assessments');
    const docRef = await addDoc(assessmentRef, {
      ...assessmentData,
      timestamp: serverTimestamp(),
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.log('Error saving assessment:', error.message);
    return null;
  }
};

export const getUserAssessments = async (userId) => {
  try {
    const assessmentsRef = collection(db, 'users', userId, 'assessments');
    const q = query(assessmentsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.log('Error getting user assessments:', error.message);
    return [];
  }
};

export const saveMockTestResult = async (userId, mockTestData) => {
  try {
    const mockTestRef = collection(db, 'users', userId, 'mockTests');
    const docRef = await addDoc(mockTestRef, {
      ...mockTestData,
      timestamp: serverTimestamp(),
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.log('Error saving mock test:', error.message);
    return null;
  }
};

export const getUserMockTests = async (userId) => {
  try {
    const mockTestsRef = collection(db, 'users', userId, 'mockTests');
    const q = query(mockTestsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.log('Error getting user mock tests:', error.message);
    return [];
  }
};

// Assessment functions
export const saveAssessmentResult = async (userId, assessmentData) => {
  try {
    const assessmentRef = collection(db, 'users', userId, 'assessments');
    const docRef = await addDoc(assessmentRef, {
      ...assessmentData,
      timestamp: serverTimestamp(),
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.log('Error saving assessment:', error.message);
    return null;
  }
};

// Question bank functions
export const getQuestionsBySubject = async (subject, difficulty = null) => {
  try {
    const questionsRef = collection(db, 'questions');
    let q;
    
    if (difficulty) {
      q = query(questionsRef, 
        where('subject', '==', subject), 
        where('difficulty', '==', difficulty)
      );
    } else {
      q = query(questionsRef, where('subject', '==', subject));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.log('Error fetching questions:', error.message);
    return [];
  }
};

// Progress tracking functions
export const updateUserProgress = async (userId, progressData) => {
  try {
    const progressRef = doc(db, 'users', userId, 'progress', 'current');
    await setDoc(progressRef, {
      ...progressData,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.log('Error updating progress:', error.message);
    return false;
  }
};

export const getUserProgress = (userId, callback) => {
  const progressRef = doc(db, 'users', userId, 'progress', 'current');
  
  return onSnapshot(progressRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback(null);
    }
  });
};

// File upload functions
export const uploadFile = async (file, path) => {
  try {
    const fileRef = ref(storage, path);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.log('Error uploading file:', error.message);
    return null;
  }
};

export default app;
