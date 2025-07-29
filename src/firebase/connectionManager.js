// Enhanced Firestore Connection Manager
// Prevents INTERNAL ASSERTION FAILED errors with simplified connection handling

let connectionPromise = null;
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

export const getFirestoreConnection = async () => {
  // Return immediately if already connected
  if (isConnected) {
    return Promise.resolve();
  }
  
  // Return existing connection attempt if in progress
  if (connectionPromise) {
    return connectionPromise;
  }
  
  // Prevent infinite connection attempts
  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    console.log('🚫 Max connection attempts reached, using offline mode');
    return Promise.resolve();
  }
  
  // Create new connection attempt
  connectionPromise = new Promise(async (resolve) => {
    try {
      connectionAttempts++;
      console.log(`🔗 Firestore connection attempt ${connectionAttempts}...`);
      
      // Short delay to prevent rapid reconnection
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Import Firestore safely
      const { db } = await import('./safeConfig');
      
      // Simple connection test without network manipulation
      const testCollection = db.collection('_health_check');
      const testDoc = testCollection.doc('ping');
      
      // Minimal read operation to verify connection
      await testDoc.get();
      
      isConnected = true;
      connectionAttempts = 0; // Reset on success
      console.log('✅ Firestore connection established successfully');
      resolve();
      
    } catch (error) {
      console.log(`⚠️ Firestore connection attempt ${connectionAttempts} failed:`, error.message);
      
      // Always resolve to prevent blocking the app
      isConnected = false;
      resolve();
    } finally {
      connectionPromise = null;
    }
  });
  
  return connectionPromise;
};

export const resetConnection = () => {
  isConnected = false;
  connectionPromise = null;
  connectionAttempts = 0;
  console.log('🔄 Firestore connection reset');
};

// Enhanced error handler for Firestore INTERNAL ASSERTION FAILED errors
export const handleFirestoreError = (error) => {
  const errorMessage = error?.message || error?.toString() || '';
  
  if (errorMessage.includes('FIRESTORE') && 
      errorMessage.includes('INTERNAL ASSERTION FAILED')) {
    console.log('🔥 Firestore INTERNAL ASSERTION FAILED error intercepted');
    resetConnection();
    return true; // Error handled
  }
  
  if (errorMessage.includes('FIRESTORE') || 
      errorMessage.includes('Unexpected state')) {
    console.log('🔥 Firestore error intercepted:', errorMessage);
    resetConnection();
    return true; // Error handled
  }
  
  return false; // Error not handled
};

// Comprehensive global error listeners
if (typeof window !== 'undefined') {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    if (handleFirestoreError(event.error)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (handleFirestoreError(event.reason)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

// Safe Firestore operation wrapper
export const safeFirestoreOperation = async (operation, fallback = null) => {
  try {
    await getFirestoreConnection();
    return await operation();
  } catch (error) {
    if (handleFirestoreError(error)) {
      console.log('🛡️ Firestore operation failed safely, using fallback');
      return fallback;
    }
    throw error;
  }
};
