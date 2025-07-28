import React from 'react';

class FirestoreErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a Firestore internal assertion error
    if (error?.message?.includes('FIRESTORE') || 
        error?.message?.includes('INTERNAL ASSERTION FAILED')) {
      console.log('🔥 Firestore error caught by boundary:', error.message);
      return { hasError: true, error };
    }
    
    // Let other errors bubble up
    return null;
  }

  componentDidCatch(error, errorInfo) {
    // Only handle Firestore-related errors
    if (error?.message?.includes('FIRESTORE') || 
        error?.message?.includes('INTERNAL ASSERTION FAILED')) {
      console.error('🔥 Firestore Error Boundary:', error, errorInfo);
      
      // Attempt to recover from Firestore connection issues
      setTimeout(() => {
        console.log('🔄 Attempting to recover from Firestore error...');
        this.setState({ hasError: false, error: null });
      }, 2000);
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
          <h3>🔥 Database Connection Issue</h3>
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
