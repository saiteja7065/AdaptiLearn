// Firestore Connection Manager
// Prevents multiple connection attempts and manages connection state

let connectionPromise = null;
let isConnected = false;

export const getFirestoreConnection = async () => {
  // Return existing connection if available
  if (isConnected) {
    return Promise.resolve();
  }
  
  // Return existing connection attempt if in progress
  if (connectionPromise) {
    return connectionPromise;
  }
  
  // Create new connection attempt
  connectionPromise = new Promise(async (resolve, reject) => {
    try {
      console.log('🔗 Establishing Firestore connection...');
      
      // Import Firestore here to avoid circular dependencies
      const { db, enableNetwork, disableNetwork } = await import('./config');
      
      // Reset connection state in development
      if (process.env.NODE_ENV === 'development') {
        await disableNetwork(db);
        await new Promise(resolve => setTimeout(resolve, 50));
        await enableNetwork(db);
      }
      
      isConnected = true;
      console.log('✅ Firestore connection established');
      resolve();
      
    } catch (error) {
      console.log('⚠️ Firestore connection issue:', error.message);
      // Don't reject - allow app to continue with limited functionality
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
  console.log('🔄 Firestore connection reset');
};

// Global error handler for Firestore errors
export const handleFirestoreError = (error) => {
  if (error?.message?.includes('FIRESTORE') || 
      error?.message?.includes('INTERNAL ASSERTION FAILED')) {
    console.log('🔥 Firestore error intercepted:', error.message);
    resetConnection();
    return true; // Error handled
  }
  return false; // Error not handled
};

// Setup global error listener
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (handleFirestoreError(event.error)) {
      event.preventDefault();
    }
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    if (handleFirestoreError(event.reason)) {
      event.preventDefault();
    }
  });
}
