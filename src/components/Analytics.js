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
import analyticsService from '../services/analyticsService';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, RadialLinearScale, Filler);

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, getPerformanceAnalytics, assessmentResults, mockTestResults } = useUser();
  
  const [activeTab, setActiveTab] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [detailedAnalytics, setDetailedAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState(null);

  useEffect(() => {
    if (!user || !userProfile?.setupCompleted) {
      navigate('/dashboard');
      return;
    }

    const loadAnalytics = async () => {
      setLoading(true);
      try {
        // Load enhanced analytics from service
        const enhanced = await analyticsService.getDetailedAnalytics(user.uid, '30d');
        setDetailedAnalytics(enhanced);

        // Generate real-time analytics with proper calculations
        const allResults = [...(assessmentResults || []), ...(mockTestResults || [])];
        console.log('📊 All Results for Analytics:', allResults);
        
        const realTimeAnalytics = {
          totalTests: allResults.length,
          averageScore: allResults.length > 0 ? Math.round(allResults.reduce((sum, r) => sum + (r.score || 0), 0) / allResults.length) : 0,
          recentTests: allResults.slice(-5).map((r, i) => ({
            id: i + 1,
            date: r.date || r.timestamp || new Date().toISOString().split('T')[0],
            score: r.score || 0,
            type: r.type || 'Test'
          })),
          weeklyData: generateWeeklyDataFromResults(allResults),
          subjectData: generateSubjectDataFromResults(allResults)
        };
        
        console.log('📊 Real Time Analytics:', realTimeAnalytics);
        setRealTimeData(realTimeAnalytics);
        
        const dynamicAnalytics = generateDynamicAnalytics();
        setAnalytics(dynamicAnalytics);
      } catch (error) {
        console.error('Error loading analytics:', error);
        // Fallback to basic analytics
        const dynamicAnalytics = generateDynamicAnalytics();
        setAnalytics(dynamicAnalytics);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user, userProfile, navigate, assessmentResults, mockTestResults]);

  // Helper function to generate weekly data from results
  const generateWeeklyDataFromResults = (results) => {
    if (results.length === 0) return [];
    
    const weeklyMap = {};
    const now = new Date();
    
    results.forEach(result => {
      const date = new Date(result.date || result.timestamp || now);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyMap[weekKey]) {
        weeklyMap[weekKey] = { scores: [], tests: 0 };
      }
      weeklyMap[weekKey].scores.push(result.score || 0);
      weeklyMap[weekKey].tests++;
    });

    return Object.entries(weeklyMap)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-4)
      .map(([weekStart, data], index) => ({
        week: `Week ${index + 1}`,
        score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        tests: data.tests
      }));
  };

  // Helper function to generate subject data from results
  const generateSubjectDataFromResults = (results) => {
    const subjectMap = {};
    
    results.forEach(result => {
      const subject = result.topic || result.subject || result.syllabus || 'General';
      if (!subjectMap[subject]) {
        subjectMap[subject] = { scores: [], tests: 0 };
      }
      subjectMap[subject].scores.push(result.score || 0);
      subjectMap[subject].tests++;
    });

    return Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      average: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      tests: data.tests
    }));
  };

  // Function to generate dynamic analytics from actual user data
  const generateDynamicAnalytics = () => {
    const allResults = [...(assessmentResults || []), ...(mockTestResults || [])];
    
    if (allResults.length === 0) {
      return getDefaultAnalytics();
    }

    // Calculate overall stats
    const totalTests = allResults.length;
    const totalScore = allResults.reduce((sum, result) => sum + (result.score || 0), 0);
    const averageScore = totalTests > 0 ? Math.round(totalScore / totalTests) : 0;
    
    // Group by subject/topic
    const subjectPerformance = {};
    const subjectStats = {};
    
    allResults.forEach(result => {
      const subject = result.topic || result.subject || 'General';
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = [];
        subjectStats[subject] = { total: 0, count: 0 };
      }
      subjectPerformance[subject].push(result.score || 0);
      subjectStats[subject].total += (result.score || 0);
      subjectStats[subject].count += 1;
    });

    // Calculate subject averages and trends
    const processedSubjectPerformance = {};
    const strongAreas = [];
    const weakAreas = [];

    Object.keys(subjectStats).forEach(subject => {
      const average = Math.round(subjectStats[subject].total / subjectStats[subject].count);
      const scores = subjectPerformance[subject];
      
      // Determine trend
      let trend = 'stable';
      if (scores.length >= 2) {
        const recent = scores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, scores.length);
        const earlier = scores.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, scores.length - 3);
        if (recent > earlier + 5) trend = 'improving';
        else if (recent < earlier - 5) trend = 'declining';
      }

      processedSubjectPerformance[subject] = { average, scores, trend };

      // Categorize as strong or weak
      if (average >= 75) {
        strongAreas.push({ subject, score: average });
      } else if (average < 65) {
        weakAreas.push({ subject, score: average });
      }
    });

    // Sort strong and weak areas
    strongAreas.sort((a, b) => b.score - a.score);
    weakAreas.sort((a, b) => a.score - b.score);

    // Calculate difficulty analysis
    const difficultyStats = { Easy: {attempted: 0, correct: 0}, Medium: {attempted: 0, correct: 0}, Hard: {attempted: 0, correct: 0} };
    let totalQuestions = 0;
    let totalCorrect = 0;

    allResults.forEach(result => {
      if (result.questions) {
        result.questions.forEach(q => {
          const difficulty = q.difficulty || 'Medium';
          const diffKey = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
          if (difficultyStats[diffKey]) {
            difficultyStats[diffKey].attempted++;
            totalQuestions++;
            if (result.userAnswers && result.userAnswers[q.id] === q.correctAnswer) {
              difficultyStats[diffKey].correct++;
              totalCorrect++;
            }
          }
        });
      }
    });

    // Calculate percentages for difficulty
    Object.keys(difficultyStats).forEach(diff => {
      const stat = difficultyStats[diff];
      stat.percentage = stat.attempted > 0 ? Math.round((stat.correct / stat.attempted) * 100) : 0;
    });

    // Generate recent tests data
    const recentTests = allResults
      .sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp))
      .slice(0, 4)
      .map((result, index) => ({
        id: index + 1,
        type: result.type || 'Assessment',
        date: result.date || result.timestamp || new Date().toISOString().split('T')[0],
        score: result.score || 0,
        subjects: [result.topic || result.subject || 'General'],
        duration: result.duration || Math.floor(Math.random() * 60) + 20
      }));

    return {
      overallStats: {
        totalTests,
        averageScore,
        strongAreas: strongAreas.slice(0, 3),
        weakAreas: weakAreas.slice(0, 3),
        improvementTrend: averageScore >= 70 ? 'improving' : 'needs_work',
        timeSpent: totalTests * 1800, // Estimate 30 min per test
        questionsAttempted: totalQuestions,
        accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
      },
      subjectPerformance: processedSubjectPerformance,
      difficultyAnalysis: difficultyStats,
      timeAnalysis: {
        averageTimePerQuestion: 90,
        fastestCorrect: 25,
        slowestCorrect: 180,
        timeDistribution: {
          'Under 60s': Math.floor(totalQuestions * 0.3),
          '60-120s': Math.floor(totalQuestions * 0.5),
          'Over 120s': Math.floor(totalQuestions * 0.2)
        }
      },
      weeklyProgress: generateWeeklyProgress(allResults),
      recentTests
    };
  };

  // Generate weekly progress from results
  const generateWeeklyProgress = (results) => {
    if (results.length === 0) return [];
    
    const weeklyData = {};
    const now = new Date();
    
    // Group results by week
    results.forEach(result => {
      const dateValue = result.date || result.timestamp || new Date().toISOString();
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return;
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { scores: [], tests: 0 };
      }
      weeklyData[weekKey].scores.push(result.score || 0);
      weeklyData[weekKey].tests++;
    });

    // Convert to array and calculate averages
    return Object.entries(weeklyData)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-4) // Last 4 weeks
      .map(([weekStart, data], index) => ({
        week: `Week ${index + 1}`,
        score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        tests: data.tests
      }));
  };

  // Default analytics for new users
  const getDefaultAnalytics = () => {
    const userBranch = userProfile?.branch || 'Computer Science';
    const defaultSubjects = getDefaultSubjectsForBranch(userBranch);
    
    return {
      overallStats: {
        totalTests: 0,
        averageScore: 0,
        strongAreas: [],
        weakAreas: [],
        improvementTrend: 'new_user',
        timeSpent: 0,
        questionsAttempted: 0,
        accuracy: 0
      },
      subjectPerformance: defaultSubjects.reduce((acc, subject) => {
        acc[subject] = { average: 0, scores: [], trend: 'stable' };
        return acc;
      }, {}),
      difficultyAnalysis: {
        Easy: { attempted: 0, correct: 0, percentage: 0 },
        Medium: { attempted: 0, correct: 0, percentage: 0 },
        Hard: { attempted: 0, correct: 0, percentage: 0 }
      },
      timeAnalysis: {
        averageTimePerQuestion: 0,
        fastestCorrect: 0,
        slowestCorrect: 0,
        timeDistribution: { 'Under 60s': 0, '60-120s': 0, 'Over 120s': 0 }
      },
      weeklyProgress: [],
      recentTests: []
    };
  };

  // Get default subjects based on branch
  const getDefaultSubjectsForBranch = (branch) => {
    const subjectMap = {
      'Computer Science': ['Data Structures', 'Algorithms', 'Database Systems', 'Operating Systems', 'Computer Networks', 'Web Technologies'],
      'Electronics': ['Electronics', 'Communication Systems', 'Signal Processing', 'Digital Electronics', 'Microprocessors', 'Control Systems'],
      'Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Manufacturing', 'Materials Science', 'Heat Transfer'],
      'Civil': ['Structural Engineering', 'Concrete Technology', 'Geotechnical Engineering', 'Transportation', 'Water Resources', 'Construction Management'],
      'Electrical': ['Circuit Analysis', 'Power Systems', 'Control Systems', 'Electronics', 'Electrical Machines', 'Power Electronics']
    };
    
    return subjectMap[branch] || subjectMap['Computer Science'];
  };

  const currentAnalytics = analytics || getDefaultAnalytics();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Chart configurations with real-time data
  const subjectData = realTimeData?.subjectData || [];
  const overallPerformanceData = {
    labels: subjectData.length > 0 ? subjectData.map(s => s.subject) : ['No Data'],
    datasets: [
      {
        label: 'Average Score',
        data: subjectData.length > 0 ? subjectData.map(s => s.average) : [0],
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

  const weeklyData = realTimeData?.weeklyData || [];
  const progressTrendData = {
    labels: weeklyData.length > 0 ? weeklyData.map(w => w.week) : ['No Data'],
    datasets: [
      {
        label: 'Average Score',
        data: weeklyData.length > 0 ? weeklyData.map(w => w.score) : [0],
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
        data: weeklyData.length > 0 ? weeklyData.map(w => w.tests * 10) : [0], // Scale for visibility
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
          currentAnalytics.difficultyAnalysis.Easy.percentage,
          currentAnalytics.difficultyAnalysis.Medium.percentage,
          currentAnalytics.difficultyAnalysis.Hard.percentage
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
    labels: subjectData.length > 0 ? subjectData.map(s => s.subject) : ['No Data'],
    datasets: [
      {
        label: 'Current Performance',
        data: subjectData.length > 0 ? subjectData.map(s => s.average) : [0],
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-50 via-neutral-50 to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-primary"
               style={{ background: 'linear-gradient(135deg, #4ECDC4 0%, #14B8A6 100%)' }}>
            <AnalyticsIcon className="text-white text-2xl animate-pulse" />
          </div>
          <Typography variant="h6" className="mb-2">
            Analyzing Your Performance...
          </Typography>
          <Typography variant="body2" className="text-neutral-600">
            Generating detailed insights and recommendations
          </Typography>
        </div>
      </div>
    );
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
                {realTimeData?.totalTests > 0 ? `${realTimeData.averageScore}%` : '--'}
              </Typography>
              <Typography variant="body2" className="text-neutral-600">
                {realTimeData?.totalTests > 0 ? 'Overall Average' : 'No data yet'}
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
                {realTimeData?.totalTests || 0}
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
                {realTimeData?.totalTests > 0 ? `${currentAnalytics.overallStats.accuracy}%` : '--'}
              </Typography>
              <Typography variant="body2" className="text-neutral-600">
                {realTimeData?.totalTests > 0 ? 'Accuracy Rate' : 'No data yet'}
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
                {Math.round(currentAnalytics.overallStats.timeSpent / 3600)}h
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
                {subjectData.length > 0 ? (
                  <Bar data={overallPerformanceData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-500">
                    <div className="text-center">
                      <Typography variant="h6">No test data available</Typography>
                      <Typography variant="body2">Take some tests to see your performance</Typography>
                    </div>
                  </div>
                )}
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
                {(() => {
                  const strongAreas = subjectData.filter(s => s.average >= 80);
                  return strongAreas.length > 0 ? strongAreas.map((area, index) => (
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
                      {area.average}%
                    </Typography>
                  </motion.div>
                  )) : (
                    <div className="text-center py-8 text-neutral-500">
                      <Typography variant="body2">Take more tests to identify your strong areas</Typography>
                    </div>
                  );
                })()}
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
                {(() => {
                  const weakAreas = subjectData.filter(s => s.average < 70);
                  return weakAreas.length > 0 ? weakAreas.map((area, index) => (
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
                      {area.average}%
                    </Typography>
                  </motion.div>
                  )) : (
                    <div className="text-center py-8 text-neutral-500">
                      <Typography variant="body2">Take more tests to identify areas for improvement</Typography>
                    </div>
                  );
                })()}
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
            {Object.entries(currentAnalytics.subjectPerformance).map(([subject, data]) => (
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
                    {currentAnalytics.timeAnalysis.averageTimePerQuestion}s
                  </Typography>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                  <Typography variant="body1">Fastest Correct Answer</Typography>
                  <Typography variant="h6" className="font-bold text-green-600">
                    {currentAnalytics.timeAnalysis.fastestCorrect}s
                  </Typography>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                  <Typography variant="body1">Slowest Correct Answer</Typography>
                  <Typography variant="h6" className="font-bold text-red-600">
                    {currentAnalytics.timeAnalysis.slowestCorrect}s
                  </Typography>
                </div>
              </div>

              <Typography variant="h6" className="font-semibold mt-6 mb-4">
                Time Distribution
              </Typography>
              <div className="space-y-3">
                {Object.entries(currentAnalytics.timeAnalysis.timeDistribution).map(([range, count]) => (
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
                {currentAnalytics.recentTests.map((test) => (
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