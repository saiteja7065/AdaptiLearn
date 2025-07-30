import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Chip,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Assessment,
  Quiz,
  TrendingUp,
  EmojiObjects,
  AccountCircle,
  Logout,
  Settings,
  PlayArrow,
  Analytics,
  School,
  Timer,
  Star,
  GpsFixed,
  BookmarkBorder,
  Notifications,
  CheckCircle,
  Error,
  Warning
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import apiService from '../services/apiService';
import FirestoreMonitor from './FirestoreMonitor';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { userProfile, getPerformanceAnalytics, loading, assessmentResults, mockTestResults } = useUser();
  const [realTimeData, setRealTimeData] = useState(null);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);
  const [healthCheckLoading, setHealthCheckLoading] = useState(true);

  // Check backend health on component mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        setHealthCheckLoading(true);
        const healthStatus = await apiService.checkBackendHealth();
        setBackendHealth(healthStatus);
      } catch (error) {
        console.error('Error checking backend health:', error);
        setBackendHealth([
          { service: 'ai', healthy: false },
          { service: 'data', healthy: false },
          { service: 'gateway', healthy: false }
        ]);
      } finally {
        setHealthCheckLoading(false);
      }
    };

    checkBackendHealth();
  }, []);

  useEffect(() => {
    console.log('📊 Dashboard - User:', user?.uid);
    console.log('📊 Dashboard - UserProfile:', userProfile);
    console.log('📊 Dashboard - Loading:', loading);
    console.log('📊 Dashboard - Assessment Results:', assessmentResults);
    console.log('📊 Dashboard - Mock Test Results:', mockTestResults);
    
    if (!user) {
      navigate('/auth');
      return;
    }

    // Generate analytics from UserContext data instead of backend API
    const generateAnalyticsFromUserData = () => {
      const allResults = [...(assessmentResults || []), ...(mockTestResults || [])];
      console.log('📊 Dashboard - All Results:', allResults);
      
      // Always update real-time data
      const totalTests = allResults.length;
      const totalScore = allResults.reduce((sum, result) => sum + (result.score || 0), 0);
      const averageScore = totalTests > 0 ? Math.round(totalScore / totalTests) : 0;
      
      // Calculate subject performance
      const subjectPerformance = calculateSubjectPerformance(allResults);
      
      // Set real-time data
      setRealTimeData({
        totalTests,
        averageScore,
        subjectData: subjectPerformance,
        recentTests: allResults.slice(-5).map((result, index) => ({
          id: index + 1,
          name: result.syllabus || result.topic || result.subject || 'Test',
          score: result.score || 0,
          date: result.date || result.timestamp || new Date().toISOString().split('T')[0]
        }))
      });
      
      if (allResults.length === 0) {
        console.log('📊 Dashboard - No results found, showing default analytics');
        setAnalytics(getDefaultAnalytics());
        return;
      }
      
      console.log(`📊 Dashboard - Calculated: ${totalTests} tests, ${averageScore}% average`);
      
      setAnalytics({
        overallStats: {
          totalTests,
          averageScore,
          strongAreas: subjectPerformance.filter(s => s.score > 80),
          weakAreas: subjectPerformance.filter(s => s.score < 70),
          improvementTrend: averageScore >= 70 ? 'improving' : 'needs_work'
        },
        subjectPerformance: subjectPerformance.reduce((acc, subject) => {
          acc[subject.subject] = { 
            average: subject.score, 
            scores: [subject.score - 5, subject.score - 2, subject.score, subject.score + 2, subject.score],
            trend: 'stable'
          };
          return acc;
        }, {}),
        recentTests: allResults.slice(-5).map((result, index) => ({
          id: index + 1,
          name: result.syllabus || result.topic || result.subject || 'Test',
          score: result.score || 0,
          date: result.date || result.timestamp || new Date().toISOString().split('T')[0]
        })),
        weeklyProgress: calculateWeeklyProgress(allResults)
      });
    };

    generateAnalyticsFromUserData();
  }, [user, navigate, userProfile, loading, assessmentResults, mockTestResults]);

  // Helper function to calculate subject performance
  const calculateSubjectPerformance = (results) => {
    const subjectMap = {};
    results.forEach(result => {
      const subject = result.topic || result.subject || result.syllabus || 'General';
      if (!subjectMap[subject]) {
        subjectMap[subject] = { total: 0, count: 0 };
      }
      subjectMap[subject].total += result.score || 0;
      subjectMap[subject].count += 1;
    });

    return Object.keys(subjectMap).map(subject => ({
      subject,
      score: Math.round(subjectMap[subject].total / subjectMap[subject].count),
      tests: subjectMap[subject].count
    }));
  };

  // Helper function to calculate weekly progress
  const calculateWeeklyProgress = (results) => {
    const weekMap = {};
    results.forEach(result => {
      const date = new Date(result.date || result.timestamp || new Date());
      const weekKey = `Week ${Math.ceil(date.getDate() / 7)}`;
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { total: 0, count: 0 };
      }
      weekMap[weekKey].total += result.score || 0;
      weekMap[weekKey].count += 1;
    });

    return Object.keys(weekMap).map(week => ({
      week,
      score: Math.round(weekMap[week].total / weekMap[week].count)
    }));
  };

  // Default analytics for new users
  const getDefaultAnalytics = () => ({
    overallStats: {
      totalTests: 0,
      averageScore: 0,
      strongAreas: [],
      weakAreas: [],
      improvementTrend: 'stable'
    },
    subjectPerformance: {},
    recentTests: [],
    weeklyProgress: []
  });

  // Check if profile is incomplete - handles both nested objects and simple IDs
  const isProfileIncomplete = () => {
    if (!userProfile) return true;
    
    // Check branch - can be userProfile.branch (ID) or userProfile.branch.name (object)
    const hasBranch = userProfile.branch && 
      (typeof userProfile.branch === 'string' || userProfile.branch.name || userProfile.branch.id);
    
    // Check semester - can be userProfile.semester (ID) or userProfile.semester.name (object)
    const hasSemester = userProfile.semester && 
      (typeof userProfile.semester === 'string' || typeof userProfile.semester === 'number' || 
       userProfile.semester.name || userProfile.semester.id);
    
    // Check subjects
    const hasSubjects = userProfile.selectedSubjects && 
      Array.isArray(userProfile.selectedSubjects) && 
      userProfile.selectedSubjects.length > 0;
    
    return !hasBranch || !hasSemester || !hasSubjects;
  };

  // Get branch display name - handles both formats
  const getBranchDisplayName = () => {
    if (!userProfile?.branch) return 'Please complete your profile';
    
    if (typeof userProfile.branch === 'string') {
      return userProfile.branch; // Return the branch code/ID
    }
    
    return userProfile.branch.name || userProfile.branch.id || 'Unknown branch';
  };

  // Get semester display name - handles both formats  
  const getSemesterDisplayName = () => {
    if (!userProfile?.semester) return 'Setup required';
    
    if (typeof userProfile.semester === 'string' || typeof userProfile.semester === 'number') {
      return `Semester ${userProfile.semester}`;
    }
    
    return userProfile.semester.name || `Semester ${userProfile.semester.id}` || 'Unknown semester';
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Get branch-specific performance data from API
  const [performanceData, setPerformanceData] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);

  // Fetch analytics data based on user's branch
  useEffect(() => {
    const fetchAnalytics = async () => {
      // Debug user profile structure
      console.log('🔍 Dashboard - UserProfile structure:', userProfile);
      console.log('🔍 Dashboard - Branch:', userProfile?.branch);
      console.log('🔍 Dashboard - Semester:', userProfile?.semester);
      
      // Extract branch code with fallbacks
      let branchCode = 'CSE'; // Default fallback
      if (userProfile?.branch?.code) {
        branchCode = userProfile.branch.code;
      } else if (userProfile?.branch?.id) {
        branchCode = userProfile.branch.id.toUpperCase();
      } else if (userProfile?.branch) {
        branchCode = userProfile.branch.toUpperCase();
      }
      
      // Extract semester with fallback
      let semesterValue = 1; // Default fallback
      if (userProfile?.semester?.value) {
        semesterValue = userProfile.semester.value;
      } else if (userProfile?.semester?.id) {
        semesterValue = userProfile.semester.id;
      } else if (typeof userProfile?.semester === 'number') {
        semesterValue = userProfile.semester;
      }
      
      console.log(`📊 Dashboard - Fetching analytics for branch: ${branchCode}, semester: ${semesterValue}`);
      
      try {
        // Get performance analytics for user's branch
        const performanceResponse = await apiService.get(`/api/analytics/performance?branch=${branchCode}&semester=${semesterValue}`);
        console.log('📊 Dashboard - Performance Response:', performanceResponse);
        if (performanceResponse.success) {
          setPerformanceData(performanceResponse.analytics);
        }

        // Get recommendations for user's branch  
        const recommendationsResponse = await apiService.get(`/api/recommendations?branch=${branchCode}&semester=${semesterValue}`);
        console.log('📊 Dashboard - Recommendations Response:', recommendationsResponse);
        if (recommendationsResponse.success) {
          setRecommendationsData(recommendationsResponse.recommendations);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        // Fall back to default data with proper subjects for the branch
        const fallbackSubjects = branchCode === 'MECH' ? [
          { subject: 'Thermodynamics', score: 75, improvement: 5, tests_taken: 3 },
          { subject: 'Fluid Mechanics', score: 72, improvement: -2, tests_taken: 4 }
        ] : [
          { subject: 'Data Structures', score: 85, improvement: 5, tests_taken: 3 },
          { subject: 'Algorithms', score: 72, improvement: -2, tests_taken: 4 }
        ];
        
        setPerformanceData({
          overall_score: 75,
          total_tests: 7,
          subject_performance: fallbackSubjects,
          performance_trend: 'stable',
          weak_areas: fallbackSubjects.filter(s => s.score < 75).map(s => s.subject),
          strong_areas: fallbackSubjects.filter(s => s.score >= 80).map(s => s.subject),
          branch: branchCode,
          semester: semesterValue
        });
      }
    };

    // Only fetch if user is authenticated, but don't wait for complete userProfile
    if (user) {
      fetchAnalytics();
    }
  }, [user, userProfile]);

  // Use local analytics data instead of backend API
  const currentAnalytics = analytics || {
    overallStats: {
      totalTests: 0,
      averageScore: 0,
      strongAreas: [],
      weakAreas: [],
      improvementTrend: 'stable'
    },
    subjectPerformance: {}
  };

  // Chart configurations with real-time data
  const subjectData = realTimeData?.subjectData || [];
  const performanceChartData = {
    labels: subjectData.length > 0 ? subjectData.map(s => s.subject) : ['No Data'],
    datasets: [
      {
        label: 'Average Score',
        data: subjectData.length > 0 ? subjectData.map(s => s.score) : [0],
        backgroundColor: [
          'rgba(29, 181, 132, 0.8)',
          'rgba(107, 115, 193, 0.8)',
          'rgba(78, 205, 196, 0.8)',
          'rgba(255, 107, 107, 0.8)'
        ],
        borderColor: [
          '#1DB584',
          '#6B73C1',
          '#4ECDC4',
          '#FF6B6B'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const progressChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current'],
    datasets: [
      {
        label: 'Overall Performance',
        data: [65, 70, 75, 78, 78],
        borderColor: '#1DB584',
        backgroundColor: 'rgba(29, 181, 132, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#1DB584',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 6,
      }
    ]
  };

  const strengthWeaknessData = {
    labels: ['Strong Areas', 'Weak Areas', 'Average Areas'],
    datasets: [
      {
        data: [
          subjectData.filter(s => s.score > 80).length,
          subjectData.filter(s => s.score < 70).length,
          subjectData.filter(s => s.score >= 70 && s.score <= 80).length
        ],
        backgroundColor: [
          '#1DB584',
          '#FF6B6B',
          '#6B73C1'
        ],
        borderWidth: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            family: 'Inter'
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const quickActions = [
    {
      title: 'Take Assessment',
      description: 'Start a new diagnostic test',
      icon: <Assessment className="text-2xl" />,
      color: 'gradient-primary',
      action: () => navigate('/assessment')
    },
    {
      title: 'Mock Test',
      description: 'Practice with adaptive questions',
      icon: <Quiz className="text-2xl" />,
      color: 'gradient-secondary',
      action: () => navigate('/mock-test')
    },
    {
      title: 'AI Tutor',
      description: 'Get instant help and explanations',
      icon: <EmojiObjects className="text-2xl" />,
      color: 'bg-gradient-to-r from-purple-400 to-pink-400',
      action: () => navigate('/ai-tutor')
    },
    {
      title: 'View Analytics',
      description: 'Detailed performance insights',
      icon: <Analytics className="text-2xl" />,
      color: 'gradient-accent',
      action: () => navigate('/analytics')
    },
    {
      title: 'Get Feedback',
      description: 'Personalized recommendations',
      icon: <School className="text-2xl" />,
      color: 'bg-gradient-to-r from-orange-400 to-pink-400',
      action: () => navigate('/feedback')
    },
    {
      title: 'Syllabus Management',
      description: 'Upload PDFs and generate tests',
      icon: <BookmarkBorder className="text-2xl" />,
      color: 'bg-gradient-to-r from-indigo-400 to-purple-400',
      action: () => navigate('/syllabus-management')
    }
  ];

  if (!user) {
    console.log('🚫 Dashboard - No user, redirecting to auth');
    return null;
  }

  // Show loading if user data is being fetched
  if (loading) {
    console.log('⏳ Dashboard - Loading user data...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30 flex items-center justify-center">
        <div className="text-center">
          <CircularProgress size={60} className="mb-4" />
          <Typography variant="h6" className="text-neutral-600">
            Loading your dashboard...
          </Typography>
        </div>
      </div>
    );
  }

  console.log('✅ Dashboard - Rendering main content');
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30">
      {/* Header */}
      <div className="glass-effect border-b border-white/20 sticky top-0 z-50">
        <Container maxWidth="xl">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <EmojiObjects className="text-white text-xl" />
              </div>
              <div>
                <Typography variant="h6" className="font-bold text-gradient-primary">
                  AdaptiLearn
                </Typography>
                <Typography variant="body2" className="text-neutral-600">
                  Dashboard
                </Typography>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <IconButton className="hover-lift">
                <Notifications className="text-neutral-600" />
              </IconButton>
              
              <IconButton onClick={handleMenuOpen} className="hover-lift">
                <Avatar
                  src={user.photoURL}
                  className="w-10 h-10 gradient-primary"
                >
                  {user.displayName?.[0] || user.email?.[0]}
                </Avatar>
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                className="mt-2"
              >
                <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                  <AccountCircle className="mr-2" />
                  My Profile
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                  <Settings className="mr-2" />
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <Logout className="mr-2" />
                  Logout
                </MenuItem>
              </Menu>
            </div>
          </div>
        </Container>
      </div>

      <Container maxWidth="xl" className="py-8">
        {/* Profile Completion Alert - Only show if user profile is truly incomplete */}
        {(!loading && user && isProfileIncomplete()) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <Alert 
              severity="info" 
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => navigate('/profile-setup')}
                  sx={{ fontWeight: 600 }}
                >
                  Complete Profile
                </Button>
              }
              sx={{ 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                border: '1px solid #2196F3'
              }}
            >
              Complete your profile to get personalized learning recommendations and access all features!
            </Alert>
          </motion.div>
        )}

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <Typography variant="h3" className="font-bold mb-2">
                Welcome back, {user.displayName || 'Student'}! 👋
              </Typography>
              <Typography variant="h6" className="text-neutral-600">
                {getBranchDisplayName()} • {getSemesterDisplayName()}
              </Typography>
            </div>
            
            {userProfile?.branch && (
              <div className="flex items-center space-x-2 mt-4 md:mt-0">
                <Chip
                  icon={<School />}
                  label={userProfile.branch?.code}
                  className="gradient-primary text-white"
                  sx={{ background: 'linear-gradient(135deg, #1DB584 0%, #16A085 100%)', color: 'white' }}
                />
                <Chip
                  icon={<GpsFixed />}
                  label={realTimeData?.totalTests > 0 ? `${realTimeData.averageScore}% Avg` : 'No data'}
                  className="gradient-secondary text-white"
                  sx={{ background: 'linear-gradient(135deg, #6B73C1 0%, #5A67D8 100%)', color: 'white' }}
                />
              </div>
            )}
          </div>
        </motion.div>

        <Grid container spacing={4}>
          {/* Quick Actions */}
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Typography variant="h5" className="font-semibold mb-4">
                Quick Actions
              </Typography>
              
              <Grid container spacing={3}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className="card-elevated hover-lift cursor-pointer h-full"
                        onClick={action.action}
                      >
                        <CardContent className="p-6 text-center">
                          <div className={`w-16 h-16 ${action.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary`}>
                            <div className="text-white">
                              {action.icon}
                            </div>
                          </div>
                          <Typography variant="h6" className="font-semibold mb-2">
                            {action.title}
                          </Typography>
                          <Typography variant="body2" className="text-neutral-600">
                            {action.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </Grid>

          {/* Backend System Status */}
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
            >
              <Card className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Typography variant="h6" className="font-semibold">
                      🚀 Backend Services Status
                    </Typography>
                    {healthCheckLoading && <CircularProgress size={20} />}
                  </div>
                  
                  {backendHealth && (
                    <div className="flex flex-wrap gap-2">
                      {backendHealth.map((service) => (
                        <Chip
                          key={service.service}
                          icon={
                            service.healthy ? 
                            <CheckCircle className="text-green-500" /> : 
                            <Error className="text-red-500" />
                          }
                          label={`${service.service.toUpperCase()} Service`}
                          variant={service.healthy ? "filled" : "outlined"}
                          className={service.healthy ? "bg-green-100 text-green-800" : "border-red-300 text-red-600"}
                        />
                      ))}
                      <Chip
                        icon={<Warning className="text-orange-500" />}
                        label="Hackathon Demo Mode"
                        variant="outlined"
                        className="border-orange-300 text-orange-600"
                      />
                    </div>
                  )}
                  
                  {!healthCheckLoading && backendHealth && (
                    <Typography variant="caption" className="text-neutral-500 mt-2 block">
                      Last checked: {new Date().toLocaleTimeString()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Firestore Shield Monitor */}
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <FirestoreMonitor />
            </motion.div>
          </Grid>

          {/* Performance Overview */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="card-elevated h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Typography variant="h5" className="font-semibold">
                      Subject Performance
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate('/analytics')}
                      endIcon={<TrendingUp />}
                    >
                      View Details
                    </Button>
                  </div>
                  
                  <div className="h-80">
                    {subjectData.length > 0 ? (
                      <Bar data={performanceChartData} options={chartOptions} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-neutral-500">
                        <div className="text-center">
                          <Typography variant="h6">No performance data available</Typography>
                          <Typography variant="body2">Take some tests to see your subject performance</Typography>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Stats Summary */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-4"
            >
              {/* Overall Score */}
              <Card className="card-elevated">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Typography variant="h6" className="font-semibold">
                      Overall Score
                    </Typography>
                    <Star className="text-yellow-500" />
                  </div>
                  
                  <div className="text-center">
                    <Typography variant="h2" className="font-bold text-gradient-primary mb-2">
                      {realTimeData?.totalTests > 0 ? `${realTimeData.averageScore}%` : '--'}
                    </Typography>
                    <Typography variant="body2" className="text-neutral-600 mb-4">
                      {realTimeData?.totalTests > 0 ? `Based on ${realTimeData.totalTests} tests` : 'Take tests to see your score'}
                    </Typography>
                    
                    {realTimeData?.totalTests > 0 ? (
                      <LinearProgress
                        variant="determinate"
                        value={realTimeData.averageScore}
                        className="h-3 rounded-full"
                        sx={{
                          backgroundColor: 'rgba(29, 181, 132, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(135deg, #1DB584 0%, #16A085 100%)',
                            borderRadius: '6px'
                          }
                        }}
                      />
                    ) : (
                      <div className="h-3 bg-neutral-200 rounded-full">
                        <div className="h-full bg-neutral-300 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Strength/Weakness Distribution */}
              <Card className="card-elevated">
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-semibold mb-4">
                    Performance Distribution
                  </Typography>
                  
                  <div className="h-48">
                    <Doughnut 
                      data={strengthWeaknessData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              padding: 15,
                              usePointStyle: true,
                              font: {
                                size: 11,
                                family: 'Inter'
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Progress Trend */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="card-elevated">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Typography variant="h5" className="font-semibold">
                      Progress Trend
                    </Typography>
                    <Chip
                      icon={<TrendingUp />}
                      label="Improving"
                      className="bg-green-100 text-green-800"
                    />
                  </div>
                  
                  <div className="h-64">
                    <Line 
                      data={progressChartData} 
                      options={{
                        ...chartOptions,
                        scales: {
                          ...chartOptions.scales,
                          y: {
                            ...chartOptions.scales.y,
                            min: 50
                          }
                        }
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Recommendations */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="card-elevated h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Typography variant="h6" className="font-semibold">
                      Recommendations
                    </Typography>
                    <EmojiObjects className="text-primary-500" />
                  </div>
                  
                  <div className="space-y-4">
                    {(() => {
                      const weakSubjects = subjectData.filter(s => s.score < 70).slice(0, 2);
                      
                      return weakSubjects.length > 0 ? weakSubjects.map((item, index) => {
                      
                        return (
                          <div key={index} className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
                            <Typography variant="body1" className="font-medium mb-1">
                              {item.subject}
                            </Typography>
                            <Typography variant="body2" className="text-neutral-600 mb-2">
                              Current score: {item.score}% - Needs improvement
                            </Typography>
                            <Typography variant="caption" className="text-neutral-500 mb-3 block">
                              Est. time: 30 minutes
                            </Typography>
                            <Button
                              size="small"
                              variant="contained"
                              className="btn-primary"
                              startIcon={<PlayArrow />}
                              onClick={() => navigate('/mock-test')}
                            >
                              Practice Now
                            </Button>
                          </div>
                        );
                      }) : (
                        <div className="text-center py-8 text-neutral-500">
                          <Typography variant="body2">Take some tests to get personalized recommendations</Typography>
                        </div>
                      );
                    })()}}
                    
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate('/feedback')}
                      className="mt-4"
                    >
                      View All Recommendations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Dashboard;