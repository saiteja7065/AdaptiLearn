import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  Divider,
  Box,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Person,
  School,
  Subject,
  Edit,
  ArrowBack,
  AccountCircle,
  Category,
  Grade
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, branches, loading } = useUser();
  const [isEditing, setIsEditing] = useState(false);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!userProfile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">
          No profile found. Please complete your profile setup.
          <Button onClick={() => navigate('/profile-setup')} sx={{ ml: 2 }}>
            Setup Profile
          </Button>
        </Alert>
      </Container>
    );
  }

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : branchId;
  };

  const handleEditProfile = () => {
    navigate('/profile-setup', { state: { editMode: true } });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <IconButton onClick={() => navigate('/dashboard')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" fontWeight={600}>
          My Profile
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Profile Overview Card */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ textAlign: 'center', p: 3 }}>
              <CardContent>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    margin: '0 auto 16px',
                    bgcolor: 'primary.main',
                    fontSize: '2rem'
                  }}
                >
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <AccountCircle sx={{ fontSize: 60 }} />}
                </Avatar>
                
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  {user?.displayName || 'Student'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user?.email}
                </Typography>

                <Chip
                  icon={<School />}
                  label={getBranchName(userProfile.branch)}
                  color="primary"
                  sx={{ mt: 2, mb: 2 }}
                />

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {userProfile.semester ? `${userProfile.semester} Semester` : 'Semester not set'}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => navigate('/profile-setup')}
                  sx={{ mt: 3 }}
                  fullWidth
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Academic Information
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Category color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Branch
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {getBranchName(userProfile.branch)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Grade color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Semester
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {userProfile.semester || 'Not set'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <Subject color="primary" sx={{ mt: 0.5 }} />
                      <Box flex={1}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Selected Subjects ({userProfile.selectedSubjects?.length || 0})
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {userProfile.selectedSubjects && userProfile.selectedSubjects.length > 0 ? (
                            userProfile.selectedSubjects.map((subjectId, index) => (
                              <Chip
                                key={index}
                                label={subjectId.toUpperCase()}
                                variant="outlined"
                                size="small"
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No subjects selected
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Account Information
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Profile Created
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {userProfile.updatedAt ? new Date(userProfile.updatedAt).toLocaleDateString() : 'Never'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
