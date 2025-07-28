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
  Divider
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
  Notifications
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { userProfile, getPerformanceAnalytics } = useUser();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!userProfile?.setupCompleted) {
      navigate('/profile-setup');
      return;
    }

    // Load analytics data
    const analyticsData = getPerformanceAnalytics();
    setAnalytics(analyticsData);
  }, [user, userProfile, navigate, getPerformanceAnalytics]);

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

  // Mock data for demonstration
  const mockAnalytics = {
    overallStats: {
      totalTests: 5,
      averageScore: 78,
      strongAreas: [
        { subject: 'Data Structures', score: 85 },
        { subject: 'Algorithms', score: 82 }
      ],
      weakAreas: [
        { subject: 'Database Systems', score: 65 },
        { subject: 'Operating Systems', score: 58 }
      ],
      improvementTrend: 'improving'
    },
    subjectPerformance: {
      'Data Structures': { average: 85, scores: [80, 85, 88, 90, 85] },
      'Algorithms': { average: 82, scores: [75, 80, 85, 88, 82] },
      'Database Systems': { average: 65, scores: [60, 65, 70, 68, 65] },
      'Operating Systems': { average: 58, scores: [55, 60, 58, 62, 58] }
    }
  };

  const currentAnalytics = analytics || mockAnalytics;

  // Chart configurations
  const performanceChartData = {
    labels: Object.keys(currentAnalytics.subjectPerformance),
    datasets: [
      {
        label: 'Average Score',
        data: Object.values(currentAnalytics.subjectPerformance).map(perf => perf.average),
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
          currentAnalytics.overallStats.strongAreas.length,
          currentAnalytics.overallStats.weakAreas.length,
          Object.keys(currentAnalytics.subjectPerformance).length - 
          currentAnalytics.overallStats.strongAreas.length - 
          currentAnalytics.overallStats.weakAreas.length
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
      title: 'View Analytics',
      description: 'Detailed performance insights',
      icon: <Analytics className="text-2xl" />,
      color: 'gradient-accent',
      action: () => navigate('/analytics')
    },
    {
      title: 'Get Feedback',
      description: 'Personalized recommendations',
      icon: <EmojiObjects className="text-2xl" />,
      color: 'bg-gradient-to-r from-orange-400 to-pink-400',
      action: () => navigate('/feedback')
    }
  ];

  if (!user || !userProfile) {
    return null;
  }

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
                <MenuItem onClick={handleMenuClose}>
                  <AccountCircle className="mr-2" />
                  Profile
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
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
                {userProfile.branch?.name} • {userProfile.semester?.name}
              </Typography>
            </div>
            
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Chip
                icon={<School />}
                label={userProfile.branch?.code}
                className="gradient-primary text-white"
                sx={{ background: 'linear-gradient(135deg, #1DB584 0%, #16A085 100%)', color: 'white' }}
              />
              <Chip
                icon={<GpsFixed />}
                label={`${currentAnalytics.overallStats.averageScore}% Avg`}
                className="gradient-secondary text-white"
                sx={{ background: 'linear-gradient(135deg, #6B73C1 0%, #5A67D8 100%)', color: 'white' }}
              />
            </div>
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
                  <Grid item xs={12} sm={6} md={3} key={index}>
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
                    <Bar data={performanceChartData} options={chartOptions} />
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
                      {currentAnalytics.overallStats.averageScore}%
                    </Typography>
                    <Typography variant="body2" className="text-neutral-600 mb-4">
                      Based on {currentAnalytics.overallStats.totalTests} tests
                    </Typography>
                    
                    <LinearProgress
                      variant="determinate"
                      value={currentAnalytics.overallStats.averageScore}
                      className="h-3 rounded-full"
                      sx={{
                        backgroundColor: 'rgba(29, 181, 132, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(135deg, #1DB584 0%, #16A085 100%)',
                          borderRadius: '6px'
                        }
                      }}
                    />
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
                    {currentAnalytics.overallStats.weakAreas.slice(0, 2).map((area, index) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
                        <Typography variant="body1" className="font-medium mb-1">
                          Focus on {area.subject}
                        </Typography>
                        <Typography variant="body2" className="text-neutral-600 mb-3">
                          Current score: {area.score}% - Needs improvement
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
                    ))}
                    
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