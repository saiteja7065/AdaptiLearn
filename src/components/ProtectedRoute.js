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
    console.log('🛡️ ProtectedRoute - Auth loading:', authLoading);
    console.log('🛡️ ProtectedRoute - User loading:', userLoading);
    console.log('🛡️ ProtectedRoute - Is authenticated:', isAuthenticated);
    console.log('🛡️ ProtectedRoute - User:', user?.uid);
    console.log('🛡️ ProtectedRoute - User profile:', userProfile);
    console.log('🛡️ ProtectedRoute - Requires profile:', requiresProfile);
    
    const checkAuthAndProfile = async () => {
      // Wait for auth to finish loading
      if (authLoading || userLoading) {
        console.log('🛡️ ProtectedRoute - Still loading...');
        return;
      }

      // If not authenticated, redirect to auth page
      if (!isAuthenticated || !user) {
        console.log('🛡️ ProtectedRoute - Not authenticated, redirecting to auth');
        navigate('/auth');
        return;
      }

      // If authentication is complete, check profile requirements
      if (requiresProfile) {
        // Check if profile exists and is complete
        const hasCompleteProfile = userProfile && 
          userProfile.branch && 
          userProfile.semester && 
          userProfile.selectedSubjects && 
          userProfile.selectedSubjects.length > 0;

        if (!hasCompleteProfile) {
          console.log('🛡️ ProtectedRoute - Incomplete profile, redirecting to setup');
          navigate('/profile-setup');
          return;
        }
      }

      // All checks passed
      console.log('🛡️ ProtectedRoute - All checks passed');
      setChecking(false);
    };

    checkAuthAndProfile();
  }, [isAuthenticated, user, userProfile, authLoading, userLoading, navigate, requiresProfile]);

  // Show loading while checking authentication and profile
  if (authLoading || userLoading || checking) {
    console.log('🛡️ ProtectedRoute - Showing loading screen');
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

  // If user is authenticated and (profile not required OR profile exists), render the protected component
  if (isAuthenticated && (!requiresProfile || userProfile !== null)) {
    console.log('🛡️ ProtectedRoute - Rendering protected content');
    return children;
  }

  // This should not be reached due to the redirects above, but just in case
  console.log('🛡️ ProtectedRoute - Fallback return null');
  return null;
};

export default ProtectedRoute;
