import React from 'react';
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
  Alert
} from '@mui/material';
import {
  TrendingUp,
  EmojiEvents,
  School,
  Star,
  Warning,
  CheckCircle,
  TrendingDown
} from '@mui/icons-material';

const TestResultDisplay = ({ 
  open, 
  onClose, 
  results, 
  insights, 
  onRetakeTest,
  branch = 'CSE' 
}) => {
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
      </DialogContent>
      
      <DialogActions sx={{ p: 3, backgroundColor: 'grey.50' }}>
        <Button onClick={onClose} variant="outlined">
          Close
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
