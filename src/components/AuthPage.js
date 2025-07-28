import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google,
  ArrowBack,
  EmojiObjects,
  Person,
  Email,
  Lock
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, loading } = useAuth();
  
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setErrors({});
    setAlert({ show: false, message: '', type: 'info' });
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (activeTab === 1) { // Register tab
      if (!formData.displayName) {
        newErrors.displayName = 'Name is required';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      let result;
      
      if (activeTab === 0) {
        // Login
        result = await login(formData.email, formData.password);
      } else {
        // Register
        result = await register(formData.email, formData.password, formData.displayName);
      }
      
      if (result.success) {
        setAlert({
          show: true,
          message: activeTab === 0 ? 'Login successful!' : 'Account created successfully!',
          type: 'success'
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setAlert({
          show: true,
          message: result.error || 'An error occurred. Please try again.',
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

  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      
      if (result.success) {
        setAlert({
          show: true,
          message: 'Google login successful!',
          type: 'success'
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setAlert({
          show: true,
          message: result.error || 'Google login failed. Please try again.',
          type: 'error'
        });
      }
    } catch (error) {
      setAlert({
        show: true,
        message: 'Google login failed. Please try again.',
        type: 'error'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 gradient-primary rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 gradient-secondary rounded-full opacity-10 blur-3xl"></div>
      </div>

      <Container maxWidth="sm" className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <IconButton
              onClick={() => navigate('/')}
              className="mb-4 hover-lift"
              sx={{ 
                background: 'linear-gradient(135deg, #1DB584 0%, #16A085 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #16A085 0%, #138A72 100%)',
                }
              }}
            >
              <ArrowBack />
            </IconButton>
            
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-glow-primary">
                <EmojiObjects className="text-white text-2xl" />
              </div>
              <Typography variant="h4" className="font-bold text-gradient-primary">
                AdaptiLearn
              </Typography>
            </div>
            
            <Typography variant="h5" className="font-semibold text-neutral-700 mb-2">
              {activeTab === 0 ? 'Welcome Back!' : 'Join AdaptiLearn'}
            </Typography>
            
            <Typography variant="body1" className="text-neutral-600">
              {activeTab === 0 
                ? 'Sign in to continue your adaptive learning journey'
                : 'Create your account and start learning smarter'
              }
            </Typography>
          </div>

          {/* Auth Form */}
          <Paper className="card-elevated p-8">
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

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              className="mb-6"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  minWidth: 120,
                },
                '& .MuiTabs-indicator': {
                  background: 'linear-gradient(135deg, #1DB584 0%, #16A085 100%)',
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                }
              }}
            >
              <Tab label="Sign In" />
              <Tab label="Sign Up" />
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-6">
              {activeTab === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.displayName}
                    onChange={handleInputChange('displayName')}
                    error={!!errors.displayName}
                    helperText={errors.displayName}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person className="text-neutral-400" />
                        </InputAdornment>
                      ),
                    }}
                    className="input-custom"
                  />
                </motion.div>
              )}

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email className="text-neutral-400" />
                    </InputAdornment>
                  ),
                }}
                className="input-custom"
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock className="text-neutral-400" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                className="input-custom"
              />

              {activeTab === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock className="text-neutral-400" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    className="input-custom"
                  />
                </motion.div>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                className="btn-primary hover-lift py-4 text-lg font-semibold"
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  activeTab === 0 ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            <div className="my-6">
              <Divider className="relative">
                <Typography
                  variant="body2"
                  className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-neutral-500"
                >
                  or continue with
                </Typography>
              </Divider>
            </div>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleGoogleLogin}
              disabled={loading}
              startIcon={<Google />}
              className="border-2 border-neutral-200 text-neutral-700 hover:bg-neutral-50 py-4 text-lg font-semibold hover-lift"
            >
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            {activeTab === 0 && (
              <div className="text-center mt-6">
                <Button
                  variant="text"
                  className="text-primary-600 hover:text-primary-700"
                >
                  Forgot your password?
                </Button>
              </div>
            )}
          </Paper>

          <div className="text-center mt-6">
            <Typography variant="body2" className="text-neutral-600">
              {activeTab === 0 ? "Don't have an account? " : "Already have an account? "}
              <Button
                variant="text"
                onClick={() => setActiveTab(activeTab === 0 ? 1 : 0)}
                className="text-primary-600 hover:text-primary-700 font-semibold p-0 min-w-0"
              >
                {activeTab === 0 ? 'Sign up here' : 'Sign in here'}
              </Button>
            </Typography>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default AuthPage;