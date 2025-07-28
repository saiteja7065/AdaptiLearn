import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  Timer,
  CheckCircle,
  Cancel,
  Psychology,
  TrendingUp,
  Assessment as AssessmentIcon,
  NavigateNext,
  NavigateBefore,
  Flag,
  BookmarkBorder,
  Bookmark
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const Assessment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, saveAssessmentResult } = useUser();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState(new Set());
  const [results, setResults] = useState(null);

  // Mock questions data
  const questions = [
    {
      id: 1,
      subject: 'Data Structures',
      difficulty: 'Medium',
      question: 'What is the time complexity of inserting an element at the beginning of a linked list?',
      options: [
        'O(1)',
        'O(n)',
        'O(log n)',
        'O(n²)'
      ],
      correctAnswer: 0,
      explanation: 'Inserting at the beginning of a linked list requires only updating the head pointer, which takes constant time O(1).'
    },
    {
      id: 2,
      subject: 'Algorithms',
      difficulty: 'Hard',
      question: 'Which sorting algorithm has the best average-case time complexity?',
      options: [
        'Bubble Sort',
        'Quick Sort',
        'Merge Sort',
        'Selection Sort'
      ],
      correctAnswer: 2,
      explanation: 'Merge Sort has a consistent O(n log n) time complexity in all cases, making it optimal for average-case scenarios.'
    },
    {
      id: 3,
      subject: 'Database Systems',
      difficulty: 'Easy',
      question: 'What does ACID stand for in database transactions?',
      options: [
        'Atomicity, Consistency, Isolation, Durability',
        'Accuracy, Consistency, Integration, Durability',
        'Atomicity, Correctness, Isolation, Dependency',
        'Accuracy, Correctness, Integration, Dependency'
      ],
      correctAnswer: 0,
      explanation: 'ACID stands for Atomicity, Consistency, Isolation, and Durability - the four key properties of database transactions.'
    },
    {
      id: 4,
      subject: 'Operating Systems',
      difficulty: 'Medium',
      question: 'What is a deadlock in operating systems?',
      options: [
        'A situation where processes are waiting indefinitely for resources',
        'A type of scheduling algorithm',
        'A memory management technique',
        'A file system error'
      ],
      correctAnswer: 0,
      explanation: 'A deadlock occurs when two or more processes are blocked forever, waiting for each other to release resources.'
    },
    {
      id: 5,
      subject: 'Data Structures',
      difficulty: 'Hard',
      question: 'In a binary search tree, what is the maximum number of comparisons needed to find an element in a balanced tree with n nodes?',
      options: [
        'O(n)',
        'O(log n)',
        'O(n log n)',
        'O(1)'
      ],
      correctAnswer: 1,
      explanation: 'In a balanced binary search tree, the height is O(log n), so the maximum number of comparisons is also O(log n).'
    }
  ];

  useEffect(() => {
    if (!user || !userProfile?.setupCompleted) {
      navigate('/dashboard');
    }
  }, [user, userProfile, navigate]);

  useEffect(() => {
    let timer;
    if (isStarted && !isCompleted && timeLeft > 0) {
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
  }, [isStarted, isCompleted, timeLeft, handleSubmitAssessment]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartAssessment = () => {
    setIsStarted(true);
  };

  const handleAnswerChange = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleBookmark = (questionId) => {
    setBookmarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
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

  const handleQuestionNavigation = (index) => {
    setCurrentQuestion(index);
  };

  const calculateResults = () => {
    let correct = 0;
    let subjectScores = {};
    
    questions.forEach(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) correct++;
      
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
  };

  const handleSubmitAssessment = useCallback(async () => {
    const assessmentResults = calculateResults();
    setResults(assessmentResults);
    setIsCompleted(true);
    setShowResults(true);
    
    // Save results
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
  }, [calculateResults, saveAssessmentResult, questions, answers]);

  const getQuestionStatus = (index) => {
    const questionId = questions[index].id;
    if (answers[questionId] !== undefined) return 'answered';
    if (bookmarkedQuestions.has(questionId)) return 'bookmarked';
    if (index === currentQuestion) return 'current';
    return 'unanswered';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'answered': return 'bg-green-500 text-white';
      case 'bookmarked': return 'bg-yellow-500 text-white';
      case 'current': return 'bg-primary-500 text-white';
      default: return 'bg-neutral-200 text-neutral-600';
    }
  };

  if (!user || !userProfile) {
    return null;
  }

  // Pre-assessment screen
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 py-8">
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center mb-6">
              <IconButton
                onClick={() => navigate('/dashboard')}
                className="mr-4 hover-lift"
              >
                <ArrowBack />
              </IconButton>
              <Typography variant="h4" className="font-bold text-gradient-primary">
                Baseline Assessment
              </Typography>
            </div>

            <Card className="card-elevated">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-primary">
                    <AssessmentIcon className="text-white text-3xl" />
                  </div>
                  <Typography variant="h4" className="font-bold mb-4">
                    Ready to Begin?
                  </Typography>
                  <Typography variant="h6" className="text-neutral-600 mb-6">
                    This assessment will help us understand your current knowledge level
                  </Typography>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Timer className="text-primary-500" />
                      <div>
                        <Typography variant="body1" className="font-semibold">
                          Duration: 30 minutes
                        </Typography>
                        <Typography variant="body2" className="text-neutral-600">
                          Take your time to think through each question
                        </Typography>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Psychology className="text-secondary-500" />
                      <div>
                        <Typography variant="body1" className="font-semibold">
                          {questions.length} Questions
                        </Typography>
                        <Typography variant="body2" className="text-neutral-600">
                          Mixed difficulty across your selected subjects
                        </Typography>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="text-accent-500" />
                      <div>
                        <Typography variant="body1" className="font-semibold">
                          Adaptive Analysis
                        </Typography>
                        <Typography variant="body2" className="text-neutral-600">
                          AI will identify your strengths and weaknesses
                        </Typography>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-green-500" />
                      <div>
                        <Typography variant="body1" className="font-semibold">
                          Instant Results
                        </Typography>
                        <Typography variant="body2" className="text-neutral-600">
                          Get detailed feedback immediately after completion
                        </Typography>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert severity="info" className="mb-6 rounded-xl">
                  <Typography variant="body2">
                    <strong>Tips:</strong> Read each question carefully, you can bookmark questions to review later, 
                    and don't worry about getting everything right - this helps us personalize your learning!
                  </Typography>
                </Alert>

                <div className="text-center">
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleStartAssessment}
                    className="btn-primary hover-lift px-12 py-4 text-lg"
                    startIcon={<AssessmentIcon />}
                  >
                    Start Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </div>
    );
  }

  // Results screen
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 py-8">
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="card-elevated">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-primary">
                  <CheckCircle className="text-white text-3xl" />
                </div>
                
                <Typography variant="h3" className="font-bold mb-4 text-gradient-primary">
                  Assessment Complete!
                </Typography>
                
                <Typography variant="h6" className="text-neutral-600 mb-8">
                  Great job! Here's your performance summary
                </Typography>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <Typography variant="h2" className="font-bold text-gradient-primary">
                      {results.overallScore}%
                    </Typography>
                    <Typography variant="body1" className="text-neutral-600">
                      Overall Score
                    </Typography>
                  </div>
                  
                  <div className="text-center">
                    <Typography variant="h2" className="font-bold text-gradient-secondary">
                      {results.correctAnswers}/{results.totalQuestions}
                    </Typography>
                    <Typography variant="body1" className="text-neutral-600">
                      Correct Answers
                    </Typography>
                  </div>
                  
                  <div className="text-center">
                    <Typography variant="h2" className="font-bold text-gradient-accent">
                      {formatTime(results.timeSpent)}
                    </Typography>
                    <Typography variant="body1" className="text-neutral-600">
                      Time Spent
                    </Typography>
                  </div>
                </div>

                <div className="mb-8">
                  <Typography variant="h6" className="font-semibold mb-4">
                    Subject-wise Performance
                  </Typography>
                  <div className="space-y-3">
                    {Object.entries(results.subjectScores).map(([subject, score]) => (
                      <div key={subject} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <Typography variant="body1" className="font-medium">
                          {subject}
                        </Typography>
                        <div className="flex items-center space-x-2">
                          <Typography variant="body1" className="font-semibold">
                            {score}%
                          </Typography>
                          <Chip
                            label={score >= 80 ? 'Strong' : score >= 60 ? 'Average' : 'Needs Focus'}
                            size="small"
                            className={
                              score >= 80 ? 'bg-green-100 text-green-800' :
                              score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/dashboard')}
                    className="btn-primary hover-lift"
                  >
                    View Dashboard
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/analytics')}
                    className="hover-lift"
                  >
                    Detailed Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </div>
    );
  }

  // Assessment in progress
  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50">
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
              <Typography variant="h6" className="font-semibold">
                Baseline Assessment
              </Typography>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Timer className="text-primary-500" />
                <Typography variant="h6" className="font-mono font-bold">
                  {formatTime(timeLeft)}
                </Typography>
              </div>
              
              <Button
                variant="contained"
                onClick={handleSubmitAssessment}
                className="btn-primary"
              >
                Submit Assessment
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container maxWidth="xl" className="py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <Card className="card-elevated sticky top-24">
              <CardContent className="p-4">
                <Typography variant="h6" className="font-semibold mb-4">
                  Questions
                </Typography>
                
                <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                  {questions.map((_, index) => {
                    const status = getQuestionStatus(index);
                    return (
                      <button
                        key={index}
                        onClick={() => handleQuestionNavigation(index)}
                        className={`w-10 h-10 rounded-lg font-semibold transition-all duration-200 hover:scale-105 ${getStatusColor(status)}`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Bookmarked</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-neutral-200 rounded"></div>
                    <span>Not Visited</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <Card className="card-elevated">
              <CardContent className="p-8">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <Typography variant="body2" className="text-neutral-600">
                      Question {currentQuestion + 1} of {questions.length}
                    </Typography>
                    <Typography variant="body2" className="text-neutral-600">
                      {Math.round(progress)}% Complete
                    </Typography>
                  </div>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    className="h-2 rounded-full"
                    sx={{
                      backgroundColor: 'rgba(29, 181, 132, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(135deg, #1DB584 0%, #16A085 100%)',
                        borderRadius: '4px'
                      }
                    }}
                  />
                </div>

                {/* Question Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Chip
                      label={currentQ.subject}
                      className="gradient-primary text-white"
                      sx={{ background: 'linear-gradient(135deg, #1DB584 0%, #16A085 100%)', color: 'white' }}
                    />
                    <Chip
                      label={currentQ.difficulty}
                      className={
                        currentQ.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        currentQ.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }
                    />
                  </div>
                  
                  <IconButton
                    onClick={() => handleBookmark(currentQ.id)}
                    className="hover-lift"
                  >
                    {bookmarkedQuestions.has(currentQ.id) ? 
                      <Bookmark className="text-yellow-500" /> : 
                      <BookmarkBorder />
                    }
                  </IconButton>
                </div>

                {/* Question */}
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Typography variant="h5" className="font-semibold mb-8 leading-relaxed">
                    {currentQ.question}
                  </Typography>

                  {/* Options */}
                  <FormControl component="fieldset" className="w-full">
                    <RadioGroup
                      value={answers[currentQ.id] ?? ''}
                      onChange={(e) => handleAnswerChange(currentQ.id, parseInt(e.target.value))}
                    >
                      {currentQ.options.map((option, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <FormControlLabel
                            value={index}
                            control={<Radio />}
                            label={
                              <Typography variant="body1" className="ml-2">
                                {option}
                              </Typography>
                            }
                            className="w-full p-4 m-1 rounded-xl border-2 border-transparent hover:border-primary-200 hover:bg-primary-50 transition-all duration-200"
                            sx={{
                              '&.Mui-checked': {
                                borderColor: '#1DB584',
                                backgroundColor: 'rgba(29, 181, 132, 0.05)'
                              }
                            }}
                          />
                        </motion.div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </motion.div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-12">
                  <Button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestion === 0}
                    startIcon={<NavigateBefore />}
                    className="hover-lift"
                  >
                    Previous
                  </Button>

                  <div className="flex space-x-3">
                    <Button
                      variant="outlined"
                      onClick={() => handleBookmark(currentQ.id)}
                      startIcon={bookmarkedQuestions.has(currentQ.id) ? <Bookmark /> : <Flag />}
                      className="hover-lift"
                    >
                      {bookmarkedQuestions.has(currentQ.id) ? 'Bookmarked' : 'Bookmark'}
                    </Button>

                    {currentQuestion === questions.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleSubmitAssessment}
                        className="btn-primary hover-lift"
                        endIcon={<CheckCircle />}
                      >
                        Submit Assessment
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNextQuestion}
                        variant="contained"
                        className="btn-primary hover-lift"
                        endIcon={<NavigateNext />}
                      >
                        Next
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Assessment;