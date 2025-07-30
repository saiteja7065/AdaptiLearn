import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  School,
  MenuBook,
  Psychology,
  CheckCircle,
  ArrowForward,
  ArrowBack,
  Close
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { 
    branches, 
    subjectsByBranch, 
    semesters, 
    createProfile, 
    updateProfile,
    loading, 
    userProfile,
    loadSubjectsForBranch,
    loadingBranches,
    loadingSubjects 
  } = useUser();

  // Check if we're in edit mode
  const isEditMode = location.state?.editMode || false;
  
  const [activeStep, setActiveStep] = useState(0);
  const [profileData, setProfileData] = useState({
    branch: '',
    semester: '',
    selectedSubjects: []
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Initialize profile data if editing
  useEffect(() => {
    if (isEditMode && userProfile) {
      setProfileData({
        branch: userProfile.branch || '',
        semester: userProfile.semester || '',
        selectedSubjects: userProfile.selectedSubjects || []
      });
    }
  }, [isEditMode, userProfile]);

  // Load subjects when branch changes
  useEffect(() => {
    const loadSubjects = async () => {
      if (profileData.branch) {
        try {
          const subjects = await loadSubjectsForBranch(profileData.branch);
          setAvailableSubjects(subjects);
        } catch (error) {
          console.error('Error loading subjects:', error);
          setAvailableSubjects([]);
        }
      } else {
        setAvailableSubjects([]);
      }
    };

    loadSubjects();
  }, [profileData.branch, loadSubjectsForBranch]);

  const steps = [
    {
      label: 'Choose Branch',
      icon: <School />,
      description: 'Select your engineering branch'
    },
    {
      label: 'Select Semester',
      icon: <MenuBook />,
      description: 'Choose your current semester'
    },
    {
      label: 'Pick Subjects',
      icon: <Psychology />,
      description: 'Select subjects for assessment'
    }
  ];

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // If user already has a complete profile and not in edit mode, redirect to dashboard
    if (!isEditMode && userProfile && userProfile.setupCompleted === true) {
      console.log('✅ User already has a complete profile, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }
  }, [user, userProfile, navigate]);

  const handleBranchChange = (event) => {
    const selectedBranch = event.target.value;
    setProfileData(prev => ({
      ...prev,
      branch: selectedBranch,
      selectedSubjects: [] // Reset subjects when branch changes
    }));
    setErrors(prev => ({ ...prev, branch: '' }));
  };

  const handleSemesterChange = (event) => {
    setProfileData(prev => ({
      ...prev,
      semester: event.target.value
    }));
    setErrors(prev => ({ ...prev, semester: '' }));
  };

  const handleSubjectToggle = (subjectId) => {
    setProfileData(prev => {
      const isSelected = prev.selectedSubjects.includes(subjectId);
      const newSelectedSubjects = isSelected
        ? prev.selectedSubjects.filter(id => id !== subjectId)
        : [...prev.selectedSubjects, subjectId];
      
      return {
        ...prev,
        selectedSubjects: newSelectedSubjects
      };
    });
    setErrors(prev => ({ ...prev, subjects: '' }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0:
        if (!profileData.branch) {
          newErrors.branch = 'Please select your branch';
        }
        break;
      case 1:
        if (!profileData.semester) {
          newErrors.semester = 'Please select your semester';
        }
        break;
      case 2:
        if (profileData.selectedSubjects.length === 0) {
          newErrors.subjects = 'Please select at least one subject';
        } else if (profileData.selectedSubjects.length > 6) {
          newErrors.subjects = 'Please select maximum 6 subjects for optimal learning';
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep === steps.length - 1) {
        handleSubmit();
      } else {
        setActiveStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      const selectedBranch = branches.find(b => b.id === profileData.branch);
      const selectedSemester = semesters.find(s => s.id === profileData.semester);
      const selectedSubjects = profileData.selectedSubjects.map(subjectId => 
        availableSubjects?.find(s => s.id === subjectId)
      ).filter(Boolean);

      const profile = {
        branch: profileData.branch,
        semester: profileData.semester,
        selectedSubjects: profileData.selectedSubjects,
        branchData: selectedBranch,
        semesterData: selectedSemester,
        subjects: selectedSubjects,
        setupCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          difficultyLevel: 'medium',
          studyGoals: ['exam_preparation'],
          learningStyle: 'adaptive'
        }
      };

      let result;
      if (isEditMode) {
        result = await updateProfile(profile);
      } else {
        result = await createProfile(profile);
      }
      
      if (result.success) {
        setAlert({
          show: true,
          message: `Profile ${isEditMode ? 'updated' : 'created'} successfully! Redirecting to ${isEditMode ? 'profile' : 'dashboard'}...`,
          type: 'success'
        });
        
        setTimeout(() => {
          navigate(isEditMode ? '/profile' : '/dashboard');
        }, 2000);
      } else {
        setAlert({
          show: true,
          message: result.error || `Failed to ${isEditMode ? 'update' : 'create'} profile. Please try again.`,
          type: 'error'
        });
      }
    } catch (error) {
      setAlert({
        show: true,
        message: 'An unexpected error occurred. Please try again.',
        type: 'error'
      });
    }
  };

  const getAvailableSubjects = () => {
    return availableSubjects;
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h5" className="font-semibold mb-6 text-center">
              What's your engineering branch?
            </Typography>
            
            <FormControl fullWidth error={!!errors.branch}>
              <InputLabel>Select Branch</InputLabel>
              <Select
                value={profileData.branch}
                onChange={handleBranchChange}
                label="Select Branch"
                className="mb-4"
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    <div>
                      <Typography variant="body1" className="font-medium">
                        {branch.name}
                      </Typography>
                      <Typography variant="body2" className="text-neutral-600">
                        {branch.code}
                      </Typography>
                    </div>
                  </MenuItem>
                ))}
              </Select>
              {errors.branch && (
                <Typography variant="body2" className="text-red-500 mt-2">
                  {errors.branch}
                </Typography>
              )}
            </FormControl>

            {profileData.branch && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <Card className="card-elevated">
                  <CardContent className="text-center">
                    <School className="text-4xl text-primary-500 mb-2" />
                    <Typography variant="h6" className="font-semibold">
                      {branches.find(b => b.id === profileData.branch)?.name}
                    </Typography>
                    <Typography variant="body2" className="text-neutral-600">
                      Great choice! Let's continue with your semester.
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h5" className="font-semibold mb-6 text-center">
              Which semester are you in?
            </Typography>
            
            <FormControl fullWidth error={!!errors.semester}>
              <InputLabel>Select Semester</InputLabel>
              <Select
                value={profileData.semester}
                onChange={handleSemesterChange}
                label="Select Semester"
                className="mb-4"
              >
                {semesters.map((semester) => (
                  <MenuItem key={semester.id} value={semester.id}>
                    {semester.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.semester && (
                <Typography variant="body2" className="text-red-500 mt-2">
                  {errors.semester}
                </Typography>
              )}
            </FormControl>

            {profileData.semester && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <Card className="card-elevated">
                  <CardContent className="text-center">
                    <MenuBook className="text-4xl text-secondary-500 mb-2" />
                    <Typography variant="h6" className="font-semibold">
                      {semesters.find(s => s.id === profileData.semester)?.name}
                    </Typography>
                    <Typography variant="body2" className="text-neutral-600">
                      Perfect! Now let's choose your subjects.
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h5" className="font-semibold mb-2 text-center">
              Select your subjects
            </Typography>
            <Typography variant="body1" className="text-neutral-600 mb-6 text-center">
              Choose 3-6 subjects you want to focus on (recommended: 4-5 subjects)
            </Typography>
            
            {/* Real-time indicator */}
            {availableSubjects.length > 0 && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Real-time data loaded • {availableSubjects.length} subjects available for {
                  branches.find(b => b.id === profileData.branch)?.name || 'your branch'
                }
              </Alert>
            )}
            
            {/* Loading state */}
            {loadingSubjects && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Loading subjects for {branches.find(b => b.id === profileData.branch)?.name}...
                </Typography>
              </Box>
            )}
            
            <div className="mb-4">
              <Typography variant="body2" className="text-neutral-600 mb-2">
                Selected: {profileData.selectedSubjects.length}/6
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(profileData.selectedSubjects.length / 6) * 100}
                className="h-2 rounded-full"
                sx={{
                  backgroundColor: 'rgba(29, 181, 132, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(135deg, #1DB584 0%, #16A085 100%)',
                    borderRadius: '4px'
                  }
                }}
              />
            </div>

            <Grid container spacing={2} className="mb-4">
              {getAvailableSubjects().map((subject) => {
                const isSelected = profileData.selectedSubjects.includes(subject.id);
                return (
                  <Grid item xs={12} sm={6} key={subject.id}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? 'ring-2 ring-primary-500 shadow-glow-primary'
                            : 'hover:shadow-medium'
                        }`}
                        onClick={() => handleSubjectToggle(subject.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <Typography variant="body1" className="font-medium">
                                  {subject.name}
                                </Typography>
                                {isSelected && (
                                  <CheckCircle className="text-primary-500" />
                                )}
                              </div>
                              <Typography variant="body2" className="text-neutral-600 mb-2">
                                {subject.code}
                              </Typography>
                              
                              {/* Enhanced metadata display */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {subject.difficulty && (
                                  <Chip 
                                    label={subject.difficulty} 
                                    size="small"
                                    color={
                                      subject.difficulty === 'easy' ? 'success' :
                                      subject.difficulty === 'medium' ? 'warning' : 'error'
                                    }
                                    variant="outlined"
                                  />
                                )}
                                {subject.credits && (
                                  <Chip 
                                    label={`${subject.credits} credits`} 
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                                {subject.popularity && subject.popularity > 80 && (
                                  <Chip 
                                    label="Popular" 
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                );
              })}
            </Grid>

            {profileData.selectedSubjects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Typography variant="body2" className="text-neutral-600 mb-2">
                  Selected Subjects:
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {profileData.selectedSubjects.map((subjectId) => {
                    const subject = getAvailableSubjects().find(s => s.id === subjectId);
                    return (
                      <Chip
                        key={subjectId}
                        label={subject?.code}
                        onDelete={() => handleSubjectToggle(subjectId)}
                        className="gradient-primary text-white"
                        sx={{
                          background: 'linear-gradient(135deg, #1DB584 0%, #16A085 100%)',
                          color: 'white',
                          '& .MuiChip-deleteIcon': {
                            color: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': {
                              color: 'white'
                            }
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </motion.div>
            )}

            {errors.subjects && (
              <Typography variant="body2" className="text-red-500 mt-4">
                {errors.subjects}
              </Typography>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 py-8">
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            {isEditMode && (
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <IconButton onClick={() => navigate('/profile')} size="large">
                  <ArrowBack />
                </IconButton>
                <Box />
                <IconButton onClick={() => navigate('/profile')} size="large">
                  <Close />
                </IconButton>
              </Box>
            )}
            <Typography variant="h3" className="font-bold mb-2 text-gradient-primary">
              {isEditMode ? 'Edit Your Profile' : 'Set Up Your Profile'}
            </Typography>
            <Typography variant="h6" className="text-neutral-600">
              {isEditMode ? 'Update your learning preferences' : "Let's personalize your learning experience"}
            </Typography>
          </div>

          {alert.show && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Alert 
                severity={alert.type}
                onClose={() => setAlert({ show: false, message: '', type: 'info' })}
                className="rounded-xl"
              >
                {alert.message}
              </Alert>
            </motion.div>
          )}

          <Paper className="card-elevated p-8">
            {/* Stepper */}
            <Stepper activeStep={activeStep} className="mb-8">
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepLabel
                    icon={
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index <= activeStep 
                          ? 'gradient-primary text-white' 
                          : 'bg-neutral-200 text-neutral-500'
                      }`}>
                        {index < activeStep ? <CheckCircle /> : step.icon}
                      </div>
                    }
                  >
                    <Typography variant="body1" className="font-medium">
                      {step.label}
                    </Typography>
                    <Typography variant="body2" className="text-neutral-600">
                      {step.description}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step Content */}
            <div className="min-h-[400px] flex flex-col justify-between">
              <div className="flex-1">
                {renderStepContent(activeStep)}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  startIcon={<ArrowBack />}
                  className="text-neutral-600"
                >
                  Back
                </Button>

                <Button
                  onClick={handleNext}
                  variant="contained"
                  disabled={loading}
                  endIcon={activeStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
                  className="btn-primary hover-lift px-8"
                >
                  {loading ? 'Creating Profile...' : 
                   activeStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
                </Button>
              </div>
            </div>
          </Paper>
        </motion.div>
      </Container>
    </div>
  );
};

export default ProfileSetup;