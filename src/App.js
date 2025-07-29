import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// CRITICAL: Emergency protection must be loaded first
import './firebase/emergencyProtection';

// EMERGENCY: Activate Firestore Shield immediately
import { forceOfflineFirestore } from './firebase/firestoreShield';

// Firebase connection test
import './firebaseTest';

// Initialize Firestore Shield
import './firebase/firestoreShield';

// Components
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import ProfileSetup from './components/ProfileSetup';
import Profile from './components/Profile';
import Assessment from './components/Assessment';
import MockTest from './components/MockTest';
import Analytics from './components/Analytics';
import Feedback from './components/Feedback';
import FirebaseTest from './components/FirebaseTest';
import SyllabusUpload from './components/SyllabusUpload';
import PDFUploadManager from './components/PDFUploadManager';
import PDFBrowser from './components/PDFBrowser';
import FirestoreErrorBoundary from './components/FirestoreErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AuthenticatedRedirect from './components/AuthenticatedRedirect';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';

// EMERGENCY SHIELD ACTIVATION
console.log('🛡️ EMERGENCY: Activating Firestore Shield Protection');
// Force protection mode due to severe errors
forceOfflineFirestore();

// Custom Material-UI Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1DB584',
      light: '#4DCCB7',
      dark: '#16A085',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6B73C1',
      light: '#889AFF',
      dark: '#5A67D8',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F8F9FA',
      paper: 'rgba(255, 255, 255, 0.95)',
    },
    text: {
      primary: '#212529',
      secondary: '#495057',
    },
    success: {
      main: '#4ECDC4',
      light: '#5EEAD4',
      dark: '#14B8A6',
    },
    warning: {
      main: '#FF6B6B',
      light: '#FC8181',
      dark: '#E53E3E',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '3rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #1DB584 0%, #16A085 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #16A085 0%, #138A72 100%)',
            boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 0 20px rgba(29, 181, 132, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.9) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.9)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 1)',
            },
            '&.Mui-focused': {
              background: 'rgba(255, 255, 255, 1)',
              boxShadow: '0 0 0 3px rgba(29, 181, 132, 0.1)',
            },
          },
        },
      },
    },
  },
});

function App() {
  // Initialize ultimate error protection
  useEffect(() => {
    console.log('🛡️ AdaptiLearn App starting with Firestore Shield protection');
    
    // Additional global error monitoring
    const handleUnhandledError = (event) => {
      if (event.error?.message?.includes('FIRESTORE')) {
        console.log('🚨 App-level Firestore error intercepted');
        event.preventDefault();
      }
    };
    
    window.addEventListener('error', handleUnhandledError);
    return () => window.removeEventListener('error', handleUnhandledError);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FirestoreErrorBoundary>
        <AuthProvider>
          <UserProvider>
            <Router>
              <div className="App min-h-screen">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/redirect" element={<AuthenticatedRedirect />} />
                  <Route 
                    path="/profile-setup" 
                    element={
                      <ProtectedRoute requiresProfile={false}>
                        <ProfileSetup />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute requiresProfile={false}>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/assessment" 
                    element={
                      <ProtectedRoute>
                        <Assessment />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/mock-test" 
                    element={
                      <ProtectedRoute>
                        <MockTest />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/analytics" 
                    element={
                      <ProtectedRoute>
                        <Analytics />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/feedback" 
                    element={
                      <ProtectedRoute>
                        <Feedback />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/firebase-test" 
                    element={
                      <ProtectedRoute requiresProfile={false}>
                        <FirebaseTest />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/syllabus" 
                    element={
                      <ProtectedRoute>
                        <SyllabusUpload />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/pdf-upload" 
                    element={
                      <ProtectedRoute>
                        <PDFUploadManager />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/pdf-browser" 
                    element={
                      <ProtectedRoute>
                        <PDFBrowser />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </div>
            </Router>
          </UserProvider>
        </AuthProvider>
      </FirestoreErrorBoundary>
    </ThemeProvider>
  );
}

export default App;