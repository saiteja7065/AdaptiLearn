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
  IconButton,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  TrendingDown,
  Analytics as AnalyticsIcon,
  Assessment,
  Quiz,
  Psychology,
  Speed,
  GpsFixed,
  School,
  Timer,
  CheckCircle,
  Cancel,
  BookmarkBorder
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, RadialLinearScale, Filler } from 'chart.js';
import { Doughnut, Bar, Line, Radar } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, RadialLinearScale, Filler);

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, getPerformanceAnalytics, assessmentResults, mockTestResults } = useUser();
  
  const [activeTab, setActiveTab] = useState(0);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (!user || !userProfile?.setupCompleted) {
      navigate('/dashboard');
      return;
    }

    // Load analytics data
    const analyticsData = getPerformanceAnalytics();
    setAnalytics(analyticsData);
  }, [user, userProfile, navigate, getPerformanceAnalytics]);

  // Mock comprehensive analytics data
  const mockAnalytics = {
    overallStats: {
      totalTests: 8,
      averageScore: 76,
      strongAreas: [
        { subject: 'Data Structures', score: 85 },
        { subject: 'Algorithms', score: 82 },
        { subject: 'Web Technologies', score: 88 }
      ],
      weakAreas: [
        { subject: 'Database Systems', score: 65 },
        { subject: 'Operating Systems', score: 58 },
        { subject: 'Computer Networks', score: 62 }
      ],
      improvementTrend: 'improving',
      timeSpent: 14400, // in seconds
      questionsAttempted: 160,
      accuracy: 76
    },
    subjectPerformance: {
      'Data Structures': { average: 85, scores: [75, 80, 85, 88, 90, 85, 87, 89], trend: 'improving' },
      'Algorithms': { average: 82, scores: [70, 75, 80, 85, 88, 82, 84, 86], trend: 'improving' },
      'Database Systems': { average: 65, scores: [60, 65, 70, 68, 65, 63, 67, 69], trend: 'stable' },
      'Operating Systems': { average: 58, scores: [55, 60, 58, 62, 58, 56, 59, 61], trend: 'stable' },
      'Computer Networks': { average: 62, scores: [58, 60, 65, 63, 62, 64, 66, 68], trend: 'improving' },
      'Web Technologies': { average: 88, scores: [80, 85, 88, 90, 92, 88, 89, 91], trend: 'stable' }
    },
    difficultyAnalysis: {
      Easy: { attempted: 48, correct: 42, percentage: 87.5 },
      Medium: { attempted: 80, correct: 58, percentage: 72.5 },
      Hard: { attempted: 32, correct: 18, percentage: 56.25 }
    },
    timeAnalysis: {
      averageTimePerQuestion: 90, // seconds
      fastestCorrect: 25,
      slowestCorrect: 180,
      timeDistribution: {
        'Under 60s': 45,
        '60-120s': 85,
        'Over 120s': 30
      }
    },
    weeklyProgress: [
      { week: 'Week 1', score: 65, tests: 2 },
      { week: 'Week 2', score: 70, tests: 1 },
      { week: 'Week 3', score: 75, tests: 2 },
      { week: 'Week 4', score: 78, tests: 3 }
    ],
    recentTests: [
      { id: 1, type: 'Assessment', date: '2024-01-15', score: 82, subjects: ['DS', 'Algo'], duration: 45 },
      { id: 2, type: 'Mock Test', date: '2024-01-14', score: 75, subjects: ['DBMS', 'OS'], duration: 60 },
      { id: 3, type: 'Mock Test', date: '2024-01-12', score: 78, subjects: ['CN', 'Web'], duration: 30 },
      { id: 4, type: 'Assessment', date: '2024-01-10', score: 71, subjects: ['DS', 'DBMS'], duration: 40 }
    ]
  };

  const currentAnalytics = analytics || mockAnalytics;

  // Ensure arrays exist to prevent map errors
  const safeAnalytics = {
    ...currentAnalytics,
    overallStats: {
      ...currentAnalytics.overallStats,
      strongAreas: currentAnalytics.overallStats?.strongAreas || [],
      weakAreas: currentAnalytics.overallStats?.weakAreas || []
    },
    weeklyProgress: currentAnalytics.weeklyProgress || [],
    recentTests: currentAnalytics.recentTests || []
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Chart configurations
  const overallPerformanceData = {
    labels: Object.keys(safeAnalytics.subjectPerformance || {}),
    datasets: [
      {
        label: 'Average Score',
        data: Object.values(safeAnalytics.subjectPerformance || {}).map(perf => perf.average),
        backgroundColor: [
          'rgba(29, 181, 132, 0.8)',
          'rgba(107, 115, 193, 0.8)',
          'rgba(78, 205, 196, 0.8)',
          'rgba(255, 107, 107, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(156, 39, 176, 0.8)'
        ],
        borderColor: [
          '#1DB584',
          '#6B73C1',
          '#4ECDC4',
          '#FF6B6B',
          '#FFC107',
          '#9C27B0'
        ],
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const progressTrendData = {
    labels: safeAnalytics.weeklyProgress.map(w => w.week),
    datasets: [
      {
        label: 'Average Score',
        data: safeAnalytics.weeklyProgress.map(w => w.score),
        borderColor: '#1DB584',
        backgroundColor: 'rgba(29, 181, 132, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#1DB584',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 6,
      },
      {
        label: 'Tests Taken',
        data: safeAnalytics.weeklyProgress.map(w => w.tests * 10), // Scale for visibility
        borderColor: '#6B73C1',
        backgroundColor: 'rgba(107, 115, 193, 0.1)',
        tension: 0.4,
        fill: false,
        pointBackgroundColor: '#6B73C1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 6,
        yAxisID: 'y1',
      }
    ]
  };

  const difficultyDistributionData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [
      {
        data: [
          safeAnalytics.difficultyAnalysis?.Easy?.percentage || 0,
          safeAnalytics.difficultyAnalysis?.Medium?.percentage || 0,
          safeAnalytics.difficultyAnalysis?.Hard?.percentage || 0
        ],
        backgroundColor: [
          '#4CAF50',
          '#FF9800',
          '#F44336'
        ],
        borderWidth: 0,
      }
    ]
  };

  const subjectRadarData = {
    labels: Object.keys(safeAnalytics.subjectPerformance || {}),
    datasets: [
      {
        label: 'Current Performance',
        data: Object.values(safeAnalytics.subjectPerformance || {}).map(perf => perf.average),
        backgroundColor: 'rgba(29, 181, 132, 0.2)',
        borderColor: '#1DB584',
        borderWidth: 2,
        pointBackgroundColor: '#1DB584',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#1DB584'
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

  const progressChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        max: 50,
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          font: {
            size: 11,
            family: 'Inter'
          }
        }
      }
    }
  };

  if (!user || !userProfile) {
    return null;
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="card-elevated text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                <AnalyticsIcon className="text-white" />
              </div>
              <Typography variant="h3" className="font-bold text-gradient-primary">
                {safeAnalytics.overallStats?.averageScore || 0}%
              </Typography>
              <Typography variant="body2" className="text-neutral-600">
                Overall Average
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="card-elevated text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 gradient-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                <Assessment className="text-white" />
              </div>
              <Typography variant="h3" className="font-bold text-gradient-secondary">
                {safeAnalytics.overallStats?.totalTests || 0}
              </Typography>
              <Typography variant="body2" className="text-neutral-600">
                Tests Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="card-elevated text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 gradient-accent rounded-xl flex items-center justify-center mx-auto mb-3">
                <GpsFixed className="text-white" />
              </div>
              <Typography variant="h3" className="font-bold text-gradient-accent">
                {safeAnalytics.overallStats?.accuracy || 74}%
              </Typography>
              <Typography variant="body2" className="text-neutral-600">
                Accuracy Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="card-elevated text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-pink-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Timer className="text-white" />
              </div>
              <Typography variant="h3" className="font-bold" style={{ color: '#FF6B6B' }}>
                {Math.round((safeAnalytics.overallStats?.timeSpent || 3) / 3600)}h
              </Typography>
              <Typography variant="body2" className="text-neutral-600">
                Study Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Charts */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card className="card-elevated">
            <CardContent className="p-6">
              <Typography variant="h5" className="font-semibold mb-6">
                Subject Performance Overview
              </Typography>
              <div className="h-80">
                <Bar data={overallPerformanceData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className="card-elevated">
            <CardContent className="p-6">
              <Typography variant="h5" className="font-semibold mb-6">
                Difficulty Analysis
              </Typography>
              <div className="h-80">
                <Doughnut data={difficultyDistributionData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                          size: 12,
                          family: 'Inter'
                        }
                      }
                    }
                  }
                }} />
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Strengths and Weaknesses */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="text-green-500 mr-2" />
                <Typography variant="h5" className="font-semibold">
                  Strong Areas
                </Typography>
              </div>
              <div className="space-y-3">
                {safeAnalytics.overallStats.strongAreas.map((area, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-green-50 rounded-xl"
                  >
                    <div>
                      <Typography variant="body1" className="font-medium">
                        {area.subject}
                      </Typography>
                      <Typography variant="body2" className="text-green-600">
                        Keep up the excellent work!
                      </Typography>
                    </div>
                    <Typography variant="h6" className="font-bold text-green-600">
                      {area.score}%
                    </Typography>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <TrendingDown className="text-red-500 mr-2" />
                <Typography variant="h5" className="font-semibold">
                  Areas for Improvement
                </Typography>
              </div>
              <div className="space-y-3">
                {safeAnalytics.overallStats.weakAreas.map((area, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-red-50 rounded-xl"
                  >
                    <div>
                      <Typography variant="body1" className="font-medium">
                        {area.subject}
                      </Typography>
                      <Typography variant="body2" className="text-red-600">
                        Focus on fundamental concepts
                      </Typography>
                    </div>
                    <Typography variant="h6" className="font-bold text-red-600">
                      {area.score}%
                    </Typography>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );

  const renderProgressTab = () => (
    <div className="space-y-6">
      {/* Progress Trend */}
      <Card className="card-elevated">
        <CardContent className="p-6">
          <Typography variant="h5" className="font-semibold mb-6">
            Learning Progress Trend
          </Typography>
          <div className="h-80">
            <Line data={progressTrendData} options={progressChartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Subject-wise Progress */}
      <Card className="card-elevated">
        <CardContent className="p-6">
          <Typography variant="h5" className="font-semibold mb-6">
            Subject-wise Progress
          </Typography>
          <div className="space-y-4">
            {Object.entries(safeAnalytics.subjectPerformance || {}).map(([subject, data]) => (
              <div key={subject} className="p-4 bg-neutral-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <Typography variant="body1" className="font-medium">
                    {subject}
                  </Typography>
                  <div className="flex items-center space-x-2">
                    <Chip
                      icon={data.trend === 'improving' ? <TrendingUp /> : <TrendingDown />}
                      label={data.trend}
                      size="small"
                      className={
                        data.trend === 'improving' ? 'bg-green-100 text-green-800' :
                        data.trend === 'declining' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }
                    />
                    <Typography variant="h6" className="font-bold">
                      {data.average}%
                    </Typography>
                  </div>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={data.average}
                  className="h-2 rounded-full"
                  sx={{
                    backgroundColor: 'rgba(29, 181, 132, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: data.trend === 'improving' ? 
                        'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)' :
                        data.trend === 'declining' ?
                        'linear-gradient(135deg, #F44336 0%, #FF5722 100%)' :
                        'linear-gradient(135deg, #FF9800 0%, #FFC107 100%)',
                      borderRadius: '4px'
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDetailedTab = () => (
    <div className="space-y-6">
      {/* Subject Radar Chart */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card className="card-elevated">
            <CardContent className="p-6">
              <Typography variant="h5" className="font-semibold mb-6">
                Performance Radar
              </Typography>
              <div className="h-80">
                <Radar data={subjectRadarData} options={radarOptions} />
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="card-elevated">
            <CardContent className="p-6">
              <Typography variant="h5" className="font-semibold mb-6">
                Time Analysis
              </Typography>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                  <Typography variant="body1">Average Time per Question</Typography>
                  <Typography variant="h6" className="font-bold">
                    {safeAnalytics.timeAnalysis?.averageTimePerQuestion || 10}s
                  </Typography>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                  <Typography variant="body1">Fastest Correct Answer</Typography>
                  <Typography variant="h6" className="font-bold text-green-600">
                    {safeAnalytics.timeAnalysis?.fastestCorrect || 3}s
                  </Typography>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                  <Typography variant="body1">Slowest Correct Answer</Typography>
                  <Typography variant="h6" className="font-bold text-red-600">
                    {safeAnalytics.timeAnalysis?.slowestCorrect || 12}s
                  </Typography>
                </div>
              </div>

              <Typography variant="h6" className="font-semibold mt-6 mb-4">
                Time Distribution
              </Typography>
              <div className="space-y-3">
                {Object.entries(safeAnalytics.timeAnalysis?.timeDistribution || {}).map(([range, count]) => (
                  <div key={range} className="flex items-center justify-between">
                    <Typography variant="body2">{range}</Typography>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-neutral-200 rounded-full h-2">
                        <div 
                          className="bg-primary-500 h-2 rounded-full"
                          style={{ width: `${(count / 160) * 100}%` }}
                        ></div>
                      </div>
                      <Typography variant="body2" className="font-medium">
                        {count}
                      </Typography>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Tests Table */}
      <Card className="card-elevated">
        <CardContent className="p-6">
          <Typography variant="h5" className="font-semibold mb-6">
            Recent Test History
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Subjects</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {safeAnalytics.recentTests.map((test) => (
                  <TableRow key={test.id} className="hover:bg-neutral-50">
                    <TableCell>
                      {new Date(test.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={test.type === 'Assessment' ? <Assessment /> : <Quiz />}
                        label={test.type}
                        size="small"
                        className={
                          test.type === 'Assessment' ? 
                          'bg-primary-100 text-primary-800' : 
                          'bg-secondary-100 text-secondary-800'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {test.subjects.map((subject, index) => (
                          <Chip
                            key={index}
                            label={subject}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{test.duration} min</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        className={`font-semibold ${
                          test.score >= 80 ? 'text-green-600' :
                          test.score >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}
                      >
                        {test.score}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {test.score >= 80 ? (
                        <CheckCircle className="text-green-500" />
                      ) : test.score >= 60 ? (
                        <BookmarkBorder className="text-yellow-500" />
                      ) : (
                        <Cancel className="text-red-500" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-neutral-50 to-primary-50">
      {/* Header */}
      <div className="glass-effect border-b border-white/20 sticky top-0 z-50">
        <Container maxWidth="xl">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <IconButton
                onClick={() => navigate('/dashboard')}
                className="hover-lift"
              >
                <ArrowBack />
              </IconButton>
              <div>
                <Typography variant="h5" className="font-bold text-gradient-accent">
                  Performance Analytics
                </Typography>
                <Typography variant="body2" className="text-neutral-600">
                  Detailed insights into your learning progress
                </Typography>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Chip
                icon={<Psychology />}
                label="AI Powered"
                className="gradient-accent text-white"
                sx={{ background: 'linear-gradient(135deg, #4ECDC4 0%, #14B8A6 100%)', color: 'white' }}
              />
            </div>
          </div>
        </Container>
      </div>

      <Container maxWidth="xl" className="py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Tabs */}
          <Card className="card-elevated mb-6">
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              className="px-6"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  minWidth: 120,
                },
                '& .MuiTabs-indicator': {
                  background: 'linear-gradient(135deg, #4ECDC4 0%, #14B8A6 100%)',
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                }
              }}
            >
              <Tab label="Overview" />
              <Tab label="Progress" />
              <Tab label="Detailed Analysis" />
            </Tabs>
          </Card>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 0 && renderOverviewTab()}
            {activeTab === 1 && renderProgressTab()}
            {activeTab === 2 && renderDetailedTab()}
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
};

export default Analytics;