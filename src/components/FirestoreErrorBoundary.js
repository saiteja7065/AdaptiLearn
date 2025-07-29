import React from 'react';
import { resetConnection, handleFirestoreError } from '../firebase/connectionManager';

class FirestoreErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
    this.maxErrors = 5; // Prevent infinite error loops
  }

  static getDerivedStateFromError(error) {
    // Enhanced Firestore error detection
    const errorMessage = error?.message || error?.toString() || '';
    
    if (errorMessage.includes('FIRESTORE') && 
        (errorMessage.includes('INTERNAL ASSERTION FAILED') || 
         errorMessage.includes('Unexpected state'))) {
      console.log('Firestore INTERNAL ASSERTION error caught by boundary');
      
      // Reset Firestore connection immediately
      resetConnection();
      
      return { hasError: true, error };
    }
    
    // Let other errors bubble up
    return null;
  }

  componentDidCatch(error, errorInfo) {
    const errorMessage = error?.message || '';
    
    // Handle Firestore errors
    if (handleFirestoreError(error)) {
      console.error('Enhanced Firestore Error Boundary caught:', errorMessage);
      
      // Increment error count
      const newErrorCount = this.state.errorCount + 1;
      
      if (newErrorCount < this.maxErrors) {
        // Attempt to recover after a longer delay
        setTimeout(() => {
          console.log('🔄 Attempting enhanced recovery from Firestore error...');
          this.setState({ 
            hasError: false, 
            error: null, 
            errorCount: newErrorCount 
          });
        }, 3000);
      } else {
        console.log('🚫 Max error recovery attempts reached');
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          color: '#d63031'
        }}>
          <h3>Database Connection Issue</h3>
          <p>We're experiencing a temporary connection issue. The app will recover automatically.</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#d63031',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Retry Now
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FirestoreErrorBoundary;
