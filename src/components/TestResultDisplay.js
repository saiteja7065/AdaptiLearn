import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar
} from '@mui/material';
import {
  TrendingUp,
  EmojiEvents,
  School,
  Star,
  Warning,
  CheckCircle,
  TrendingDown,
  ExpandMore,
  QuizOutlined,
  LightbulbOutlined,
  BookmarkOutlined,
  ErrorOutlined,
  PlayArrowOutlined
} from '@mui/icons-material';

const TestResultDisplay = ({ 
  open, 
  onClose, 
  results, 
  insights, 
  onRetakeTest,
  branch = 'CSE',
  questions = [],
  userAnswers = {}
}) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!results) return null;

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'info'; 
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getPerformanceIcon = (score) => {
    if (score >= 90) return <EmojiEvents color="success" />;
    if (score >= 80) return <Star color="info" />;
    if (score >= 70) return <CheckCircle color="warning" />;
    return <Warning color="error" />;
  };

  const getGradeText = (score) => {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Very Good!';
    if (score >= 70) return 'Good!';
    if (score >= 60) return 'Satisfactory';
    return 'Needs Improvement';
  };

  const getBranchSpecificFeedback = (score, branch) => {
    const branchFeedback = {
      'MECH': {
        excellent: 'Outstanding knowledge of mechanical engineering principles!',
        good: 'Solid understanding of core mechanical concepts.',
        needs_improvement: 'Focus on fundamental mechanical engineering topics.'
      },
      'CSE': {
        excellent: 'Excellent programming and computer science skills!',
        good: 'Good grasp of CS fundamentals and algorithms.',
        needs_improvement: 'Review programming basics and data structures.'
      },
      'ECE': {
        excellent: 'Superb understanding of electronics and communication!',
        good: 'Strong foundation in electronics concepts.',
        needs_improvement: 'Study basic electronics and circuit analysis.'
      },
      'CIVIL': {
        excellent: 'Exceptional civil engineering knowledge!',
        good: 'Good understanding of civil engineering principles.',
        needs_improvement: 'Focus on structural and construction basics.'
      }
    };

    const feedback = branchFeedback[branch.toUpperCase()] || branchFeedback['CSE'];
    
    if (score >= 80) return feedback.excellent;
    if (score >= 60) return feedback.good;
    return feedback.needs_improvement;
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getQuestionStatus = (questionId) => {
    const userAnswer = userAnswers[questionId];
    const question = questions.find(q => q.id === questionId);
    
    if (!question) return 'unknown';
    
    if (userAnswer === question.correctAnswer) return 'correct';
    if (userAnswer && userAnswer !== question.correctAnswer) return 'incorrect';
    return 'unanswered';
  };

  const generateSolution = (question) => {
    // This would typically come from your backend/database
    // For now, I'll provide a comprehensive solution structure
    const solutions = {
      // Sample solutions - in real app, these would come from your question database
      default: {
        explanation: "Let's break down this problem step by step.",
        steps: [
          "Identify the key concepts involved in the question",
          "Apply the relevant formulas or principles", 
          "Substitute the given values",
          "Calculate and verify the result"
        ],
        keyPoints: [
          "Remember to check units in your calculations",
          "Consider edge cases and alternative approaches",
          "Practice similar problems for better understanding"
        ],
        relatedTopics: ["Topic 1", "Topic 2", "Topic 3"],
        resources: [
          { title: "Reference Book Chapter", link: "#" },
          { title: "Video Tutorial", link: "#" },
          { title: "Practice Problems", link: "#" }
        ]
      }
    };

    // In a real implementation, you'd look up the solution by question ID
    return solutions.default;
  };

  const renderQuestionReview = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <QuizOutlined color="primary" />
        Question-by-Question Review
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Review each question with detailed solutions and explanations
      </Typography>

      {questions.map((question, index) => {
        const status = getQuestionStatus(question.id);
        const userAnswer = userAnswers[question.id];
        const solution = generateSolution(question);
        
        return (
          <Accordion key={question.id} sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                backgroundColor: 
                  status === 'correct' ? 'success.light' :
                  status === 'incorrect' ? 'error.light' : 'grey.100',
                '&:hover': { backgroundColor: 
                  status === 'correct' ? 'success.main' :
                  status === 'incorrect' ? 'error.main' : 'grey.200'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Avatar sx={{ 
                  bgcolor: status === 'correct' ? 'success.main' : 
                          status === 'incorrect' ? 'error.main' : 'grey.500',
                  width: 32, height: 32, fontSize: '0.9rem'
                }}>
                  {index + 1}
                </Avatar>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {question.question}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip 
                      label={status === 'correct' ? 'Correct' : 
                             status === 'incorrect' ? 'Incorrect' : 'Not Answered'}
                      color={status === 'correct' ? 'success' : 
                             status === 'incorrect' ? 'error' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label={question.difficulty || 'Medium'}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Box>
                
                {status === 'correct' && <CheckCircle color="success" />}
                {status === 'incorrect' && <ErrorOutlined color="error" />}
                {status === 'unanswered' && <Warning color="warning" />}
              </Box>
            </AccordionSummary>
            
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Question Details */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Question Details
                      </Typography>
                      
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        <strong>Question:</strong> {question.question}
                      </Typography>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Options:
                      </Typography>
                      
                      {question.options?.map((option, optIndex) => (
                        <Box key={optIndex} sx={{ 
                          p: 1, 
                          mb: 1, 
                          borderRadius: 1,
                          backgroundColor: 
                            option === question.correctAnswer ? 'success.light' :
                            option === userAnswer && option !== question.correctAnswer ? 'error.light' :
                            'transparent',
                          border: '1px solid',
                          borderColor:
                            option === question.correctAnswer ? 'success.main' :
                            option === userAnswer && option !== question.correctAnswer ? 'error.main' :
                            'grey.300'
                        }}>
                          <Typography variant="body2">
                            {String.fromCharCode(65 + optIndex)}. {option}
                            {option === question.correctAnswer && (
                              <Chip label="Correct Answer" color="success" size="small" sx={{ ml: 1 }} />
                            )}
                            {option === userAnswer && option !== question.correctAnswer && (
                              <Chip label="Your Answer" color="error" size="small" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                        </Box>
                      ))}
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Your Answer:</strong> {userAnswer || 'Not answered'}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          <strong>Correct Answer:</strong> {question.correctAnswer}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Solution and Explanation */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LightbulbOutlined color="primary" />
                        Detailed Solution
                      </Typography>
                      
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {solution.explanation}
                      </Typography>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Step-by-Step Solution:
                      </Typography>
                      
                      <List dense>
                        {solution.steps.map((step, stepIndex) => (
                          <ListItem key={stepIndex}>
                            <ListItemIcon>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
                                {stepIndex + 1}
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText primary={step} />
                          </ListItem>
                        ))}
                      </List>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Key Points to Remember:
                      </Typography>
                      
                      {solution.keyPoints.map((point, pointIndex) => (
                        <Typography key={pointIndex} variant="body2" sx={{ mb: 1 }}>
                          • {point}
                        </Typography>
                      ))}
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Related Topics:
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {solution.relatedTopics.map((topic, topicIndex) => (
                          <Chip 
                            key={topicIndex}
                            label={topic}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Additional Resources:
                      </Typography>
                      
                      {solution.resources.map((resource, resIndex) => (
                        <Box key={resIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <BookmarkOutlined color="primary" sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2" component="a" href={resource.link} color="primary">
                            {resource.title}
                          </Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' }
      }}
    >
      <DialogTitle 
        sx={{ 
          backgroundColor: 'primary.main', 
          color: 'white',
          textAlign: 'center',
          py: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <TrendingUp fontSize="large" />
          <Typography variant="h5" component="div">
            Test Results & Performance Analysis
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {/* Tabs for different views */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="result tabs">
            <Tab label="Overview" />
            <Tab label="Question Review" />
            <Tab label="Performance Analysis" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && (
          <>
            {/* Score Overview */}
            <Box sx={{ backgroundColor: 'grey.50', p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                      <Box
                        sx={{
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          background: `conic-gradient(
                            ${getPerformanceColor(results.percentage) === 'success' ? '#4caf50' :
                              getPerformanceColor(results.percentage) === 'info' ? '#2196f3' :
                              getPerformanceColor(results.percentage) === 'warning' ? '#ff9800' : '#f44336'} 
                            ${results.percentage * 3.6}deg, 
                            #e0e0e0 0deg
                          )`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          color: 'white'
                        }}
                      >
                        {results.percentage}%
                      </Box>
                    </Box>
                    <Typography variant="h6" color={`${getPerformanceColor(results.percentage)}.main`}>
                      {getGradeText(results.percentage)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Performance Summary
                    </Typography>
                    <Typography variant="body1" color="textSecondary" paragraph>
                      {getBranchSpecificFeedback(results.percentage, branch)}
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {results.correctAnswers}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Correct Answers
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="textSecondary">
                          {results.totalQuestions}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Questions
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          </>
        )}

        {activeTab === 1 && renderQuestionReview()}

        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            {/* Subject Performance */}
            {results.topicPerformance && Object.keys(results.topicPerformance).length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School color="primary" />
                  Subject-wise Performance
                </Typography>
                
                <Grid container spacing={2}>
                  {Object.entries(results.topicPerformance).map(([topic, perf]) => {
                    const percentage = Math.round((perf.correct / perf.total) * 100);
                    return (
                      <Grid item xs={12} sm={6} key={topic}>
                        <Card sx={{ height: '100%' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {topic}
                              </Typography>
                              <Chip 
                                label={`${percentage}%`}
                                color={getPerformanceColor(percentage)}
                                size="small"
                              />
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={percentage} 
                              color={getPerformanceColor(percentage)}
                              sx={{ height: 8, borderRadius: 4, mb: 1 }}
                            />
                            <Typography variant="body2" color="textSecondary">
                              {perf.correct} out of {perf.total} correct
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {/* Insights and Recommendations */}
            {insights && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp color="primary" />
                  Adaptive Insights & Recommendations
                </Typography>
                
                <Grid container spacing={2}>
                  {/* Strong Areas */}
                  {insights.strongAreas && insights.strongAreas.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="medium">
                          💪 Strong Areas
                        </Typography>
                        <Typography variant="body2">
                          {insights.strongAreas.join(', ')}
                        </Typography>
                      </Alert>
                    </Grid>
                  )}

                  {/* Weak Areas */}
                  {insights.weakAreas && insights.weakAreas.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight="medium">
                          📚 Areas for Improvement
                        </Typography>
                        <Typography variant="body2">
                          {insights.weakAreas.join(', ')}
                        </Typography>
                      </Alert>
                    </Grid>
                  )}

                  {/* Recommendations */}
                  {insights.recommendations && insights.recommendations.length > 0 && (
                    <Grid item xs={12}>
                      <Card sx={{ backgroundColor: 'info.light' }}>
                        <CardContent>
                          <Typography variant="subtitle1" color="info.dark" fontWeight="medium" gutterBottom>
                            🎯 Personalized Recommendations
                          </Typography>
                          {insights.recommendations.map((rec, index) => (
                            <Typography key={index} variant="body2" sx={{ mt: 1 }}>
                              • {rec}
                            </Typography>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>

                {/* Next Difficulty Level */}
                {insights.nextDifficulty && (
                  <Box sx={{ mt: 3 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Alert severity="info" icon={<TrendingUp />}>
                      <Typography variant="subtitle2">
                        Recommended Next Level: <strong>{insights.nextDifficulty.toUpperCase()}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Based on your performance, we recommend taking {insights.nextDifficulty} level questions next.
                      </Typography>
                    </Alert>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, backgroundColor: 'grey.50' }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button 
          onClick={() => setActiveTab(1)} 
          variant="outlined"
          startIcon={<QuizOutlined />}
          sx={{ ml: 1 }}
          disabled={activeTab === 1}
        >
          Review Solutions
        </Button>
        <Button 
          onClick={onRetakeTest} 
          variant="contained" 
          startIcon={<School />}
          sx={{ ml: 1 }}
        >
          Take Another Test
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestResultDisplay;
