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
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  EmojiObjects,
  TrendingUp,
  TrendingDown,
  Psychology,
  MenuBook,
  PlayArrow,
  CheckCircle,
  Schedule,
  Star,
  GpsFixed,
  School,
  Quiz,
  Assessment,
  ExpandMore,
  Lightbulb,
  BookmarkBorder,
  Timer,
  Speed
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const Feedback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, getPerformanceAnalytics } = useUser();
  
  const [analytics, setAnalytics] = useState(null);
  const [expandedPanel, setExpandedPanel] = useState('recommendations');

  useEffect(() => {
    if (!user || !userProfile?.setupCompleted) {
      navigate('/dashboard');
      return;
    }

    // Load analytics data
    const analyticsData = getPerformanceAnalytics();
    setAnalytics(analyticsData);
  }, [user, userProfile, navigate, getPerformanceAnalytics]);

  // Mock comprehensive feedback data
  const mockFeedback = {
    overallAssessment: {
      score: 76,
      level: 'Intermediate',
      strengths: ['Data Structures', 'Web Technologies', 'Algorithms'],
      weaknesses: ['Database Systems', 'Operating Systems', 'Computer Networks'],
      trend: 'improving'
    },
    personalizedRecommendations: [
      {
        id: 1,
        priority: 'High',
        subject: 'Database Systems',
        currentScore: 65,
        targetScore: 80,
        timeEstimate: '2-3 weeks',
        topics: [
          'Normalization (1NF, 2NF, 3NF, BCNF)',
          'SQL Joins and Subqueries',
          'Indexing and Query Optimization',
          'Transaction Management and ACID Properties'
        ],
        resources: [
          { type: 'Video', title: 'Database Normalization Explained', duration: '45 min' },
          { type: 'Practice', title: 'SQL Query Practice Set', questions: 25 },
          { type: 'Reading', title: 'Database Systems Concepts - Chapter 7', pages: 30 }
        ],
        studyPlan: [
          { week: 1, focus: 'Normalization concepts and practice', hours: 8 },
          { week: 2, focus: 'Advanced SQL and joins', hours: 10 },
          { week: 3, focus: 'Indexing and optimization', hours: 6 }
        ]
      },
      {
        id: 2,
        priority: 'High',
        subject: 'Operating Systems',
        currentScore: 58,
        targetScore: 75,
        timeEstimate: '3-4 weeks',
        topics: [
          'Process Scheduling Algorithms',
          'Memory Management and Virtual Memory',
          'Deadlock Detection and Prevention',
          'File System Implementation'
        ],
        resources: [
          { type: 'Video', title: 'OS Process Scheduling', duration: '60 min' },
          { type: 'Practice', title: 'OS Concepts Mock Tests', questions: 30 },
          { type: 'Reading', title: 'Operating System Concepts - Silberschatz', pages: 45 }
        ],
        studyPlan: [
          { week: 1, focus: 'Process management and scheduling', hours: 10 },
          { week: 2, focus: 'Memory management concepts', hours: 8 },
          { week: 3, focus: 'Deadlocks and synchronization', hours: 8 },
          { week: 4, focus: 'File systems and I/O', hours: 6 }
        ]
      },
      {
        id: 3,
        priority: 'Medium',
        subject: 'Computer Networks',
        currentScore: 62,
        targetScore: 78,
        timeEstimate: '2-3 weeks',
        topics: [
          'OSI and TCP/IP Model Layers',
          'Routing Algorithms and Protocols',
          'Network Security Fundamentals',
          'Error Detection and Correction'
        ],
        resources: [
          { type: 'Video', title: 'Network Protocols Deep Dive', duration: '90 min' },
          { type: 'Practice', title: 'Networking Fundamentals Quiz', questions: 20 },
          { type: 'Reading', title: 'Computer Networks - Tanenbaum', pages: 35 }
        ],
        studyPlan: [
          { week: 1, focus: 'Network models and protocols', hours: 8 },
          { week: 2, focus: 'Routing and switching concepts', hours: 8 },
          { week: 3, focus: 'Network security basics', hours: 6 }
        ]
      }
    ],
    motivationalInsights: [
      {
        type: 'achievement',
        message: 'Excellent progress in Data Structures! You\'ve improved by 15% in the last month.',
        icon: <TrendingUp className="text-green-500" />
      },
      {
        type: 'milestone',
        message: 'You\'re just 4 points away from reaching 80% in Algorithms. Keep pushing!',
        icon: <GpsFixed className="text-blue-500" />
      },
      {
        type: 'consistency',
        message: 'Great consistency! You\'ve taken tests regularly for 3 weeks straight.',
        icon: <Schedule className="text-purple-500" />
      }
    ],
    studySchedule: {
      dailyRecommendation: '2-3 hours',
      weeklyGoal: '15-20 hours',
      optimalTimes: ['Morning (9-11 AM)', 'Evening (7-9 PM)'],
      breakPattern: '25 min study, 5 min break (Pomodoro Technique)'
    },
    nextSteps: [
      {
        action: 'Take Database Systems focused mock test',
        priority: 'Immediate',
        estimatedTime: '45 min'
      },
      {
        action: 'Review Operating Systems process scheduling',
        priority: 'This Week',
        estimatedTime: '2 hours'
      },
      {
        action: 'Complete Computer Networks practice questions',
        priority: 'Next Week',
        estimatedTime: '1.5 hours'
      }
    ]
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'Video': return <PlayArrow className="text-red-500" />;
      case 'Practice': return <Quiz className="text-blue-500" />;
      case 'Reading': return <MenuBook className="text-green-500" />;
      default: return <BookmarkBorder />;
    }
  };

  if (!user || !userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-neutral-50 to-pink-50">
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
                <Typography variant="h5" className="font-bold" style={{ color: '#FF6B6B' }}>
                  Personalized Feedback
                </Typography>
                <Typography variant="body2" className="text-neutral-600">
                  AI-powered recommendations for your learning journey
                </Typography>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Chip
                icon={<Psychology />}
                label="AI Insights"
                className="text-white"
                sx={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #E53E3E 100%)', color: 'white' }}
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
          {/* Overall Assessment */}
          <Card className="card-elevated mb-8">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-primary"
                     style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #E53E3E 100%)' }}>
                  <EmojiObjects className="text-white text-3xl" />
                </div>
                <Typography variant="h3" className="font-bold mb-2" style={{ color: '#FF6B6B' }}>
                  Your Learning Assessment
                </Typography>
                <Typography variant="h6" className="text-neutral-600">
                  Based on your performance across {mockFeedback.personalizedRecommendations.length} key areas
                </Typography>
              </div>

              <Grid container spacing={4}>
                <Grid item xs={12} md={3}>
                  <div className="text-center">
                    <Typography variant="h2" className="font-bold mb-2" style={{ color: '#FF6B6B' }}>
                      {mockFeedback.overallAssessment.score}%
                    </Typography>
                    <Typography variant="body1" className="text-neutral-600">
                      Overall Score
                    </Typography>
                  </div>
                </Grid>

                <Grid item xs={12} md={3}>
                  <div className="text-center">
                    <Typography variant="h4" className="font-bold mb-2 text-gradient-primary">
                      {mockFeedback.overallAssessment.level}
                    </Typography>
                    <Typography variant="body1" className="text-neutral-600">
                      Current Level
                    </Typography>
                  </div>
                </Grid>

                <Grid item xs={12} md={3}>
                  <div className="text-center">
                    <Typography variant="h4" className="font-bold mb-2 text-gradient-secondary">
                      {mockFeedback.overallAssessment.strengths.length}
                    </Typography>
                    <Typography variant="body1" className="text-neutral-600">
                      Strong Areas
                    </Typography>
                  </div>
                </Grid>

                <Grid item xs={12} md={3}>
                  <div className="text-center">
                    <Typography variant="h4" className="font-bold mb-2 text-gradient-accent">
                      {mockFeedback.overallAssessment.weaknesses.length}
                    </Typography>
                    <Typography variant="body1" className="text-neutral-600">
                      Focus Areas
                    </Typography>
                  </div>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Motivational Insights */}
          <Card className="card-elevated mb-8">
            <CardContent className="p-6">
              <Typography variant="h5" className="font-semibold mb-6 flex items-center">
                <Star className="mr-2 text-yellow-500" />
                Motivational Insights
              </Typography>
              
              <Grid container spacing={3}>
                {mockFeedback.motivationalInsights.map((insight, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card className="h-full bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="mt-1">
                              {insight.icon}
                            </div>
                            <Typography variant="body1" className="leading-relaxed">
                              {insight.message}
                            </Typography>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Detailed Recommendations */}
          <Card className="card-elevated mb-8">
            <CardContent className="p-6">
              <Typography variant="h5" className="font-semibold mb-6 flex items-center">
                <Lightbulb className="mr-2" style={{ color: '#FF6B6B' }} />
                Personalized Study Recommendations
              </Typography>

              <div className="space-y-4">
                {mockFeedback.personalizedRecommendations.map((recommendation, index) => (
                  <motion.div
                    key={recommendation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Accordion
                      expanded={expandedPanel === `recommendation-${recommendation.id}`}
                      onChange={handleAccordionChange(`recommendation-${recommendation.id}`)}
                      className="card-elevated"
                    >
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <div className="flex items-center justify-between w-full mr-4">
                          <div className="flex items-center space-x-4">
                            <Chip
                              label={recommendation.priority}
                              size="small"
                              className={getPriorityColor(recommendation.priority)}
                            />
                            <Typography variant="h6" className="font-semibold">
                              {recommendation.subject}
                            </Typography>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <Typography variant="body2" className="text-neutral-600">
                                Current: {recommendation.currentScore}% → Target: {recommendation.targetScore}%
                              </Typography>
                              <Typography variant="body2" className="text-neutral-600">
                                Est. Time: {recommendation.timeEstimate}
                              </Typography>
                            </div>
                            <div className="w-24">
                              <LinearProgress
                                variant="determinate"
                                value={(recommendation.currentScore / recommendation.targetScore) * 100}
                                className="h-2 rounded-full"
                                sx={{
                                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    background: 'linear-gradient(135deg, #FF6B6B 0%, #E53E3E 100%)',
                                    borderRadius: '4px'
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </AccordionSummary>
                      
                      <AccordionDetails>
                        <Grid container spacing={4}>
                          {/* Topics to Focus */}
                          <Grid item xs={12} md={4}>
                            <Typography variant="h6" className="font-semibold mb-3">
                              Key Topics to Master
                            </Typography>
                            <List dense>
                              {recommendation.topics.map((topic, topicIndex) => (
                                <ListItem key={topicIndex} className="px-0">
                                  <ListItemIcon>
                                    <CheckCircle className="text-green-500" fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={topic}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Grid>

                          {/* Recommended Resources */}
                          <Grid item xs={12} md={4}>
                            <Typography variant="h6" className="font-semibold mb-3">
                              Recommended Resources
                            </Typography>
                            <div className="space-y-3">
                              {recommendation.resources.map((resource, resourceIndex) => (
                                <Card key={resourceIndex} className="p-3 bg-neutral-50">
                                  <div className="flex items-start space-x-3">
                                    {getResourceIcon(resource.type)}
                                    <div className="flex-1">
                                      <Typography variant="body2" className="font-medium">
                                        {resource.title}
                                      </Typography>
                                      <Typography variant="caption" className="text-neutral-600">
                                        {resource.duration || `${resource.questions} questions` || `${resource.pages} pages`}
                                      </Typography>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </Grid>

                          {/* Study Plan */}
                          <Grid item xs={12} md={4}>
                            <Typography variant="h6" className="font-semibold mb-3">
                              Weekly Study Plan
                            </Typography>
                            <div className="space-y-3">
                              {recommendation.studyPlan.map((week, weekIndex) => (
                                <Card key={weekIndex} className="p-3 bg-blue-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <Typography variant="body2" className="font-medium">
                                      Week {week.week}
                                    </Typography>
                                    <Chip
                                      label={`${week.hours}h`}
                                      size="small"
                                      className="bg-blue-100 text-blue-800"
                                    />
                                  </div>
                                  <Typography variant="caption" className="text-neutral-600">
                                    {week.focus}
                                  </Typography>
                                </Card>
                              ))}
                            </div>
                          </Grid>
                        </Grid>

                        <Divider className="my-4" />
                        
                        <div className="flex justify-end space-x-3">
                          <Button
                            variant="outlined"
                            startIcon={<Assessment />}
                            onClick={() => navigate('/assessment')}
                          >
                            Take Assessment
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<Quiz />}
                            onClick={() => navigate('/mock-test')}
                            sx={{
                              background: 'linear-gradient(135deg, #FF6B6B 0%, #E53E3E 100%)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #E53E3E 0%, #C53030 100%)',
                              }
                            }}
                          >
                            Practice {recommendation.subject}
                          </Button>
                        </div>
                      </AccordionDetails>
                    </Accordion>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Study Schedule & Next Steps */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card className="card-elevated h-full">
                <CardContent className="p-6">
                  <Typography variant="h5" className="font-semibold mb-6 flex items-center">
                    <Schedule className="mr-2 text-blue-500" />
                    Optimal Study Schedule
                  </Typography>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <Typography variant="body1" className="font-medium mb-2">
                        Daily Recommendation
                      </Typography>
                      <Typography variant="h4" className="font-bold text-blue-600">
                        {mockFeedback.studySchedule.dailyRecommendation}
                      </Typography>
                    </div>

                    <div className="p-4 bg-green-50 rounded-xl">
                      <Typography variant="body1" className="font-medium mb-2">
                        Weekly Goal
                      </Typography>
                      <Typography variant="h4" className="font-bold text-green-600">
                        {mockFeedback.studySchedule.weeklyGoal}
                      </Typography>
                    </div>

                    <div>
                      <Typography variant="body1" className="font-medium mb-2">
                        Optimal Study Times
                      </Typography>
                      <div className="space-y-2">
                        {mockFeedback.studySchedule.optimalTimes.map((time, index) => (
                          <Chip
                            key={index}
                            label={time}
                            className="mr-2 bg-purple-100 text-purple-800"
                          />
                        ))}
                      </div>
                    </div>

                    <Alert severity="info" className="rounded-xl">
                      <Typography variant="body2">
                        <strong>Tip:</strong> {mockFeedback.studySchedule.breakPattern}
                      </Typography>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card className="card-elevated h-full">
                <CardContent className="p-6">
                  <Typography variant="h5" className="font-semibold mb-6 flex items-center">
                    <GpsFixed className="mr-2 text-green-500" />
                    Next Steps
                  </Typography>

                  <div className="space-y-4">
                    {mockFeedback.nextSteps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="p-4 border-l-4 border-green-500 bg-green-50 rounded-r-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Typography variant="body1" className="font-medium">
                            {step.action}
                          </Typography>
                          <Chip
                            label={step.priority}
                            size="small"
                            className={
                              step.priority === 'Immediate' ? 'bg-red-100 text-red-800' :
                              step.priority === 'This Week' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Timer className="text-neutral-500" fontSize="small" />
                          <Typography variant="body2" className="text-neutral-600">
                            {step.estimatedTime}
                          </Typography>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 text-center">
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/mock-test')}
                      className="hover-lift"
                      sx={{
                        background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #388E3C 0%, #689F38 100%)',
                        }
                      }}
                      startIcon={<PlayArrow />}
                    >
                      Start Recommended Action
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </div>
  );
};

export default Feedback;