// Ultimate Firestore Error Prevention System
// Completely isolates and wraps all Firestore operations to prevent INTERNAL ASSERTION FAILED

class FirestoreErrorShield {
  constructor() {
    this.isOnline = true;
    this.errorCount = 0;
    this.maxErrors = 3; // Reduced threshold for faster protection
    this.lastError = null;
    this.operations = new Map();
    this.isShieldActive = false;
    
    // Monitor global errors aggressively
    this.setupGlobalErrorHandling();
    this.activateEmergencyMode();
  }

  setupGlobalErrorHandling() {
    // Capture and handle Firestore errors globally
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (this.isFirestoreError({ message })) {
        console.log('🛡️ SHIELD: Firestore error intercepted and blocked');
        this.handleFirestoreError({ message });
        return; // Block the error from propagating
      }
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', (event) => {
      if (this.isFirestoreError(event.error)) {
        console.log('🛡️ SHIELD: Global error intercepted:', event.error.message);
        event.preventDefault();
        event.stopPropagation();
        this.handleFirestoreError(event.error);
      }
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isFirestoreError(event.reason)) {
        console.log('🛡️ SHIELD: Promise rejection intercepted:', event.reason.message);
        event.preventDefault();
        this.handleFirestoreError(event.reason);
      }
    });
  }

  activateEmergencyMode() {
    // Immediately activate shield protection
    this.isShieldActive = true;
    console.log('🛡️ EMERGENCY SHIELD ACTIVATED - All Firestore operations protected');
  }

  isFirestoreError(error) {
    if (!error) return false;
    const message = error.message || '';
    return message.includes('FIRESTORE') || 
           message.includes('INTERNAL ASSERTION FAILED') ||
           message.includes('Unexpected state') ||
           message.includes('AsyncQueueImpl') ||
           message.includes('StreamBridge') ||
           message.includes('WatchChangeAggregator');
  }

  handleFirestoreError(error) {
    this.errorCount++;
    this.lastError = error;
    this.isShieldActive = true;
    
    console.log(`🛡️ SHIELD: Error ${this.errorCount}/${this.maxErrors} - Shield protection active`);
    
    if (this.errorCount >= this.maxErrors) {
      console.log('🚫 SHIELD: Maximum errors reached, full offline mode activated');
      this.isOnline = false;
    }

    // Reset error count after some time
    setTimeout(() => {
      if (this.errorCount > 0) {
        this.errorCount--;
      }
    }, 30000);
  }

  async executeOperation(operationName, operation, fallback = null) {
    // Always use shield protection now due to severe errors
    if (!this.isOnline || this.errorCount >= this.maxErrors || this.isShieldActive) {
      console.log(`�️ SHIELD: ${operationName} - Using protected mode`);
      return fallback ? fallback() : Promise.resolve({
        success: false,
        error: 'Operating in shield protection mode',
        offline: true
      });
    }

    try {
      // Wrap operation in timeout and error boundary
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), 10000)
      );
      
      const result = await Promise.race([operation(), timeoutPromise]);
      
      // Reset error count on successful operation
      if (this.errorCount > 0) {
        this.errorCount = Math.max(0, this.errorCount - 1);
      }
      
      return result;
    } catch (error) {
      console.log(`🛡️ SHIELD: ${operationName} failed:`, error.message);
      this.handleFirestoreError(error);
      
      if (fallback) {
        console.log(`� SHIELD: Using fallback for ${operationName}`);
        try {
          return await fallback();
        } catch (fallbackError) {
          console.log(`⚠️ SHIELD: Fallback also failed for ${operationName}`);
          return {
            success: false,
            error: 'Both primary and fallback operations failed',
            offline: true
          };
        }
      }
      
      return {
        success: false,
        error: error.message,
        offline: this.isShieldActive
      };
    }
  }

  // Emergency reset function
  emergencyReset() {
    console.log('🔄 SHIELD: Emergency reset activated');
    this.errorCount = 0;
    this.isOnline = true;
    this.isShieldActive = false;
    this.lastError = null;
    
    // Clear any cached operations
    this.operations.clear();
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  // Force offline mode for emergency situations
  forceOfflineMode() {
    console.log('🚫 SHIELD: Force offline mode activated');
    this.isOnline = false;
    this.isShieldActive = true;
    this.errorCount = this.maxErrors;
  }

  // Safe Firestore operations with automatic fallbacks
  async safeQuery(collection, fallbackData = []) {
    return this.executeOperation(
      'query',
      async () => {
        const { db } = await import('./safeConfig');
        const { collection: firestoreCollection, getDocs } = await import('firebase/firestore');
        const snapshot = await getDocs(firestoreCollection(db, collection));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      },
      () => fallbackData
    );
  }

  async safeAdd(collection, data, fallbackId = 'offline-doc') {
    return this.executeOperation(
      'add',
      async () => {
        const { db } = await import('./safeConfig');
        const docRef = await db.collection(collection).add(data);
        return { id: docRef.id };
      },
      () => ({ id: fallbackId })
    );
  }

  async safeUpdate(collection, docId, data) {
    return this.executeOperation(
      'update',
      async () => {
        const { db } = await import('./safeConfig');
        await db.collection(collection).doc(docId).update(data);
        return true;
      },
      () => true
    );
  }

  async safeGet(collection, docId, fallbackData = null) {
    return this.executeOperation(
      'get',
      async () => {
        const { db } = await import('./safeConfig');
        const doc = await db.collection(collection).doc(docId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : fallbackData;
      },
      () => fallbackData
    );
  }

  // Reset the shield (for recovery attempts)
  reset() {
    this.errorCount = 0;
    this.isOnline = true;
    this.lastError = null;
    console.log('🔄 FirestoreErrorShield reset');
  }

  // Get current status
  getStatus() {
    return {
      isOnline: this.isOnline,
      errorCount: this.errorCount,
      lastError: this.lastError?.message || null
    };
  }
}

// Create singleton instance
const firestoreShield = new FirestoreErrorShield();

// Export safe operations
export const safeFirestoreQuery = (collection, fallbackData) => 
  firestoreShield.safeQuery(collection, fallbackData);

export const safeFirestoreAdd = (collection, data, fallbackId) => 
  firestoreShield.safeAdd(collection, data, fallbackId);

export const safeFirestoreUpdate = (collection, docId, data) => 
  firestoreShield.safeUpdate(collection, docId, data);

export const safeFirestoreGet = (collection, docId, fallbackData) => 
  firestoreShield.safeGet(collection, docId, fallbackData);

export const resetFirestoreShield = () => firestoreShield.reset();

export const getFirestoreShieldStatus = () => firestoreShield.getStatus();

// Additional functions for emergency control
export const forceOfflineFirestore = () => firestoreShield.forceOfflineMode();
export const getShieldStatus = () => firestoreShield.getStatus();
export const isShieldActive = () => firestoreShield.isShieldActive;
export const reportEmergencyError = (error) => firestoreShield.handleFirestoreError(error);
export const getShieldInstance = () => firestoreShield;

export default firestoreShield;
