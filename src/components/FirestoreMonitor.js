import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Button,
  Chip,
  LinearProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { 
  Security, 
  Warning, 
  CheckCircle, 
  Error, 
  Refresh,
  Monitor
} from '@mui/icons-material';
import { getFirestoreShieldStatus, resetFirestoreShield } from '../firebase/firestoreShield';

const FirestoreMonitor = () => {
  const [shieldStatus, setShieldStatus] = useState({
    isOnline: true,
    errorCount: 0,
    lastError: null
  });
  const [monitoring, setMonitoring] = useState(true);

  useEffect(() => {
    const updateStatus = () => {
      if (monitoring) {
        setShieldStatus(getFirestoreShieldStatus());
      }
    };

    // Update status every 2 seconds
    const interval = setInterval(updateStatus, 2000);
    updateStatus(); // Initial update

    return () => clearInterval(interval);
  }, [monitoring]);

  const handleReset = () => {
    resetFirestoreShield();
    setShieldStatus(getFirestoreShieldStatus());
  };

  const getStatusColor = () => {
    if (!shieldStatus.isOnline) return 'error';
    if (shieldStatus.errorCount > 0) return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    if (!shieldStatus.isOnline) return <Error />;
    if (shieldStatus.errorCount > 0) return <Warning />;
    return <CheckCircle />;
  };

  const getStatusText = () => {
    if (!shieldStatus.isOnline) return 'Offline Mode';
    if (shieldStatus.errorCount > 0) return 'Protected Mode';
    return 'Online & Secure';
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Security color="primary" />
          <Typography variant="h6">
            🛡️ Firestore Shield Monitor
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Refresh />}
          onClick={handleReset}
        >
          Reset Shield
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                {getStatusIcon()}
                <Typography variant="h6">
                  Status
                </Typography>
              </Box>
              <Chip
                label={getStatusText()}
                color={getStatusColor()}
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Monitor />
                <Typography variant="h6">
                  Error Count
                </Typography>
              </Box>
              <Typography variant="h4" color={shieldStatus.errorCount > 0 ? 'warning.main' : 'success.main'}>
                {shieldStatus.errorCount}
              </Typography>
              {shieldStatus.errorCount > 0 && (
                <LinearProgress 
                  variant="determinate" 
                  value={(shieldStatus.errorCount / 5) * 100}
                  color="warning"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Warning />
                <Typography variant="h6">
                  Protection Level
                </Typography>
              </Box>
              <Chip
                label={shieldStatus.isOnline ? 'Real-time' : 'Offline Fallback'}
                color={shieldStatus.isOnline ? 'success' : 'error'}
                variant="filled"
              />
            </CardContent>
          </Card>
        </Grid>

        {shieldStatus.lastError && (
          <Grid item xs={12}>
            <Alert severity="warning">
              <Typography variant="subtitle2">Last Error:</Typography>
              <Typography variant="body2">{shieldStatus.lastError}</Typography>
            </Alert>
          </Grid>
        )}

        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              🛡️ The Firestore Shield automatically handles INTERNAL ASSERTION FAILED errors and provides 
              seamless fallback functionality. Your app continues to work even when Firestore encounters issues.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FirestoreMonitor;
