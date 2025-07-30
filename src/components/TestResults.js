import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Box,
  IconButton,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  ExpandMore,
  CheckCircle,
  Cancel,
  Lightbulb,
  School,
  Quiz,
  TrendingUp
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const TestResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { testData, questions, userAnswers, score } = location.state || {};

  const [expandedPanel, setExpandedPanel] = useState(false);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const getAnswerStatus = (questionIndex, userAnswer, correctAnswer) => {
    return userAnswer === correctAnswer ? 'correct' : 'incorrect';
  };

  const getExplanation = (question, userAnswer, correctAnswer) => {
    const isCorrect = userAnswer === correctAnswer;
    
    // Mock explanations based on question content
    const explanations = {
      correct: [
        "Excellent! Your understanding of this concept is solid.",
        "Perfect! You've grasped the fundamental principle correctly.",
        "Great job! Your reasoning aligns with the correct approach.",
        "Well done! You've applied the concept accurately."
      ],
      incorrect: [
        "The correct approach involves understanding the core principle first.",
        "This concept requires careful analysis of the given conditions.",
        "Remember to consider all aspects of the problem before selecting an answer.",
        "Review the fundamental concepts related to this topic for better understanding."
      ]
    };

    const randomExplanation = explanations[isCorrect ? 'correct' : 'incorrect'][
      Math.floor(Math.random() * explanations[isCorrect ? 'correct' : 'incorrect'].length)
    ];

    return {
      explanation: randomExplanation,
      detailedSolution: isCorrect 
        ? "Your solution demonstrates a clear understanding of the concept. Continue practicing similar problems to reinforce your knowledge."
        : `The correct answer is "${question.options[correctAnswer]}". ${randomExplanation} Focus on reviewing the related theory and practice more problems in this area.`,
      tips: isCorrect 
        ? ["Keep up the good work!", "Try more challenging problems in this area"]
        : ["Review the basic concepts", "Practice similar problems", "Seek additional resources if needed"]
    };
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return "Excellent Performance!";
    if (score >= 60) return "Good Job!";
    return "Keep Practicing!";
  };

  if (!testData || !questions) {
    return (
      <Container maxWidth="md" className="py-8">
        <Typography variant="h6">No test data available</Typography>
        <Button onClick={() => navigate('/dashboard')} startIcon={<ArrowBack />}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30">
      <div className="glass-effect border-b border-white/20 sticky top-0 z-50">
        <Container maxWidth="xl">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <IconButton onClick={() => navigate('/dashboard')} className="hover-lift">
                <ArrowBack />
              </IconButton>
              <div>
                <Typography variant="h5" className="font-bold">
                  Test Results & Solutions
                </Typography>
                <Typography variant="body2" className="text-neutral-600">
                  Detailed analysis with explanations
                </Typography>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container maxWidth="lg" className="py-8">
        {/* Score Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Card className="card-elevated">
            <CardContent className="p-8 text-center">
              <Typography variant="h4" className="font-bold mb-2">
                {getScoreMessage(score)}
              </Typography>
              <Typography variant="h2" className={`font-bold mb-4 ${getScoreColor(score)}`}>
                {score}%
              </Typography>
              <Typography variant="body1" className="text-neutral-600 mb-4">
                You answered {questions.filter((_, i) => userAnswers[i] === questions[i].correctAnswer).length} out of {questions.length} questions correctly
              </Typography>
              <div className="flex justify-center space-x-4">
                <Chip
                  icon={<CheckCircle />}
                  label={`${questions.filter((_, i) => userAnswers[i] === questions[i].correctAnswer).length} Correct`}
                  className="bg-green-100 text-green-800"
                />
                <Chip
                  icon={<Cancel />}
                  label={`${questions.filter((_, i) => userAnswers[i] !== questions[i].correctAnswer).length} Incorrect`}
                  className="bg-red-100 text-red-800"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Question-wise Solutions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Typography variant="h5" className="font-semibold mb-6">
            Question-wise Solutions
          </Typography>
          
          <div className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = userAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              const solution = getExplanation(question, userAnswer, question.correctAnswer);
              
              return (
                <Accordion
                  key={index}
                  expanded={expandedPanel === `panel${index}`}
                  onChange={handleAccordionChange(`panel${index}`)}
                  className="card-elevated"
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    className="hover:bg-neutral-50"
                  >
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center space-x-3">
                        {isCorrect ? (
                          <CheckCircle className="text-green-500" />
                        ) : (
                          <Cancel className="text-red-500" />
                        )}
                        <Typography variant="body1" className="font-medium">
                          Question {index + 1}
                        </Typography>
                      </div>
                      <Chip
                        label={isCorrect ? 'Correct' : 'Incorrect'}
                        size="small"
                        className={isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      />
                    </div>
                  </AccordionSummary>
                  
                  <AccordionDetails className="pt-0">
                    <div className="space-y-4">
                      {/* Question */}
                      <Box className="p-4 bg-neutral-50 rounded-lg">
                        <Typography variant="body1" className="font-medium mb-3">
                          {question.question}
                        </Typography>
                        
                        {/* Options */}
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-lg border ${
                                optionIndex === question.correctAnswer
                                  ? 'bg-green-50 border-green-300 text-green-800'
                                  : optionIndex === userAnswer && !isCorrect
                                  ? 'bg-red-50 border-red-300 text-red-800'
                                  : 'bg-white border-neutral-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <Typography variant="body2">
                                  {String.fromCharCode(65 + optionIndex)}. {option}
                                </Typography>
                                {optionIndex === question.correctAnswer && (
                                  <Chip label="Correct Answer" size="small" className="bg-green-100 text-green-800" />
                                )}
                                {optionIndex === userAnswer && !isCorrect && (
                                  <Chip label="Your Answer" size="small" className="bg-red-100 text-red-800" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Box>

                      <Divider />

                      {/* Solution & Explanation */}
                      <Box className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Lightbulb className="text-blue-600 mr-2" />
                          <Typography variant="h6" className="font-semibold text-blue-800">
                            Solution & Explanation
                          </Typography>
                        </div>
                        
                        <Typography variant="body1" className="mb-3 text-blue-700">
                          {solution.detailedSolution}
                        </Typography>
                        
                        <Typography variant="body2" className="text-blue-600">
                          {solution.explanation}
                        </Typography>
                      </Box>

                      {/* Tips for Improvement */}
                      {!isCorrect && (
                        <Box className="p-4 bg-orange-50 rounded-lg">
                          <div className="flex items-center mb-3">
                            <School className="text-orange-600 mr-2" />
                            <Typography variant="h6" className="font-semibold text-orange-800">
                              Tips for Improvement
                            </Typography>
                          </div>
                          
                          <ul className="space-y-1">
                            {solution.tips.map((tip, tipIndex) => (
                              <li key={tipIndex} className="text-orange-700">
                                <Typography variant="body2">• {tip}</Typography>
                              </li>
                            ))}
                          </ul>
                        </Box>
                      )}
                    </div>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex justify-center space-x-4"
        >
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
            startIcon={<ArrowBack />}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/mock-test')}
            startIcon={<Quiz />}
            className="btn-primary"
          >
            Take Another Test
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/analytics')}
            startIcon={<TrendingUp />}
            className="btn-secondary"
          >
            View Analytics
          </Button>
        </motion.div>
      </Container>
    </div>
  );
};

export default TestResults;