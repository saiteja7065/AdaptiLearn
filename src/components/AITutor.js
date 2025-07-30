import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Avatar,
  Chip,
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  School,
  Lightbulb,
  QuestionAnswer,
  Clear
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import apiService from '../services/apiService';

const AITutor = () => {
  const { user } = useAuth();
  const { userProfile } = useUser();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      message: 'Hello! I\'m your AI tutor. I can help you with concepts, answer questions, and provide explanations. What would you like to learn about today?',
      timestamp: new Date(),
      confidence: 1.0,
      sources: ['AI Tutor System']
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const context = {
        branch: userProfile?.branch?.code || userProfile?.branch || 'CSE',
        semester: userProfile?.semester?.value || userProfile?.semester || 1,
        subjects: userProfile?.selectedSubjects || []
      };

      const conversationHistory = messages.slice(-5).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.message
      }));

      const response = await apiService.chatWithTutor(
        inputMessage,
        context,
        conversationHistory
      );

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        message: response.message,
        timestamp: new Date(),
        confidence: response.confidence || 0.8,
        sources: response.sources || [],
        followUpQuestions: response.follow_up_questions || []
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        message: 'I apologize, but I\'m having trouble responding right now. Please try again.',
        timestamp: new Date(),
        confidence: 0.5,
        sources: []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleFollowUpClick = (question) => {
    setInputMessage(question);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'ai',
        message: 'Chat cleared! How can I help you today?',
        timestamp: new Date(),
        confidence: 1.0,
        sources: ['AI Tutor System']
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-50 to-secondary-50 py-8">
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <Card className="card-elevated mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                    <SmartToy className="text-white text-2xl" />
                  </div>
                  <div>
                    <Typography variant="h5" className="font-bold">
                      AI Tutor
                    </Typography>
                    <Typography variant="body2" className="text-neutral-600">
                      Get instant help with your studies
                    </Typography>
                  </div>
                </div>
                <IconButton onClick={clearChat} className="hover-lift">
                  <Clear />
                </IconButton>
              </div>
            </CardContent>
          </Card>

          {/* Chat Container */}
          <Card className="card-elevated">
            <CardContent className="p-0">
              {/* Messages Area */}
              <Box className="h-96 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-3 max-w-xs md:max-w-md ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar
                          className={`w-8 h-8 ${message.type === 'user' ? 'bg-secondary-500' : 'gradient-primary'}`}
                        >
                          {message.type === 'user' ? <Person /> : <SmartToy />}
                        </Avatar>
                        
                        <div className={`rounded-2xl p-4 ${message.type === 'user' 
                          ? 'bg-secondary-500 text-white' 
                          : 'bg-neutral-100 text-neutral-800'
                        }`}>
                          <Typography variant="body1" className="mb-2">
                            {message.message}
                          </Typography>
                          
                          {message.type === 'ai' && (
                            <>
                              {/* Confidence and Sources */}
                              <div className="flex flex-wrap gap-1 mb-2">
                                <Chip
                                  size="small"
                                  label={`${Math.round(message.confidence * 100)}% confident`}
                                  className="bg-green-100 text-green-800"
                                />
                                {message.sources?.slice(0, 2).map((source, index) => (
                                  <Chip
                                    key={index}
                                    size="small"
                                    label={source}
                                    variant="outlined"
                                    className="text-xs"
                                  />
                                ))}
                              </div>
                              
                              {/* Follow-up Questions */}
                              {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                                <div className="mt-3">
                                  <Typography variant="caption" className="text-neutral-600 mb-2 block">
                                    Follow-up questions:
                                  </Typography>
                                  <div className="space-y-1">
                                    {message.followUpQuestions.slice(0, 3).map((question, index) => (
                                      <Button
                                        key={index}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handleFollowUpClick(question)}
                                        className="text-xs mr-1 mb-1"
                                        startIcon={<QuestionAnswer />}
                                      >
                                        {question}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                          
                          <Typography variant="caption" className="text-neutral-500 block mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </Typography>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8 gradient-primary">
                        <SmartToy />
                      </Avatar>
                      <div className="bg-neutral-100 rounded-2xl p-4">
                        <div className="flex items-center space-x-2">
                          <CircularProgress size={16} />
                          <Typography variant="body2" className="text-neutral-600">
                            Thinking...
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </Box>

              <Divider />

              {/* Input Area */}
              <Box className="p-4">
                <div className="flex items-end space-x-3">
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder="Ask me anything about your studies..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        background: 'rgba(255, 255, 255, 0.9)',
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="btn-primary"
                    sx={{
                      minWidth: 56,
                      height: 56,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #1DB584 0%, #16A085 100%)',
                    }}
                  >
                    <Send />
                  </Button>
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<School />}
                    onClick={() => handleFollowUpClick('Explain the concept of algorithms')}
                    className="text-xs"
                  >
                    Algorithms
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Lightbulb />}
                    onClick={() => handleFollowUpClick('Help me understand data structures')}
                    className="text-xs"
                  >
                    Data Structures
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<QuestionAnswer />}
                    onClick={() => handleFollowUpClick('What should I study for my next exam?')}
                    className="text-xs"
                  >
                    Study Tips
                  </Button>
                </div>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
};

export default AITutor;