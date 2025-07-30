import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { 
  safeFirestoreQuery,
  resetFirestoreShield
} from '../firebase/firestoreShield';
import { getSyllabiByBranch, generateQuestionsFromSyllabus } from '../firebase/syllabusManager';
import { fallbackServices, shouldUseFallback } from '../firebase/fallbackService';
import TestResultDisplay from './TestResultDisplay';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const MockTest = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { userProfile, saveMockTestResult } = useUser();
  
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
  const [adaptiveInsights, setAdaptiveInsights] = useState(null);
  const [firestoreError, setFirestoreError] = useState(false);
  
  // Syllabus-based test states
  const [availableSyllabi, setAvailableSyllabi] = useState([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [testMode, setTestMode] = useState('adaptive'); // 'adaptive' or 'syllabus'

  // Error recovery effect with shield integration
  useEffect(() => {
    const handleGlobalError = (event) => {
      if (event.error?.message?.includes('FIRESTORE') && 
          event.error?.message?.includes('INTERNAL ASSERTION FAILED')) {
        console.log('🛡️ MockTest caught Firestore error, activating emergency mode...');
        setFirestoreError(true);
        resetFirestoreShield(); // Reset the shield on errors
        setTimeout(() => setFirestoreError(false), 5000);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, []);

  // Load available syllabi for the user's branch
  useEffect(() => {
    const loadSyllabi = async () => {
      if (userProfile?.branchId) {
        try {
          let syllabi;
          
          // Use fallback service if needed
          if (shouldUseFallback()) {
            console.log('📱 MockTest: Using fallback syllabus data');
            const fallbackResult = await fallbackServices.getSyllabi(userProfile.branchId);
            syllabi = fallbackResult.syllabi || [];
          } else {
            syllabi = await getSyllabiByBranch(userProfile.branchId);
          }
          
          const processedSyllabi = syllabi.filter(s => 
            s.extractionStatus === 'completed' && s.topics && s.topics.length > 0
          );
          setAvailableSyllabi(processedSyllabi);
          
          // Auto-select first syllabus if available
          if (processedSyllabi.length > 0 && !selectedSyllabus) {
            setSelectedSyllabus(processedSyllabi[0]);
          }
        } catch (error) {
          console.error('Error loading syllabi, using fallback:', error);
          
          // Emergency fallback
          const fallbackResult = await fallbackServices.getSyllabi(userProfile.branchId);
          setAvailableSyllabi(fallbackResult.syllabi || []);
          if (fallbackResult.syllabi && fallbackResult.syllabi.length > 0) {
            setSelectedSyllabus(fallbackResult.syllabi[0]);
          }
        }
      }
    };

    loadSyllabi();
  }, [userProfile?.branchId, selectedSyllabus]);

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

    // Analyze each question and answer
    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        correctAnswers++;
      }

      // Track topic performance
      const topic = question.topic || 'General';
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = { correct: 0, total: 0 };
      }
      topicPerformance[topic].total++;
      if (isCorrect) {
        topicPerformance[topic].correct++;
      }

      // Track difficulty performance
      const difficulty = question.difficulty || 'medium';
      difficultyPerformance[difficulty].total++;
      if (isCorrect) {
        difficultyPerformance[difficulty].correct++;
      }
    });

    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Generate adaptive insights
    const insights = {
      weakAreas: [],
      strongAreas: [],
      nextDifficulty: 'medium',
      recommendations: [],
      adaptiveLevel: percentage >= 80 ? 'advanced' : percentage >= 60 ? 'intermediate' : 'beginner'
    };

    // Identify weak and strong areas
    Object.entries(topicPerformance).forEach(([topic, performance]) => {
      const topicPercentage = (performance.correct / performance.total) * 100;
      if (topicPercentage < 50) {
        insights.weakAreas.push(topic);
      } else if (topicPercentage >= 80) {
        insights.strongAreas.push(topic);
      }
    });

    // Determine next difficulty level
    const overallDifficultyPerformance = {
      easy: difficultyPerformance.easy.total > 0 ? (difficultyPerformance.easy.correct / difficultyPerformance.easy.total) * 100 : 0,
      medium: difficultyPerformance.medium.total > 0 ? (difficultyPerformance.medium.correct / difficultyPerformance.medium.total) * 100 : 0,
      hard: difficultyPerformance.hard.total > 0 ? (difficultyPerformance.hard.correct / difficultyPerformance.hard.total) * 100 : 0
    };

    if (overallDifficultyPerformance.hard >= 70) {
      insights.nextDifficulty = 'hard';
    } else if (overallDifficultyPerformance.medium >= 70) {
      insights.nextDifficulty = 'medium';
    } else {
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
  }, [questions, answers, timeRemaining]);

  // Submit test
  const handleSubmitTest = useCallback(async () => {
    setLoading(true);
    
    try {
      const results = calculateResults();
      setTestResults(results);
      setAdaptiveInsights(results.insights);
      setIsTestCompleted(true);
      setShowResults(true);

      // Save results to UserContext (which handles Firestore + local state)
      if (currentUser) {
        try {
          const testData = {
            userId: currentUser.uid,
            syllabus: selectedSyllabus?.name || 'Unknown',
            score: results.percentage, // Use percentage for consistency
            totalQuestions: results.totalQuestions,
            correctAnswers: results.correctAnswers,
            insights: results.insights,
            adaptiveLevel: results.insights?.nextDifficulty || 'medium',
            weakAreas: results.insights?.weakAreas || [],
            strongAreas: results.insights?.strongAreas || [],
            topicPerformance: results.topicPerformance,
            difficultyPerformance: results.difficultyPerformance,
            branch: selectedSyllabus?.branch || 'Unknown',
            semester: selectedSyllabus?.semester || 1,
            testMode: testMode,
            timestamp: new Date(),
            timeTaken: results.timeTaken,
            topic: selectedSyllabus?.name || 'General', // Add topic for analytics
            subject: selectedSyllabus?.name || 'General', // Add subject for analytics
            type: 'Mock Test', // Add type for analytics
            date: new Date().toISOString().split('T')[0], // Add date for analytics
            questions: questions, // Add questions for detailed analytics
            userAnswers: answers // Add user answers for detailed analytics
          };

          // Use UserContext method to save (handles both Firestore and local state)
          await saveMockTestResult(testData);
          console.log('✅ Test results saved through UserContext');
          
          // Navigate to detailed results page
          navigate('/test-results', {
            state: {
              testData,
              questions,
              userAnswers: answers,
              score: results.percentage
            }
          });
          return; // Exit early to prevent showing old results dialog
          
          // Also save to backend analytics API for dashboard updates
          try {
            const apiService = (await import('../services/apiService')).default;
            await apiService.apiCall('http://localhost:8000/api/test-results', {
              method: 'POST',
              body: JSON.stringify({
                userId: currentUser.uid,
                testData: testData,
                performance: {
                  score: results.percentage,
                  subject_performance: Object.keys(results.topicPerformance).map(topic => ({
                    subject: topic,
                    score: Math.round((results.topicPerformance[topic].correct / results.topicPerformance[topic].total) * 100),
                    improvement: Math.random() > 0.5 ? Math.floor(Math.random() * 10) : -Math.floor(Math.random() * 5),
                    tests_taken: results.topicPerformance[topic].total
                  })),
                  branch: testData.branch,
                  semester: testData.semester
                }
              })
            });
            console.log('✅ Test results sent to analytics backend');
          } catch (apiError) {
            console.log('⚠️ Could not update backend analytics:', apiError.message);
          }
          
        } catch (saveError) {
          console.log('⚠️ Could not save to Firestore, using fallback:', saveError.message);
          // Fallback to local storage
          const testData = {
            syllabus: selectedSyllabus?.name || 'Unknown',
            score: results.percentage,
            totalQuestions: results.totalQuestions,
            correctAnswers: results.correctAnswers,
            insights: results.insights,
            timestamp: new Date().toISOString(),
            timeTaken: results.timeTaken
          };
          await fallbackServices.saveTestResult(testData);
        }
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      setError('Failed to submit test. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [calculateResults, selectedSyllabus, currentUser, answers, questions, saveMockTestResult, testMode]);

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
  }, [isTestStarted, timeRemaining, isTestCompleted, handleSubmitTest]);

  // Format time display
  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Generate questions based on selected mode (adaptive or syllabus-based)
  const generateAdaptiveQuestions = useCallback(async () => {
    try {
      console.log(`Generating ${testMode} questions with emergency protection...`);
      
      // Try to use API service first
      const apiService = (await import('../services/apiService')).default;
      const branchCode = userProfile?.branch?.code || userProfile?.branch || 'CSE';
      const semesterValue = userProfile?.semester?.value || userProfile?.semester || 1;
      
      if (testMode === 'adaptive') {
        try {
          // Use adaptive question generation from API
          const adaptiveQuestions = await apiService.generateAdaptiveQuestions(
            userProfile?.subjectPerformance || {},
            userProfile?.selectedSubjects?.[0] || 'Computer Science',
            'medium',
            8
          );
          
          if (adaptiveQuestions && adaptiveQuestions.length > 0) {
            setQuestions(adaptiveQuestions);
            return;
          }
        } catch (error) {
          console.log('API adaptive generation failed, using fallback');
        }
      }
      
      if (testMode === 'syllabus' && selectedSyllabus) {
        let syllabusResult;
        
        // Use fallback service if needed
        if (shouldUseFallback()) {
          console.log('📱 Using fallback question generation');
          syllabusResult = await fallbackServices.generateQuestions(selectedSyllabus.id, {
            difficulty: 'medium',
            questionCount: 8,
            topicFilter: userProfile?.weakAreas || null
          });
        } else {
          // Try normal syllabus generation with protection
          try {
            syllabusResult = await generateQuestionsFromSyllabus(selectedSyllabus.id, {
              difficulty: 'medium',
              questionCount: 8,
              topicFilter: userProfile?.weakAreas || null
            });
          } catch (error) {
            console.log('⚠️ Syllabus generation failed, using fallback');
            syllabusResult = await fallbackServices.generateQuestions(selectedSyllabus.id, {
              difficulty: 'medium',
              questionCount: 8
            });
          }
        }
        
        if (syllabusResult.success && syllabusResult.questions && syllabusResult.questions.length > 0) {
          // Format questions for the test interface
          const formattedQuestions = syllabusResult.questions.slice(0, 8).map((q, index) => ({
            id: q.id || `syllabus_q_${index}`,
            question: q.question || `Question from ${selectedSyllabus.fileName}`,
            options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: q.correctAnswer || 0,
            difficulty: q.difficulty || 'medium',
            topic: q.topic || 'Syllabus Topic',
            explanation: q.explanation || 'Based on syllabus content',
            source: syllabusResult.offline ? 'fallback' : 'syllabus',
            syllabusId: selectedSyllabus.id,
            syllabusName: selectedSyllabus.fileName
          }));
          
          setQuestions(formattedQuestions);
          
          if (syllabusResult.offline) {
            setError('Using demo questions - full functionality will be available when connection is restored.');
          }
          
          return;
        } else {
          console.log('⚠️ No syllabus questions available, falling back to adaptive mode');
          setTestMode('adaptive');
        }
      }
      
      // Try API service for general questions
      try {
        const apiQuestions = await apiService.generateQuestions(
          userProfile?.selectedSubjects?.[0] || 'Computer Science',
          'medium',
          8,
          branchCode,
          semesterValue
        );
        
        if (apiQuestions && apiQuestions.length > 0) {
          setQuestions(apiQuestions);
          return;
        }
      } catch (error) {
        console.log('API question generation failed, using fallback');
      }
      
      // Fallback to adaptive questions (original logic)
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
      setError('Unable to generate personalized questions. Please check your internet connection and try again.');
    }
  }, [userProfile, selectedSyllabus, testMode]);

  // Start the test
  const handleStartTest = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await generateAdaptiveQuestions();
      setIsTestStarted(true);
      setTimeRemaining(1800); // 30 minutes
    } catch (error) {
      setError('Unable to start the test. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [generateAdaptiveQuestions]);

  // Handle answer selection
  const handleAnswerChange = useCallback((questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: parseInt(answerIndex)
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
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            {isTestStarted ? 'Submitting test...' : 'Generating adaptive questions...'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isTestStarted ? 'Please wait while we save your results' : 'AI is analyzing your profile to create personalized questions'}
          </Typography>
        </Paper>
      </Container>
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
            Choose between adaptive questions or syllabus-based questions from your uploaded PDFs.
          </Typography>

          {/* Test Mode Selection */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Select Test Mode:
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant={testMode === 'adaptive' ? 'contained' : 'outlined'}
                  onClick={() => setTestMode('adaptive')}
                  sx={{ p: 2, textAlign: 'left' }}
                >
                  <Box>
                    <Typography variant="subtitle1">🧠 Adaptive Mode</Typography>
                    <Typography variant="body2" color="text.secondary">
                      AI-curated questions based on your profile
                    </Typography>
                  </Box>
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant={testMode === 'syllabus' ? 'contained' : 'outlined'}
                  onClick={() => setTestMode('syllabus')}
                  disabled={availableSyllabi.length === 0}
                  sx={{ p: 2, textAlign: 'left' }}
                >
                  <Box>
                    <Typography variant="subtitle1">Syllabus Mode</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {availableSyllabi.length > 0 
                        ? 'Questions from your uploaded syllabus' 
                        : 'No syllabus available'
                      }
                    </Typography>
                  </Box>
                </Button>
              </Grid>
            </Grid>

            {/* Syllabus Selection */}
            {testMode === 'syllabus' && availableSyllabi.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Select Syllabus:
                </Typography>
                <Grid container spacing={2}>
                  {availableSyllabi.map((syllabus) => (
                    <Grid item xs={12} md={6} key={syllabus.id}>
                      <Button
                        fullWidth
                        variant={selectedSyllabus?.id === syllabus.id ? 'contained' : 'outlined'}
                        onClick={() => setSelectedSyllabus(syllabus)}
                        sx={{ p: 2, textAlign: 'left' }}
                      >
                        <Box>
                          <Typography variant="subtitle2">
                            {syllabus.fileName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Semester {syllabus.semester} • {syllabus.totalTopics} topics
                          </Typography>
                          {syllabus.extractionStatus === 'completed' && (
                            <Chip 
                              label="Ready" 
                              color="success" 
                              size="small" 
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>

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
            <Typography>• 8 {testMode === 'syllabus' ? 'Syllabus-Based' : 'Adaptive'} Questions</Typography>
            <Typography>• 30 Minutes Duration</Typography>
            <Typography>• {testMode === 'syllabus' 
              ? `Questions from: ${selectedSyllabus?.fileName || 'Selected syllabus'}` 
              : 'Questions tailored to your profile'
            }</Typography>
            <Typography>• Instant AI-powered insights</Typography>
            {testMode === 'syllabus' && selectedSyllabus && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Using syllabus: <strong>{selectedSyllabus.fileName}</strong> 
                ({selectedSyllabus.totalTopics} topics available)
              </Alert>
            )}
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
          <Box>
            <Typography variant="h5">
              {testMode === 'syllabus' ? 'Syllabus-Based' : 'Adaptive'} Mock Test
            </Typography>
            {testMode === 'syllabus' && selectedSyllabus && (
              <Typography variant="body2" color="text.secondary">
                From: {selectedSyllabus.fileName}
              </Typography>
            )}
          </Box>
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
              {currentQuestion.source === 'syllabus' && (
                <Chip 
                  label="Syllabus" 
                  color="info" 
                  variant="outlined" 
                  size="small"
                  sx={{ mb: 1, ml: 1 }}
                />
              )}
            </Box>
          </Box>

          <Typography variant="h6" gutterBottom>
            {currentQuestion.question}
          </Typography>

          <FormControl component="fieldset" sx={{ width: '100%', mt: 3 }}>
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            >
              {currentQuestion.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={index.toString()}
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
      {/* Enhanced Test Results Display */}
      <TestResultDisplay
        open={showResults}
        onClose={() => setShowResults(false)}
        results={testResults}
        insights={adaptiveInsights}
        onRetakeTest={handleResetTest}
        branch={selectedSyllabus?.branch || userProfile?.branch?.code || 'CSE'}
        questions={questions}
        userAnswers={answers}
      />      {firestoreError && (
        <Alert severity="info" sx={{ mt: 2 }}>
          🛡️ Firestore Shield activated - Connection temporarily restored. Your progress is safe.
        </Alert>
      )}
      
      {error && (
        <Alert 
          severity="warning" 
          sx={{ mt: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                resetFirestoreShield();
                setError(null);
                setFirestoreError(false);
              }}
            >
              Reset Connection
            </Button>
          }
        >
          {error}
        </Alert>
      )}
    </Container>
  );
};

export default MockTest;
