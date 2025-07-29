import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { CircularProgress, Box, Typography } from '@mui/material';

const ProtectedRoute = ({ children, requiresProfile = true }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { userProfile, loading: userLoading } = useUser();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      // Wait for auth to finish loading
      if (authLoading || userLoading) {
        return;
      }

      // If not authenticated, redirect to auth page
      if (!isAuthenticated || !user) {
        navigate('/auth');
        return;
      }

      // If authentication is complete, check profile requirements
      if (requiresProfile) {
        // If no profile exists, redirect to profile setup
        if (!userProfile || !userProfile.branch) {
          navigate('/profile-setup');
          return;
        }
      }

      // All checks passed
      setChecking(false);
    };

    checkAuthAndProfile();
  }, [isAuthenticated, user, userProfile, authLoading, userLoading, navigate, requiresProfile]);

  // Show loading while checking authentication and profile
  if (authLoading || userLoading || checking) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading your profile...
        </Typography>
      </Box>
    );
  }

  // If user is authenticated and (profile exists or not required), render the protected component
  if (isAuthenticated && (!requiresProfile || userProfile)) {
    return children;
  }

  // This should not be reached due to the redirects above, but just in case
  return null;
};

export default ProtectedRoute;
