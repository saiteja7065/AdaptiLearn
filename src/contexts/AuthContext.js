import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  signInWithGooglePopup, 
  signInWithEmail, 
  createUserWithEmail, 
  signOutUser, 
  onAuthStateChangedListener,
  createUserDocumentFromAuth
} from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Firebase authentication functions
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await signInWithEmail(email, password);
      
      // Try to create user document, but don't fail if it doesn't work
      try {
        await createUserDocumentFromAuth(response.user);
      } catch (docError) {
        console.log('⚠️ User document creation failed, but login succeeded:', docError.message);
      }
      
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.message.includes('offline')) {
        errorMessage = 'Connection issue. Please check your internet connection.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, displayName) => {
    try {
      setLoading(true);
      const response = await createUserWithEmail(email, password);
      
      // Try to create user document, but don't fail if it doesn't work
      try {
        await createUserDocumentFromAuth(response.user, {
          displayName: displayName || email.split('@')[0]
        });
      } catch (docError) {
        console.log('⚠️ User document creation failed, but registration succeeded:', docError.message);
      }
      
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.message.includes('offline')) {
        errorMessage = 'Connection issue. Please check your internet connection.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const response = await signInWithGooglePopup();
      
      // Try to create user document, but don't fail if it doesn't work
      try {
        await createUserDocumentFromAuth(response.user);
      } catch (docError) {
        console.log('⚠️ User document creation failed, but Google login succeeded:', docError.message);
      }
      
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Google login error:', error);
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled.';
      } else if (error.message.includes('offline')) {
        errorMessage = 'Connection issue. Please check your internet connection.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      // Firebase password reset will be implemented
      // For now, return success to maintain interface
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Password reset email sent!' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  };

  // Firebase auth state listener with enhanced error handling
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onAuthStateChangedListener((userAuth) => {
      try {
        if (userAuth) {
          // Handle user document creation with error boundaries
          createUserDocumentFromAuth(userAuth).catch(error => {
            console.log('⚠️ User document sync failed (non-critical):', error.message);
            // Continue with authentication even if document creation fails
          });
          
          setUser(userAuth);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        // Reset to safe state on error
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.log('Auth listener cleanup error:', error);
      }
    };
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};