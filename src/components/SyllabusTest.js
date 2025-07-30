import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  LinearProgress,
  Box,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  Timer,
  CheckCircle,
  Cancel,
  Quiz
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

const SyllabusTest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addAssessmentResult } = useUser();
  
  const { questions = [], syllabus = {}, testTitle = 'Syllabus Test' } = location.state || {};
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(questions.length * 60); // 1 minute per question
  const [showResults, setShowResults] = useState(false);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    if (questions.length === 0) {
      navigate('/syllabus-management');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questions.length, navigate]);

  const handleAnswerChange = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
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

  const calculateResults = () => {
    let correct = 0;
    const topicScores = {};
    
    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) correct++;
      
      const topic = question.topic || question.subject || 'General';
      if (!topicScores[topic]) {
        topicScores[topic] = { correct: 0, total: 0 };
      }
      topicScores[topic].total++;
      if (isCorrect) topicScores[topic].correct++;
    });

    const score = Math.round((correct / questions.length) * 100);
    const timeTaken = (questions.length * 60) - timeLeft;

    return {
      score,
      correct,
      total: questions.length,
      timeTaken,
      topicScores,
      answers,
      questions
    };
  };

  const handleSubmitTest = async () => {
    const results = calculateResults();
    setTestResults(results);
    setShowResults(true);

    // Save results to user context
    const testData = {
      id: Date.now(),
      type: 'Syllabus Test',
      subject: syllabus.subject,
      topic: syllabus.subject,
      score: results.score,
      totalQuestions: results.total,
      correctAnswers: results.correct,
      timeTaken: results.timeTaken,
      date: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      syllabus: syllabus.subject,
      branch: syllabus.branch,
      semester: syllabus.semester
    };

    try {
      await addAssessmentResult(testData);
    } catch (error) {
      console.error('Error saving test results:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (questions.length === 0) {
    return (
      <Container maxWidth="md" className="py-8">
        <Alert severity="error">
          No questions available. Please go back and try again.
        </Alert>
      </Container>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30">
        <Container maxWidth="md" className="py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="card-elevated">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <CheckCircle className="text-6xl text-green-500 mb-4" />
                  <Typography variant="h4" className="font-bold mb-2">
                    Test Completed!
                  </Typography>
                  <Typography variant="h6" className="text-neutral-600">
                    {testTitle}
                  </Typography>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <Typography variant="h3" className={`font-bold ${getScoreColor(testResults.score)}`}>
                      {testResults.score}%
                    </Typography>
                    <Typography variant="body2" className="text-neutral-600">
                      Overall Score
                    </Typography>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <Typography variant="h3" className="font-bold text-secondary-600">
                      {testResults.correct}/{testResults.total}
                    </Typography>
                    <Typography variant="body2" className="text-neutral-600">
                      Correct Answers
                    </Typography>
                  </div>
                  <div className="p-4 bg-accent-50 rounded-lg">
                    <Typography variant="h3" className="font-bold text-accent-600">
                      {formatTime(testResults.timeTaken)}
                    </Typography>
                    <Typography variant="body2" className="text-neutral-600">
                      Time Taken
                    </Typography>
                  </div>
                </div>

                <div className="mb-6">
                  <Typography variant="h6" className="font-semibold mb-3">
                    Topic-wise Performance
                  </Typography>
                  <div className="space-y-2">
                    {Object.entries(testResults.topicScores).map(([topic, scores]) => {
                      const percentage = Math.round((scores.correct / scores.total) * 100);
                      return (
                        <div key={topic} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                          <Typography variant="body1">{topic}</Typography>
                          <div className="flex items-center space-x-2">
                            <Typography variant="body2" className="text-neutral-600">
                              {scores.correct}/{scores.total}
                            </Typography>
                            <Chip
                              label={`${percentage}%`}
                              size="small"
                              className={percentage >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex space-x-4 justify-center">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/syllabus-management')}
                    startIcon={<ArrowBack />}
                  >
                    Back to Syllabus
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/analytics')}
                    className="btn-primary"
                  >
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30">
      <div className="glass-effect border-b border-white/20 sticky top-0 z-50">
        <Container maxWidth="xl">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Typography variant="h6" className="font-bold">
                {testTitle}
              </Typography>
              <Chip
                label={`Question ${currentQuestion + 1} of ${questions.length}`}
                className="bg-primary-100 text-primary-800"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Timer className="text-red-500" />
                <Typography variant="h6" className="font-bold text-red-500">
                  {formatTime(timeLeft)}
                </Typography>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container maxWidth="md" className="py-8">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="card-elevated mb-6">
            <CardContent className="p-6">
              <div className="mb-4">
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  className="h-2 rounded-full mb-2"
                />
                <Typography variant="caption" className="text-neutral-600">
                  Progress: {Math.round(progress)}%
                </Typography>
              </div>

              <Typography variant="h6" className="font-semibold mb-4">
                {currentQ.question}
              </Typography>

              <FormControl component="fieldset" className="w-full">
                <RadioGroup
                  value={answers[currentQuestion] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion, parseInt(e.target.value))}
                >
                  {currentQ.options.map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={index}
                      control={<Radio />}
                      label={option}
                      className="mb-2 p-3 border rounded-lg hover:bg-neutral-50"
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outlined"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            <div className="space-x-2">
              {currentQuestion === questions.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmitTest}
                  className="btn-primary"
                  startIcon={<CheckCircle />}
                >
                  Submit Test
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNextQuestion}
                  className="btn-primary"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default SyllabusTest;