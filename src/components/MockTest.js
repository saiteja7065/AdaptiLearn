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
  Alert,
  Slider,
  FormGroup,
  Checkbox
} from '@mui/material';
import {
  ArrowBack,
  Timer,
  CheckCircle,
  Quiz,
  TrendingUp,
  NavigateNext,
  NavigateBefore,
  Settings,
  Psychology,
  Speed,
  GpsFixed
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const MockTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, saveMockTestResult, getPerformanceAnalytics } = useUser();
  
  const [showConfig, setShowConfig] = useState(true);
  const [testConfig, setTestConfig] = useState({
    duration: 60, // minutes
    questionCount: 20,
    subjects: [],
    difficulty: 'adaptive',
    focusWeakAreas: true
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600); // Will be set based on config
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [questions, setQuestions] = useState([]);

  // Mock adaptive questions based on user's weak areas
  const generateAdaptiveQuestions = () => {
    const analytics = getPerformanceAnalytics();
    const weakSubjects = analytics?.overallStats?.weakAreas || [];
    
    // Mock questions with adaptive selection
    const questionPool = [
      {
        id: 1,
        subject: 'Data Structures',
        difficulty: 'Medium',
        question: 'What is the space complexity of a recursive implementation of factorial?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
        correctAnswer: 1,
        explanation: 'Recursive factorial uses O(n) space due to the call stack storing n function calls.',
        adaptiveReason: 'Selected because Data Structures is identified as a weak area'
      },
      {
        id: 2,
        subject: 'Algorithms',
        difficulty: 'Hard',
        question: 'In dynamic programming, what is the principle of optimality?',
        options: [
          'Every subproblem must be solved optimally',
          'An optimal solution contains optimal solutions to subproblems',
          'All problems can be solved using recursion',
          'Greedy approach always works'
        ],
        correctAnswer: 1,
        explanation: 'The principle of optimality states that an optimal solution to a problem contains optimal solutions to its subproblems.',
        adaptiveReason: 'Challenging question to test advanced understanding'
      },
      {
        id: 3,
        subject: 'Database Systems',
        difficulty: 'Easy',
        question: 'Which normal form eliminates partial dependencies?',
        options: ['1NF', '2NF', '3NF', 'BCNF'],
        correctAnswer: 1,
        explanation: '2NF (Second Normal Form) eliminates partial dependencies on the primary key.',
        adaptiveReason: 'Foundational concept review'
      },
      {
        id: 4,
        subject: 'Operating Systems',
        difficulty: 'Medium',
        question: 'What is the main advantage of using threads over processes?',
        options: [
          'Better security',
          'Lower overhead for creation and context switching',
          'More memory usage',
          'Independent memory spaces'
        ],
        correctAnswer: 1,
        explanation: 'Threads have lower overhead because they share memory space and resources within a process.',
        adaptiveReason: 'Testing understanding of process vs thread concepts'
      },
      {
        id: 5,
        subject: 'Data Structures',
        difficulty: 'Hard',
        question: 'In a Red-Black tree, what is the maximum height in terms of the number of nodes n?',
        options: ['log n', '2 log n', '2 log(n+1)', 'n'],
        correctAnswer: 2,
        explanation: 'The maximum height of a Red-Black tree is 2 log(n+1) due to the red-black properties.',
        adaptiveReason: 'Advanced data structure concept for deeper understanding'
      }
    ];

    // Adaptive selection logic
    let selectedQuestions = [];
    
    if (testConfig.focusWeakAreas && weakSubjects.length > 0) {
      // 60% questions from weak areas
      const weakAreaQuestions = questionPool.filter(q => 
        weakSubjects.some(weak => weak.subject === q.subject)
      );
      const weakCount = Math.floor(testConfig.questionCount * 0.6);
      selectedQuestions = [...weakAreaQuestions.slice(0, weakCount)];
      
      // 40% mixed questions
      const remainingQuestions = questionPool.filter(q => 
        !selectedQuestions.includes(q)
      );
      const mixedCount = testConfig.questionCount - selectedQuestions.length;
      selectedQuestions = [...selectedQuestions, ...remainingQuestions.slice(0, mixedCount)];
    } else {
      // Random selection if no weak areas identified
      selectedQuestions = questionPool.slice(0, testConfig.questionCount);
    }

    return selectedQuestions.slice(0, testConfig.questionCount);
  };

  // Define calculateResults with useCallback to prevent dependency issues
  const calculateResults = useCallback(() => {
    let correct = 0;
    let subjectScores = {};
    let difficultyScores = { Easy: { correct: 0, total: 0 }, Medium: { correct: 0, total: 0 }, Hard: { correct: 0, total: 0 } };
    
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

      // Difficulty-wise scoring
      difficultyScores[question.difficulty].total++;
      if (isCorrect) difficultyScores[question.difficulty].correct++;
    });

    // Convert to percentages
    Object.keys(subjectScores).forEach(subject => {
      const score = subjectScores[subject];
      subjectScores[subject] = Math.round((score.correct / score.total) * 100);
    });

    Object.keys(difficultyScores).forEach(difficulty => {
      const score = difficultyScores[difficulty];
      if (score.total > 0) {
        difficultyScores[difficulty].percentage = Math.round((score.correct / score.total) * 100);
      }
    });

    const overallScore = Math.round((correct / questions.length) * 100);
    
    return {
      overallScore,
      correctAnswers: correct,
      totalQuestions: questions.length,
      subjectScores,
      difficultyScores,
      timeSpent: (testConfig.duration * 60) - timeLeft,
      completedAt: new Date().toISOString(),
      adaptiveInsights: generateAdaptiveInsights(subjectScores, difficultyScores)
    };
  }, [questions, answers, testConfig.duration, timeLeft, generateAdaptiveInsights]);

  const generateAdaptiveInsights = useCallback((subjectScores, difficultyScores) => {
    const insights = [];
    
    // Subject insights
    Object.entries(subjectScores).forEach(([subject, score]) => {
      if (score < 60) {
        insights.push({
          type: 'weakness',
          message: `${subject}: Needs significant improvement (${score}%)`,
          recommendation: `Focus on fundamental concepts in ${subject}`
        });
      } else if (score >= 80) {
        insights.push({
          type: 'strength',
          message: `${subject}: Strong performance (${score}%)`,
          recommendation: `Consider advanced topics in ${subject}`
        });
      }
    });

    // Difficulty insights
    if (difficultyScores.Easy.percentage < 80) {
      insights.push({
        type: 'concern',
        message: 'Struggling with basic concepts',
        recommendation: 'Review fundamental topics before attempting advanced questions'
      });
    }

    if (difficultyScores.Hard.percentage > 70) {
      insights.push({
        type: 'achievement',
        message: 'Excellent performance on challenging questions',
        recommendation: 'Ready for advanced practice and competitive exams'
      });
    }

    return insights;
  }, []);

  // Define handleSubmitTest before it's used in useEffect
  const handleSubmitTest = useCallback(async () => {
    const testResults = calculateResults();
    setResults(testResults);
    setIsCompleted(true);
    setShowResults(true);
    
    // Save results
    await saveMockTestResult({
      type: 'adaptive_mock_test',
      config: testConfig,
      ...testResults,
      questions: questions.map(q => ({
        id: q.id,
        subject: q.subject,
        difficulty: q.difficulty,
        userAnswer: answers[q.id],
        correctAnswer: q.correctAnswer,
        isCorrect: answers[q.id] === q.correctAnswer,
        adaptiveReason: q.adaptiveReason
      }))
    });
  }, [calculateResults, saveMockTestResult, testConfig, questions, answers]);

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
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted, isCompleted, timeLeft, handleSubmitTest]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfigChange = (field, value) => {
    setTestConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubjectToggle = (subject) => {
    setTestConfig(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleStartTest = () => {
    const generatedQuestions = generateAdaptiveQuestions();
    setQuestions(generatedQuestions);
    setTimeLeft(testConfig.duration * 60);
    setShowConfig(false);
    setIsStarted(true);
  };

  const handleAnswerChange = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
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

  // Configuration screen
  if (showConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-neutral-50 to-primary-50 py-8">
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
              <Typography variant="h4" className="font-bold text-gradient-secondary">
                Adaptive Mock Test
              </Typography>
            </div>

            <Card className="card-elevated">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-secondary">
                    <Quiz className="text-white text-3xl" />
                  </div>
                  <Typography variant="h4" className="font-bold mb-4">
                    Customize Your Test
                  </Typography>
                  <Typography variant="h6" className="text-neutral-600 mb-6">
                    AI will adapt questions based on your performance and preferences
                  </Typography>
                </div>

                <div className="space-y-8">
                  {/* Duration */}
                  <div>
                    <Typography variant="h6" className="font-semibold mb-4 flex items-center">
                      <Timer className="mr-2 text-primary-500" />
                      Test Duration: {testConfig.duration} minutes
                    </Typography>
                    <Slider
                      value={testConfig.duration}
                      onChange={(e, value) => handleConfigChange('duration', value)}
                      min={15}
                      max={120}
                      step={15}
                      marks={[
                        { value: 15, label: '15m' },
                        { value: 30, label: '30m' },
                        { value: 60, label: '1h' },
                        { value: 120, label: '2h' }
                      ]}
                      className="mt-4"
                      sx={{
                        '& .MuiSlider-thumb': {
                          background: 'linear-gradient(135deg, #6B73C1 0%, #5A67D8 100%)',
                        },
                        '& .MuiSlider-track': {
                          background: 'linear-gradient(135deg, #6B73C1 0%, #5A67D8 100%)',
                        }
                      }}
                    />
                  </div>

                  {/* Question Count */}
                  <div>
                    <Typography variant="h6" className="font-semibold mb-4 flex items-center">
                      <Psychology className="mr-2 text-secondary-500" />
                      Number of Questions: {testConfig.questionCount}
                    </Typography>
                    <Slider
                      value={testConfig.questionCount}
                      onChange={(e, value) => handleConfigChange('questionCount', value)}
                      min={10}
                      max={50}
                      step={5}
                      marks={[
                        { value: 10, label: '10' },
                        { value: 20, label: '20' },
                        { value: 30, label: '30' },
                        { value: 50, label: '50' }
                      ]}
                      className="mt-4"
                      sx={{
                        '& .MuiSlider-thumb': {
                          background: 'linear-gradient(135deg, #6B73C1 0%, #5A67D8 100%)',
                        },
                        '& .MuiSlider-track': {
                          background: 'linear-gradient(135deg, #6B73C1 0%, #5A67D8 100%)',
                        }
                      }}
                    />
                  </div>

                  {/* Adaptive Options */}
                  <div>
                    <Typography variant="h6" className="font-semibold mb-4 flex items-center">
                      <GpsFixed className="mr-2 text-accent-500" />
                      Adaptive Settings
                    </Typography>
                    
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={testConfig.focusWeakAreas}
                            onChange={(e) => handleConfigChange('focusWeakAreas', e.target.checked)}
                            sx={{
                              '&.Mui-checked': {
                                color: '#6B73C1',
                              }
                            }}
                          />
                        }
                        label="Focus 60% questions on weak areas (Recommended)"
                      />
                    </FormGroup>

                    <Alert severity="info" className="mt-4 rounded-xl">
                      <Typography variant="body2">
                        <strong>AI Adaptation:</strong> Questions will be selected based on your previous 
                        performance to maximize learning efficiency. Weak areas get more focus while 
                        maintaining overall curriculum coverage.
                      </Typography>
                    </Alert>
                  </div>

                  {/* Subject Selection */}
                  <div>
                    <Typography variant="h6" className="font-semibold mb-4">
                      Focus Subjects (Optional)
                    </Typography>
                    <Typography variant="body2" className="text-neutral-600 mb-4">
                      Leave empty to include all your subjects, or select specific ones to focus on
                    </Typography>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {userProfile.subjects?.map((subject) => (
                        <motion.div
                          key={subject.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all duration-300 ${
                              testConfig.subjects.includes(subject.id)
                                ? 'ring-2 ring-secondary-500 shadow-glow-secondary'
                                : 'hover:shadow-medium'
                            }`}
                            onClick={() => handleSubjectToggle(subject.id)}
                          >
                            <CardContent className="p-3 text-center">
                              <Typography variant="body2" className="font-medium">
                                {subject.code}
                              </Typography>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-center mt-8">
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleStartTest}
                    className="btn-secondary hover-lift px-12 py-4 text-lg"
                    startIcon={<Quiz />}
                    sx={{
                      background: 'linear-gradient(135deg, #6B73C1 0%, #5A67D8 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5A67D8 0%, #4C5BC7 100%)',
                      }
                    }}
                  >
                    Start Adaptive Test
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
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-neutral-50 to-primary-50 py-8">
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="card-elevated">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 gradient-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-secondary">
                    <CheckCircle className="text-white text-3xl" />
                  </div>
                  
                  <Typography variant="h3" className="font-bold mb-4 text-gradient-secondary">
                    Test Complete!
                  </Typography>
                  
                  <Typography variant="h6" className="text-neutral-600 mb-8">
                    Here's your adaptive test performance analysis
                  </Typography>
                </div>

                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  <div className="text-center">
                    <Typography variant="h2" className="font-bold text-gradient-secondary">
                      {results.overallScore}%
                    </Typography>
                    <Typography variant="body1" className="text-neutral-600">
                      Overall Score
                    </Typography>
                  </div>
                  
                  <div className="text-center">
                    <Typography variant="h2" className="font-bold text-gradient-primary">
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

                  <div className="text-center">
                    <Typography variant="h2" className="font-bold" style={{ color: '#FF6B6B' }}>
                      {results.adaptiveInsights.length}
                    </Typography>
                    <Typography variant="body1" className="text-neutral-600">
                      AI Insights
                    </Typography>
                  </div>
                </div>

                {/* Adaptive Insights */}
                <div className="mb-8">
                  <Typography variant="h5" className="font-semibold mb-4 flex items-center">
                    <Psychology className="mr-2 text-secondary-500" />
                    AI-Powered Insights
                  </Typography>
                  <div className="grid md:grid-cols-2 gap-4">
                    {results.adaptiveInsights.map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Card className={`p-4 ${
                          insight.type === 'strength' ? 'bg-green-50 border-green-200' :
                          insight.type === 'weakness' ? 'bg-red-50 border-red-200' :
                          insight.type === 'achievement' ? 'bg-blue-50 border-blue-200' :
                          'bg-yellow-50 border-yellow-200'
                        }`}>
                          <Typography variant="body1" className="font-medium mb-2">
                            {insight.message}
                          </Typography>
                          <Typography variant="body2" className="text-neutral-600">
                            💡 {insight.recommendation}
                          </Typography>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Performance Breakdown */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Subject Performance */}
                  <div>
                    <Typography variant="h6" className="font-semibold mb-4">
                      Subject Performance
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
                              label={score >= 80 ? 'Strong' : score >= 60 ? 'Average' : 'Focus'}
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

                  {/* Difficulty Analysis */}
                  <div>
                    <Typography variant="h6" className="font-semibold mb-4">
                      Difficulty Analysis
                    </Typography>
                    <div className="space-y-3">
                      {Object.entries(results.difficultyScores).map(([difficulty, data]) => (
                        data.total > 0 && (
                          <div key={difficulty} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                            <div>
                              <Typography variant="body1" className="font-medium">
                                {difficulty} Questions
                              </Typography>
                              <Typography variant="body2" className="text-neutral-600">
                                {data.correct}/{data.total} correct
                              </Typography>
                            </div>
                            <Typography variant="h6" className="font-bold text-gradient-secondary">
                              {data.percentage}%
                            </Typography>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/dashboard')}
                    className="btn-secondary hover-lift"
                    sx={{
                      background: 'linear-gradient(135deg, #6B73C1 0%, #5A67D8 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5A67D8 0%, #4C5BC7 100%)',
                      }
                    }}
                  >
                    Back to Dashboard
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/analytics')}
                    className="hover-lift"
                  >
                    Detailed Analytics
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => {
                      setShowConfig(true);
                      setShowResults(false);
                      setIsCompleted(false);
                      setIsStarted(false);
                      setCurrentQuestion(0);
                      setAnswers({});
                    }}
                    className="hover-lift"
                  >
                    Take Another Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </div>
    );
  }

  // Test in progress
  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-neutral-50 to-primary-50">
      {/* Header */}
      <div className="glass-effect border-b border-white/20 sticky top-0 z-50">
        <Container maxWidth="xl">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Typography variant="h6" className="font-semibold">
                Adaptive Mock Test
              </Typography>
              <Chip
                icon={<Speed />}
                label="AI Adaptive"
                className="gradient-secondary text-white"
                sx={{ background: 'linear-gradient(135deg, #6B73C1 0%, #5A67D8 100%)', color: 'white' }}
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Timer className="text-secondary-500" />
                <Typography variant="h6" className="font-mono font-bold">
                  {formatTime(timeLeft)}
                </Typography>
              </div>
              
              <Button
                variant="contained"
                onClick={handleSubmitTest}
                className="btn-secondary"
                sx={{
                  background: 'linear-gradient(135deg, #6B73C1 0%, #5A67D8 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5A67D8 0%, #4C5BC7 100%)',
                  }
                }}
              >
                Submit Test
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
                  Progress
                </Typography>
                
                <div className="mb-4">
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    className="h-3 rounded-full"
                    sx={{
                      backgroundColor: 'rgba(107, 115, 193, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(135deg, #6B73C1 0%, #5A67D8 100%)',
                        borderRadius: '6px'
                      }
                    }}
                  />
                  <Typography variant="body2" className="text-center mt-2">
                    {currentQuestion + 1} of {questions.length}
                  </Typography>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => {
                    const isAnswered = answers[questions[index].id] !== undefined;
                    const isCurrent = index === currentQuestion;
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestion(index)}
                        className={`w-8 h-8 rounded-lg font-semibold transition-all duration-200 hover:scale-105 ${
                          isCurrent ? 'bg-secondary-500 text-white' :
                          isAnswered ? 'bg-green-500 text-white' :
                          'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <Card className="card-elevated">
              <CardContent className="p-8">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Chip
                      label={currentQ.subject}
                      className="gradient-secondary text-white"
                      sx={{ background: 'linear-gradient(135deg, #6B73C1 0%, #5A67D8 100%)', color: 'white' }}
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
                  
                  <Chip
                    icon={<Psychology />}
                    label="AI Selected"
                    size="small"
                    className="bg-purple-100 text-purple-800"
                  />
                </div>

                {/* Adaptive Reason */}
                {currentQ.adaptiveReason && (
                  <Alert severity="info" className="mb-6 rounded-xl">
                    <Typography variant="body2">
                      <strong>Why this question?</strong> {currentQ.adaptiveReason}
                    </Typography>
                  </Alert>
                )}

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
                            className="w-full p-4 m-1 rounded-xl border-2 border-transparent hover:border-secondary-200 hover:bg-secondary-50 transition-all duration-200"
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

                  {currentQuestion === questions.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleSubmitTest}
                      className="btn-secondary hover-lift"
                      endIcon={<CheckCircle />}
                      sx={{
                        background: 'linear-gradient(135deg, #6B73C1 0%, #5A67D8 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5A67D8 0%, #4C5BC7 100%)',
                        }
                      }}
                    >
                      Submit Test
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuestion}
                      variant="contained"
                      className="btn-secondary hover-lift"
                      endIcon={<NavigateNext />}
                      sx={{
                        background: 'linear-gradient(135deg, #6B73C1 0%, #5A67D8 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5A67D8 0%, #4C5BC7 100%)',
                        }
                      }}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default MockTest;