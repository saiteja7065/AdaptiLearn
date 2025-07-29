import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { CircularProgress, Box, Typography } from '@mui/material';

const AuthenticatedRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { userProfile, loading: userLoading } = useUser();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      // Wait for both auth and user data to load
      if (authLoading || userLoading) {
        return;
      }

      setChecking(false);

      // If not authenticated, redirect to auth page
      if (!isAuthenticated || !user) {
        navigate('/auth');
        return;
      }

      // Check if this is a new user (from sign-up)
      const isNewUser = location.state?.isNewUser;

      if (isNewUser) {
        // New user from sign-up - always redirect to profile setup
        console.log('New user from sign-up detected, redirecting to profile setup');
        navigate('/profile-setup');
      } else {
        // Existing user from sign-in - always redirect to dashboard
        console.log('Existing user sign-in detected, redirecting to dashboard');
        navigate('/dashboard');
      }
    };

    handleRedirect();
  }, [isAuthenticated, user, userProfile, authLoading, userLoading, navigate, location.state]);

  // Show loading while checking
  if (authLoading || userLoading || checking) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        gap={2}
        sx={{
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
      >
        <CircularProgress size={60} sx={{ color: '#1DB584' }} />
        <Typography variant="h6" color="text.secondary">
          Setting up your workspace...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Checking your profile information
        </Typography>
      </Box>
    );
  }

  return null;
};

export default AuthenticatedRedirect;
