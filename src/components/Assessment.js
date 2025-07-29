import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Chip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormLabel,
  Box
} from '@mui/material';
import {
  Timer,
  CheckCircle,
  NavigateNext,
  NavigateBefore,
  Quiz,
  School
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import apiService from '../services/apiService';
import { 
  getUserSyllabi, 
  generateQuestionsFromSyllabus 
} from '../firebase/syllabusManager';

const Assessment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, saveAssessmentResult } = useUser();
  
  // Assessment states
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  // Syllabus integration states
  const [availableSyllabi, setAvailableSyllabi] = useState([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState('');
  const [assessmentMode, setAssessmentMode] = useState('adaptive'); // 'adaptive' or 'syllabus'
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load user syllabi on component mount
  useEffect(() => {
    const loadSyllabi = async () => {
      if (user) {
        try {
          const syllabi = await getUserSyllabi(user.uid);
          setAvailableSyllabi(syllabi);
        } catch (error) {
          console.error('Error loading syllabi:', error);
          setError('Failed to load syllabi');
        }
      }
    };
    
    loadSyllabi();
  }, [user]);

  // Load default adaptive questions or syllabus-based questions
  useEffect(() => {
    const loadQuestions = async () => {
      if (assessmentMode === 'syllabus' && selectedSyllabus) {
        setLoading(true);
        try {
          // Use new API service for question generation
          const questions = await apiService.generateQuestions(
            selectedSyllabus.subject || 'Computer Science',
            'medium',
            10
          );
          
          if (questions && questions.length > 0) {
            setQuestions(questions);
            setError('');
            
            // Track activity
            await apiService.trackActivity('assessment_started', {
              mode: 'syllabus',
              subject: selectedSyllabus.subject,
              questionCount: questions.length
            });
          } else {
            setError('Failed to generate questions from syllabus');
            setQuestions(getDefaultQuestions()); // Fallback
          }
        } catch (error) {
          console.error('Error generating questions:', error);
          setError('Failed to generate questions. Using default questions.');
          setQuestions(getDefaultQuestions()); // Fallback
        } finally {
          setLoading(false);
        }
      } else if (assessmentMode === 'adaptive') {
        setLoading(true);
        try {
          // Generate adaptive questions using API service
          const questions = await apiService.generateQuestions(
            'Computer Science Fundamentals',
            'medium',
            10
          );
          
          if (questions && questions.length > 0) {
            setQuestions(questions);
            
            // Track activity
            await apiService.trackActivity('assessment_started', {
              mode: 'adaptive',
              questionCount: questions.length
            });
          } else {
            setQuestions(getDefaultQuestions());
          }
        } catch (error) {
          console.error('Error generating adaptive questions:', error);
          setQuestions(getDefaultQuestions());
        } finally {
          setLoading(false);
        }
      }
    };

    loadQuestions();
  }, [assessmentMode, selectedSyllabus]);

  // Default adaptive questions for fallback
  const getDefaultQuestions = () => [
    {
      id: 'default_1',
      subject: 'Data Structures',
      difficulty: 'Medium',
      question: 'What is the time complexity of inserting an element at the beginning of a linked list?',
      options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
      correctAnswer: 0,
      explanation: 'Inserting at the beginning of a linked list is O(1) as it only requires updating pointers.'
    },
    {
      id: 'default_2',
      subject: 'Algorithms',
      difficulty: 'Hard',
      question: 'Which sorting algorithm has the best average-case time complexity?',
      options: ['Bubble Sort', 'Quick Sort', 'Merge Sort', 'Selection Sort'],
      correctAnswer: 2,
      explanation: 'Merge Sort has consistent O(n log n) time complexity in all cases.'
    },
    {
      id: 'default_3',
      subject: 'Database Systems',
      difficulty: 'Easy',
      question: 'What does ACID stand for in database transactions?',
      options: [
        'Atomicity, Consistency, Isolation, Durability',
        'Accuracy, Completeness, Integrity, Data',
        'Authentication, Confidentiality, Integrity, Delivery',
        'Availability, Consistency, Isolation, Dependency'
      ],
      correctAnswer: 0,
      explanation: 'ACID represents the four key properties that guarantee reliable database transactions.'
    },
    {
      id: 'default_4',
      subject: 'Operating Systems',
      difficulty: 'Medium',
      question: 'What is a deadlock in operating systems?',
      options: [
        'A type of scheduling algorithm',
        'A situation where processes wait indefinitely for resources',
        'A memory management technique',
        'A file system corruption'
      ],
      correctAnswer: 1,
      explanation: 'Deadlock occurs when processes are blocked waiting for resources held by other blocked processes.'
    },
    {
      id: 'default_5',
      subject: 'Computer Networks',
      difficulty: 'Medium',
      question: 'Which layer of the OSI model handles routing?',
      options: ['Physical Layer', 'Data Link Layer', 'Network Layer', 'Transport Layer'],
      correctAnswer: 2,
      explanation: 'The Network Layer (Layer 3) is responsible for routing packets between networks.'
    }
  ];

  // Define calculateResults before useEffect that uses it
  const calculateResults = useCallback(() => {
    let correct = 0;
    let subjectScores = {};
    
    questions.forEach(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) correct++;
      
      // Subject-wise scoring
      if (!subjectScores[question.subject]) {
        subjectScores[question.subject] = { correct: 0, total: 0 };
      }
      subjectScores[question.subject].total++;
      if (isCorrect) subjectScores[question.subject].correct++;
    });

    // Convert to percentages
    Object.keys(subjectScores).forEach(subject => {
      const score = subjectScores[subject];
      subjectScores[subject] = Math.round((score.correct / score.total) * 100);
    });

    const overallScore = Math.round((correct / questions.length) * 100);
    
    return {
      overallScore,
      correctAnswers: correct,
      totalQuestions: questions.length,
      subjectScores,
      timeSpent: 1800 - timeLeft,
      completedAt: new Date().toISOString()
    };
  }, [questions, answers, timeLeft]);

  // Define handleSubmitAssessment before useEffect that uses it
  const handleSubmitAssessment = useCallback(async () => {
    try {
      const assessmentResults = calculateResults();
      setResults(assessmentResults);
      setIsCompleted(true);
      setShowResults(true);
      
      // Prepare assessment data for backend
      const assessmentData = {
        assessmentId: `assessment_${Date.now()}`,
        score: assessmentResults.percentage,
        totalQuestions: questions.length,
        correctAnswers: assessmentResults.correctAnswers,
        timeSpent: 1800 - timeLeft, // Time spent in seconds
        difficulty: 'medium',
        topics: [...new Set(questions.map(q => q.topic || q.subject))],
        answers: questions.map(q => ({
          questionId: q.id,
          userAnswer: answers[q.id],
          correctAnswer: q.correctAnswer,
          isCorrect: answers[q.id] === q.correctAnswer,
          topic: q.topic || q.subject
        })),
        submittedAt: new Date().toISOString(),
        mode: assessmentMode
      };

      // Submit to backend analytics service
      try {
        const backendResponse = await apiService.submitAssessment(assessmentData);
        console.log('Assessment submitted to backend:', backendResponse);
      } catch (backendError) {
        console.error('Failed to submit to backend:', backendError);
        // Continue with local storage even if backend fails
      }

      // Save to local context (existing functionality)
      await saveAssessmentResult({
        type: 'baseline_assessment',
        ...assessmentResults,
        questions: questions.map(q => ({
          id: q.id,
          subject: q.subject,
          difficulty: q.difficulty,
          userAnswer: answers[q.id],
          correctAnswer: q.correctAnswer,
          isCorrect: answers[q.id] === q.correctAnswer
        }))
      });

      // Track completion activity
      await apiService.trackActivity('assessment_completed', {
        score: assessmentResults.percentage,
        timeSpent: 1800 - timeLeft,
        mode: assessmentMode,
        totalQuestions: questions.length
      });

    } catch (error) {
      console.error('Error submitting assessment:', error);
      // Fallback to basic results display
      const assessmentResults = calculateResults();
      setResults(assessmentResults);
      setIsCompleted(true);
      setShowResults(true);
    }
  }, [calculateResults, saveAssessmentResult, questions, answers, timeLeft, assessmentMode]);

  useEffect(() => {
    if (!user || !userProfile?.setupCompleted) {
      navigate('/dashboard');
    }
  }, [user, userProfile, navigate]);

  useEffect(() => {
    let timer;
    if (!isCompleted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCompleted, timeLeft, handleSubmitAssessment]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: parseInt(answerIndex)
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  if (!user || !userProfile) {
    return null;
  }

  // Results screen
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-neutral-50 to-primary-50 py-8">
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="card-elevated">
              <CardContent className="p-8 text-center">
                <CheckCircle className="text-6xl text-green-500 mb-4" />
                <Typography variant="h3" className="font-bold mb-2">
                  Assessment Completed!
                </Typography>
                <Typography variant="h5" className="text-neutral-600 mb-8">
                  Your baseline score: {results.overallScore}%
                </Typography>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <Typography variant="h6" className="font-semibold text-primary-600">
                      Correct Answers
                    </Typography>
                    <Typography variant="h4" className="font-bold">
                      {results.correctAnswers}/{results.totalQuestions}
                    </Typography>
                  </div>
                  <div className="text-center">
                    <Typography variant="h6" className="font-semibold text-secondary-600">
                      Time Spent
                    </Typography>
                    <Typography variant="h4" className="font-bold">
                      {Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s
                    </Typography>
                  </div>
                  <div className="text-center">
                    <Typography variant="h6" className="font-semibold text-accent-600">
                      Performance
                    </Typography>
                    <Typography variant="h4" className="font-bold">
                      {results.overallScore >= 80 ? 'Excellent' : 
                       results.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                    </Typography>
                  </div>
                </div>

                <div className="text-left mb-6">
                  <Typography variant="h6" className="font-semibold mb-4">
                    Subject Performance
                  </Typography>
                  {Object.entries(results.subjectScores).map(([subject, score]) => (
                    <div key={subject} className="mb-2">
                      <div className="flex justify-between items-center">
                        <Typography variant="body1">{subject}</Typography>
                        <Typography variant="body1" className="font-semibold">
                          {score}%
                        </Typography>
                      </div>
                      <LinearProgress
                        variant="determinate"
                        value={score}
                        className="mt-1"
                        sx={{
                          '& .MuiLinearProgress-bar': {
                            background: score >= 80 ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                                      score >= 60 ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' :
                                      'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>

                <Button
                  variant="contained"
                  onClick={() => navigate('/dashboard')}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  Continue to Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-neutral-50 to-primary-50 py-8">
        <Container maxWidth="md">
          <Card className="card-elevated">
            <CardContent className="p-8 text-center">
              <CircularProgress size={60} className="mb-4" />
              <Typography variant="h6" className="mb-2">
                Generating Questions...
              </Typography>
              <Typography variant="body2" className="text-neutral-600">
                Creating personalized assessment from your syllabus
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </div>
    );
  }

  // Show setup screen if no questions loaded yet
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-neutral-50 to-primary-50 py-8">
        <Container maxWidth="md">
          <Card className="card-elevated">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <Quiz sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                <Typography variant="h4" className="font-bold mb-2">
                  Assessment Setup
                </Typography>
                <Typography variant="body1" className="text-neutral-600">
                  Choose your assessment type to get started
                </Typography>
              </div>

              {error && (
                <Alert severity="error" className="mb-6">
                  {error}
                </Alert>
              )}

              {/* Assessment Mode Selection */}
              <Box className="mb-6">
                <FormLabel component="legend" className="font-semibold mb-3">
                  Assessment Type
                </FormLabel>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={assessmentMode}
                    onChange={(e) => setAssessmentMode(e.target.value)}
                    row
                  >
                    <FormControlLabel
                      value="adaptive"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="subtitle2">Adaptive Assessment</Typography>
                          <Typography variant="caption" className="text-neutral-600">
                            General questions that adapt to your performance
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="syllabus"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="subtitle2">Syllabus-Based</Typography>
                          <Typography variant="caption" className="text-neutral-600">
                            Questions generated from your uploaded syllabus
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Box>

              {/* Syllabus Selection */}
              {assessmentMode === 'syllabus' && (
                <Box className="mb-6">
                  <FormLabel className="font-semibold mb-3 block">
                    <School className="mr-2" />
                    Select Syllabus
                  </FormLabel>
                  <Select
                    value={selectedSyllabus}
                    onChange={(e) => setSelectedSyllabus(e.target.value)}
                    fullWidth
                    displayEmpty
                    disabled={availableSyllabi.length === 0}
                  >
                    <MenuItem value="">
                      <em>Select a syllabus for questions...</em>
                    </MenuItem>
                    {availableSyllabi.map((syllabus) => (
                      <MenuItem key={syllabus.id} value={syllabus.id}>
                        <Box>
                          <Typography variant="subtitle2">
                            {syllabus.fileName}
                          </Typography>
                          <Typography variant="caption" className="text-neutral-600">
                            {syllabus.branchId} • Semester {syllabus.semester} • {syllabus.topics?.length || 0} topics
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  
                  {availableSyllabi.length === 0 && (
                    <Alert severity="info" className="mt-3">
                      No syllabi found. Please upload a syllabus first or use Adaptive Assessment.
                    </Alert>
                  )}
                </Box>
              )}

              {/* Start Button */}
              <Box className="text-center">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    if (assessmentMode === 'adaptive' || selectedSyllabus) {
                      // Questions will be loaded by useEffect
                      console.log('Starting assessment...');
                    }
                  }}
                  disabled={assessmentMode === 'syllabus' && !selectedSyllabus}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    px: 4,
                    py: 1.5
                  }}
                >
                  Start Assessment
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </div>
    );
  }

  // Assessment screen
  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-neutral-50 to-primary-50 py-8">
      <Container maxWidth="md">
        <Card className="card-elevated">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <Typography variant="h5" className="font-bold">
                  {assessmentMode === 'syllabus' ? 'Syllabus-Based Assessment' : 'Adaptive Assessment'}
                </Typography>
                <Typography variant="body2" className="text-neutral-600">
                  Question {currentQuestion + 1} of {questions.length}
                  {assessmentMode === 'syllabus' && (
                    <span className="ml-2">
                      • {availableSyllabi.find(s => s.id === selectedSyllabus)?.fileName}
                    </span>
                  )}
                </Typography>
              </div>
              <div className="text-right">
                <Chip
                  label={formatTime(timeLeft)}
                  color="primary"
                  variant="outlined"
                  icon={<Timer />}
                  className="mb-2"
                />
                <Typography variant="body2" className="text-neutral-600">
                  Time Remaining
                </Typography>
              </div>
            </div>

            {/* Progress */}
            <LinearProgress
              variant="determinate"
              value={progress}
              className="mb-8"
              sx={{
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }
              }}
            />

            {/* Question */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Chip
                    label={currentQ.subject}
                    size="small"
                    sx={{ backgroundColor: '#667eea', color: 'white' }}
                  />
                  <Chip
                    label={currentQ.difficulty}
                    size="small"
                    color={currentQ.difficulty === 'Easy' ? 'success' : 
                           currentQ.difficulty === 'Medium' ? 'warning' : 'error'}
                  />
                </div>
                <Typography variant="h6" className="font-semibold mb-4">
                  {currentQ.question}
                </Typography>
              </div>

              <FormControl component="fieldset" className="w-full">
                <RadioGroup
                  value={answers[currentQ.id]?.toString() || ''}
                  onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                >
                  {currentQ.options.map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={index.toString()}
                      control={<Radio />}
                      label={option}
                      className="mb-2 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                      sx={{
                        '& .MuiRadio-root.Mui-checked': {
                          color: '#667eea',
                        },
                        '& .MuiFormControlLabel-label': {
                          fontSize: '1rem',
                          fontWeight: '500'
                        }
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </motion.div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <Button
                variant="outlined"
                startIcon={<NavigateBefore />}
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {currentQuestion === questions.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleSubmitAssessment}
                    sx={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    }}
                  >
                    Submit Assessment
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    endIcon={<NavigateNext />}
                    onClick={handleNextQuestion}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
};

export default Assessment;
