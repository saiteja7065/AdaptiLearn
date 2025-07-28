import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { Timer, Psychology, TrendingUp, Assessment } from '@mui/icons-material';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getFirestoreConnection } from '../firebase/connectionManager';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const MockTest = () => {
  const { currentUser } = useAuth();
  const { userProfile } = useUser();
  
  // State management
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [adaptiveInsights, setAdaptiveInsights] = useState(null);

  // Timer effect
  useEffect(() => {
    let timer;
    if (isTestStarted && timeRemaining > 0 && !isTestCompleted) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTestStarted, timeRemaining, isTestCompleted]);

  // Format time display
  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Generate adaptive questions based on user profile and previous performance
  const generateAdaptiveQuestions = useCallback(async () => {
    try {
      await getFirestoreConnection();
      
      const baseQuestions = [
        {
          id: 1,
          question: "What is the time complexity of binary search?",
          options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
          correctAnswer: 1,
          difficulty: "medium",
          topic: "Algorithms",
          explanation: "Binary search divides the search space in half with each iteration, resulting in O(log n) time complexity."
        },
        {
          id: 2,
          question: "Which data structure uses LIFO (Last In First Out) principle?",
          options: ["Queue", "Stack", "Array", "Linked List"],
          correctAnswer: 1,
          difficulty: "easy",
          topic: "Data Structures",
          explanation: "Stack follows LIFO principle where the last element added is the first one to be removed."
        },
        {
          id: 3,
          question: "What is the purpose of virtual memory in operating systems?",
          options: [
            "To increase CPU speed",
            "To provide more storage space than physically available RAM",
            "To encrypt data",
            "To manage network connections"
          ],
          correctAnswer: 1,
          difficulty: "medium",
          topic: "Operating Systems",
          explanation: "Virtual memory allows the system to use hard disk space as if it were RAM, providing more memory space than physically available."
        },
        {
          id: 4,
          question: "In object-oriented programming, what is inheritance?",
          options: [
            "Creating multiple objects",
            "A class acquiring properties and methods from another class",
            "Hiding implementation details",
            "Grouping related functions"
          ],
          correctAnswer: 1,
          difficulty: "easy",
          topic: "OOP",
          explanation: "Inheritance allows a class to inherit properties and methods from a parent class, promoting code reusability."
        },
        {
          id: 5,
          question: "What is the worst-case time complexity of QuickSort?",
          options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
          correctAnswer: 1,
          difficulty: "hard",
          topic: "Algorithms",
          explanation: "QuickSort has O(n²) worst-case complexity when the pivot is always the smallest or largest element."
        },
        {
          id: 6,
          question: "Which SQL command is used to retrieve data from a database?",
          options: ["INSERT", "UPDATE", "DELETE", "SELECT"],
          correctAnswer: 3,
          difficulty: "easy",
          topic: "Database",
          explanation: "SELECT command is used to query and retrieve data from database tables."
        },
        {
          id: 7,
          question: "What is the main advantage of using indexes in databases?",
          options: [
            "Reduces storage space",
            "Increases data security",
            "Improves query performance",
            "Simplifies database design"
          ],
          correctAnswer: 2,
          difficulty: "medium",
          topic: "Database",
          explanation: "Indexes create faster access paths to data, significantly improving query performance."
        },
        {
          id: 8,
          question: "In networking, what does TCP stand for?",
          options: [
            "Transfer Control Protocol",
            "Transmission Control Protocol",
            "Transport Communication Protocol",
            "Terminal Control Protocol"
          ],
          correctAnswer: 1,
          difficulty: "easy",
          topic: "Networking",
          explanation: "TCP stands for Transmission Control Protocol, which provides reliable data transmission."
        },
        {
          id: 9,
          question: "What is the purpose of normalization in database design?",
          options: [
            "To increase data redundancy",
            "To reduce data redundancy and improve data integrity",
            "To make queries slower",
            "To increase storage requirements"
          ],
          correctAnswer: 1,
          difficulty: "medium",
          topic: "Database",
          explanation: "Normalization reduces data redundancy and improves data integrity by organizing data efficiently."
        },
        {
          id: 10,
          question: "Which design pattern ensures a class has only one instance?",
          options: ["Factory", "Observer", "Singleton", "Strategy"],
          correctAnswer: 2,
          difficulty: "medium",
          topic: "Design Patterns",
          explanation: "Singleton pattern ensures that a class has only one instance and provides global access to it."
        }
      ];

      // Adaptive question selection based on user's weak areas
      let selectedQuestions = [...baseQuestions];
      
      if (userProfile?.weakAreas?.length > 0) {
        // Prioritize questions from weak areas
        selectedQuestions = baseQuestions.filter(q => 
          userProfile.weakAreas.some(area => 
            q.topic.toLowerCase().includes(area.toLowerCase())
          )
        );
        
        // Fill remaining slots with general questions
        if (selectedQuestions.length < 8) {
          const remainingQuestions = baseQuestions.filter(q => 
            !selectedQuestions.includes(q)
          );
          selectedQuestions = [
            ...selectedQuestions,
            ...remainingQuestions.slice(0, 8 - selectedQuestions.length)
          ];
        }
      }

      // Adjust difficulty based on user's performance level
      if (userProfile?.performanceLevel) {
        if (userProfile.performanceLevel === 'beginner') {
          selectedQuestions = selectedQuestions.filter(q => 
            q.difficulty === 'easy' || q.difficulty === 'medium'
          );
        } else if (userProfile.performanceLevel === 'advanced') {
          selectedQuestions = selectedQuestions.filter(q => 
            q.difficulty === 'medium' || q.difficulty === 'hard'
          );
        }
      }

      // Shuffle and limit to 8 questions
      const shuffled = selectedQuestions.sort(() => Math.random() - 0.5).slice(0, 8);
      setQuestions(shuffled);
      
    } catch (error) {
      console.error('Error generating questions:', error);
      setError('Failed to generate adaptive questions. Please try again.');
    }
  }, [userProfile]);

  // Start the test
  const handleStartTest = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await generateAdaptiveQuestions();
      setIsTestStarted(true);
      setTimeRemaining(1800); // 30 minutes
    } catch (error) {
      setError('Failed to start test. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [generateAdaptiveQuestions]);

  // Handle answer selection
  const handleAnswerChange = useCallback((questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  }, []);

  // Navigate questions
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Calculate results and provide adaptive insights
  const calculateResults = useCallback(() => {
    const totalQuestions = questions.length;
    let correctAnswers = 0;
    const topicPerformance = {};
    const difficultyPerformance = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    };

    questions.forEach(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) correctAnswers++;
      
      // Track topic performance
      if (!topicPerformance[question.topic]) {
        topicPerformance[question.topic] = { correct: 0, total: 0 };
      }
      topicPerformance[question.topic].total++;
      if (isCorrect) topicPerformance[question.topic].correct++;
      
      // Track difficulty performance
      difficultyPerformance[question.difficulty].total++;
      if (isCorrect) difficultyPerformance[question.difficulty].correct++;
    });

    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Generate adaptive insights
    const insights = {
      strongAreas: [],
      weakAreas: [],
      recommendations: [],
      nextDifficulty: difficulty
    };

    // Analyze topic performance
    Object.entries(topicPerformance).forEach(([topic, performance]) => {
      const topicPercentage = (performance.correct / performance.total) * 100;
      if (topicPercentage >= 70) {
        insights.strongAreas.push(topic);
      } else if (topicPercentage < 50) {
        insights.weakAreas.push(topic);
      }
    });

    // Generate recommendations
    if (percentage >= 80) {
      insights.recommendations.push("Excellent performance! Consider taking advanced level tests.");
      insights.nextDifficulty = 'hard';
    } else if (percentage >= 60) {
      insights.recommendations.push("Good performance! Focus on weak areas for improvement.");
      insights.nextDifficulty = 'medium';
    } else {
      insights.recommendations.push("Review fundamental concepts and practice more basic problems.");
      insights.nextDifficulty = 'easy';
    }

    if (insights.weakAreas.length > 0) {
      insights.recommendations.push(`Focus on improving: ${insights.weakAreas.join(', ')}`);
    }

    return {
      totalQuestions,
      correctAnswers,
      percentage,
      topicPerformance,
      difficultyPerformance,
      insights,
      timeTaken: 1800 - timeRemaining
    };
  }, [questions, answers, timeRemaining, difficulty]);

  // Submit test
  const handleSubmitTest = useCallback(async () => {
    setLoading(true);
    
    try {
      await getFirestoreConnection();
      
      const results = calculateResults();
      setTestResults(results);
      setAdaptiveInsights(results.insights);
      setIsTestCompleted(true);
      setShowResults(true);

      // Save results to Firestore
      if (currentUser) {
        const testData = {
          userId: currentUser.uid,
          type: 'mock_test',
          results: results,
          questions: questions,
          answers: answers,
          timestamp: new Date(),
          adaptiveInsights: results.insights
        };

        await addDoc(collection(db, 'test_results'), testData);

        // Update user profile with performance data
        if (userProfile) {
          const updatedProfile = {
            ...userProfile,
            lastTestScore: results.percentage,
            lastTestDate: new Date(),
            weakAreas: results.insights.weakAreas,
            strongAreas: results.insights.strongAreas,
            preferredDifficulty: results.insights.nextDifficulty
          };

          await updateDoc(doc(db, 'users', currentUser.uid), updatedProfile);
        }
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      setError('Failed to submit test results. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [calculateResults, currentUser, userProfile, questions, answers]);

  // Reset test
  const handleResetTest = useCallback(() => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeRemaining(1800);
    setIsTestStarted(false);
    setIsTestCompleted(false);
    setShowResults(false);
    setTestResults(null);
    setAdaptiveInsights(null);
    setError(null);
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={50} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          {isTestStarted ? 'Submitting test...' : 'Generating adaptive questions...'}
        </Typography>
      </Box>
    );
  }

  if (!isTestStarted) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Psychology sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Adaptive Mock Test
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Take a personalized mock test adapted to your learning profile and weak areas.
            The questions will be selected based on your performance history and preferences.
          </Typography>

          {userProfile && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Your Adaptive Profile:
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {userProfile.weakAreas?.length > 0 && (
                  <Grid item>
                    <Chip 
                      label={`Weak Areas: ${userProfile.weakAreas.slice(0, 2).join(', ')}`}
                      color="warning"
                      variant="outlined"
                    />
                  </Grid>
                )}
                {userProfile.performanceLevel && (
                  <Grid item>
                    <Chip 
                      label={`Level: ${userProfile.performanceLevel}`}
                      color="info"
                      variant="outlined"
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Details:
            </Typography>
            <Typography>• 8 Adaptive Questions</Typography>
            <Typography>• 30 Minutes Duration</Typography>
            <Typography>• Questions tailored to your profile</Typography>
            <Typography>• Instant AI-powered insights</Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={handleStartTest}
            startIcon={<Assessment />}
            disabled={loading}
          >
            Start Adaptive Test
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Test Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            Adaptive Mock Test
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              icon={<Timer />}
              label={formatTime(timeRemaining)}
              color={timeRemaining < 300 ? 'error' : 'primary'}
              variant="outlined"
            />
            <Chip
              label={`Question ${currentQuestionIndex + 1} of ${questions.length}`}
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Paper>

      {/* Question Content */}
      {currentQuestion && (
        <Paper sx={{ p: 4, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box>
              <Chip 
                label={currentQuestion.topic} 
                color="primary" 
                variant="outlined" 
                size="small"
                sx={{ mb: 1 }}
              />
              <Chip 
                label={currentQuestion.difficulty} 
                color={
                  currentQuestion.difficulty === 'easy' ? 'success' :
                  currentQuestion.difficulty === 'medium' ? 'warning' : 'error'
                }
                variant="outlined" 
                size="small"
                sx={{ mb: 1, ml: 1 }}
              />
            </Box>
          </Box>

          <Typography variant="h6" gutterBottom>
            {currentQuestion.question}
          </Typography>

          <FormControl component="fieldset" sx={{ width: '100%', mt: 3 }}>
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, parseInt(e.target.value))}
            >
              {currentQuestion.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={index}
                  control={<Radio />}
                  label={option}
                  sx={{
                    mb: 1,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Paper>
      )}

      {/* Navigation */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Button
            variant="outlined"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <Box display="flex" gap={2}>
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmitTest}
                disabled={Object.keys(answers).length === 0}
              >
                Submit Test
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNextQuestion}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Results Dialog */}
      <Dialog 
        open={showResults} 
        onClose={() => setShowResults(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <TrendingUp color="primary" />
            Test Results & Adaptive Insights
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {testResults && (
            <Box>
              <Typography variant="h4" color="primary" gutterBottom textAlign="center">
                {testResults.percentage}%
              </Typography>
              <Typography variant="body1" textAlign="center" gutterBottom>
                {testResults.correctAnswers} out of {testResults.totalQuestions} questions correct
              </Typography>

              {adaptiveInsights && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    🎯 Adaptive Insights:
                  </Typography>
                  
                  {adaptiveInsights.strongAreas.length > 0 && (
                    <Card sx={{ mb: 2, backgroundColor: 'success.light' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="success.dark">
                          💪 Strong Areas:
                        </Typography>
                        <Typography>
                          {adaptiveInsights.strongAreas.join(', ')}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}

                  {adaptiveInsights.weakAreas.length > 0 && (
                    <Card sx={{ mb: 2, backgroundColor: 'warning.light' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="warning.dark">
                          📚 Areas for Improvement:
                        </Typography>
                        <Typography>
                          {adaptiveInsights.weakAreas.join(', ')}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}

                  <Card sx={{ backgroundColor: 'info.light' }}>
                    <CardContent>
                      <Typography variant="subtitle1" color="info.dark">
                        🚀 Recommendations:
                      </Typography>
                      {adaptiveInsights.recommendations.map((rec, index) => (
                        <Typography key={index} sx={{ mt: 1 }}>
                          • {rec}
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowResults(false)}>
            Close
          </Button>
          <Button variant="contained" onClick={handleResetTest}>
            Take Another Test
          </Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default MockTest;
