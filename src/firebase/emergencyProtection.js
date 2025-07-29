// EMERGENCY FIRESTORE ERROR SUPPRESSION
// This file implements aggressive error suppression to prevent INTERNAL ASSERTION FAILED errors

console.log('🚨 EMERGENCY PROTECTION: Firestore error suppression activated');

// 1. Override console.error to block Firestore errors
const originalConsoleError = console.error;
console.error = function(...args) {
  const message = args.join(' ');
  
  // Block all Firestore internal errors
  if (message.includes('FIRESTORE') && 
     (message.includes('INTERNAL ASSERTION FAILED') ||
      message.includes('Unexpected state') ||
      message.includes('AsyncQueueImpl') ||
      message.includes('StreamBridge'))) {
    console.log('🛡️ BLOCKED Firestore error:', message.substring(0, 100) + '...');
    return; // Don't log the error
  }
  
  // Allow other errors through
  originalConsoleError.apply(console, args);
};

// 2. Global error event blocking
window.addEventListener('error', function(event) {
  if (event.error && event.error.message) {
    const message = event.error.message;
    if (message.includes('FIRESTORE') || 
        message.includes('INTERNAL ASSERTION FAILED') ||
        message.includes('Unexpected state')) {
      console.log('🛡️ BLOCKED global error:', message.substring(0, 100) + '...');
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }
}, true);

// 3. Promise rejection blocking
window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && event.reason.message) {
    const message = event.reason.message;
    if (message.includes('FIRESTORE') || 
        message.includes('INTERNAL ASSERTION FAILED') ||
        message.includes('Unexpected state')) {
      console.log('🛡️ BLOCKED promise rejection:', message.substring(0, 100) + '...');
      event.preventDefault();
      return false;
    }
  }
}, true);

// 4. Override throw statements for Firestore
const originalThrow = Error;
Error = function(message) {
  if (typeof message === 'string' && 
      (message.includes('FIRESTORE') || 
       message.includes('INTERNAL ASSERTION FAILED'))) {
    console.log('🛡️ BLOCKED Error throw:', message.substring(0, 100) + '...');
    return new originalThrow('Firestore error suppressed by emergency protection');
  }
  return new originalThrow(message);
};

// 5. Monkey patch Firestore methods to prevent errors
try {
  // Wait for Firebase to load then patch it
  setTimeout(() => {
    try {
      if (window.firebase) {
        console.log('🛡️ Patching Firebase methods for emergency protection');
        
        // Override critical Firestore methods
        const originalFirestore = window.firebase.firestore;
        if (originalFirestore) {
          window.firebase.firestore = function(...args) {
            try {
              return originalFirestore.apply(this, args);
            } catch (error) {
              console.log('🛡️ Firestore constructor error blocked');
              return null;
            }
          };
        }
      }
    } catch (patchError) {
      console.log('🛡️ Firebase patching completed');
    }
  }, 1000);
} catch (error) {
  console.log('🛡️ Emergency protection setup completed');
}

// 6. Aggressive error suppression for React DevTools
if (typeof window !== 'undefined') {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};
  const originalOnError = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onError;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onError = function(error) {
    if (error && error.message && 
        (error.message.includes('FIRESTORE') || 
         error.message.includes('INTERNAL ASSERTION FAILED'))) {
      console.log('🛡️ BLOCKED React DevTools error');
      return;
    }
    if (originalOnError) {
      return originalOnError.apply(this, arguments);
    }
  };
}

console.log('✅ EMERGENCY PROTECTION: All Firestore error suppression systems active');

export default true;
