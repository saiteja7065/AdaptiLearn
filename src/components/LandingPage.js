import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  Fade,
  Slide
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Assessment,
  PersonalVideo,
  Speed,
  EmojiObjects,
  ArrowForward,
  PlayArrow
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Psychology className="text-4xl" />,
      title: "AI-Powered Analysis",
      description: "Advanced algorithms analyze your performance patterns to identify strengths and weaknesses with 90% accuracy.",
      gradient: "gradient-primary"
    },
    {
      icon: <TrendingUp className="text-4xl" />,
      title: "Adaptive Learning",
      description: "Dynamic difficulty adjustment ensures optimal challenge levels, focusing 60% on weak areas for maximum improvement.",
      gradient: "gradient-secondary"
    },
    {
      icon: <Assessment className="text-4xl" />,
      title: "Smart Assessments",
      description: "Personalized mock tests that adapt in real-time, providing targeted practice for B.Tech curriculum.",
      gradient: "gradient-accent"
    },
    {
      icon: <PersonalVideo className="text-4xl" />,
      title: "Instant Feedback",
      description: "Detailed explanations and study recommendations after every question to accelerate your learning.",
      gradient: "gradient-primary"
    }
  ];

  const stats = [
    { number: "90%", label: "Accuracy in identifying weak areas" },
    { number: "60%", label: "Focus on improvement areas" },
    { number: "3", label: "Clicks to access any feature" },
    { number: "2s", label: "Average page load time" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-primary-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-white/20">
        <Container maxWidth="lg">
          <div className="flex items-center justify-between py-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center space-x-2"
            >
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <EmojiObjects className="text-white text-xl" />
              </div>
              <Typography variant="h5" className="font-bold text-gradient-primary">
                AdaptiLearn
              </Typography>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Button
                variant="contained"
                onClick={() => navigate('/auth')}
                className="btn-primary hover-lift"
                endIcon={<ArrowForward />}
              >
                Get Started
              </Button>
            </motion.div>
          </div>
        </Container>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant="h1"
                  className="text-6xl font-extrabold mb-6 leading-tight"
                  sx={{ 
                    background: 'linear-gradient(135deg, #1DB584 0%, #6B73C1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Transform Your
                  <br />
                  Exam Preparation
                </Typography>
                
                <Typography
                  variant="h5"
                  className="text-neutral-700 mb-8 leading-relaxed"
                >
                  AI-powered adaptive learning that identifies your weaknesses and creates 
                  personalized study paths for B.Tech success. Stop wasting time on what you 
                  already know.
                </Typography>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/auth')}
                    className="btn-primary hover-lift px-8 py-4 text-lg"
                    endIcon={<ArrowForward />}
                  >
                    Start Learning Now
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    className="border-2 border-primary-500 text-primary-600 hover:bg-primary-50 px-8 py-4 text-lg"
                    startIcon={<PlayArrow />}
                  >
                    Watch Demo
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                      className="text-center"
                    >
                      <Typography variant="h4" className="font-bold text-gradient-primary">
                        {stat.number}
                      </Typography>
                      <Typography variant="body2" className="text-neutral-600">
                        {stat.label}
                      </Typography>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative"
              >
                {/* Hero Illustration */}
                <div className="relative">
                  <div className="card-glass p-8 hover-lift animate-float">
                    <div className="gradient-primary rounded-2xl p-6 mb-6">
                      <Typography variant="h6" className="text-white font-semibold mb-2">
                        Performance Analysis
                      </Typography>
                      <div className="bg-white/20 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white/80 text-sm">Data Structures</span>
                          <span className="text-white font-semibold">85%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div className="bg-white h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="gradient-secondary rounded-2xl p-6">
                      <Typography variant="h6" className="text-white font-semibold mb-2">
                        Adaptive Recommendations
                      </Typography>
                      <div className="space-y-2">
                        <div className="bg-white/20 rounded-lg p-3">
                          <Typography variant="body2" className="text-white">
                            Focus on AVL Trees - 3 practice tests recommended
                          </Typography>
                        </div>
                        <div className="bg-white/20 rounded-lg p-3">
                          <Typography variant="body2" className="text-white">
                            Review Graph Algorithms - Study plan created
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <motion.div
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -top-4 -right-4 w-16 h-16 gradient-accent rounded-full flex items-center justify-center shadow-glow-primary"
                  >
                    <Psychology className="text-white text-2xl" />
                  </motion.div>
                  
                  <motion.div
                    animate={{ y: [10, -10, 10] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                    className="absolute -bottom-4 -left-4 w-12 h-12 gradient-secondary rounded-full flex items-center justify-center shadow-glow-secondary"
                  >
                    <TrendingUp className="text-white text-lg" />
                  </motion.div>
                </div>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-r from-neutral-50 to-primary-50/30">
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Typography variant="h2" className="font-bold mb-4 text-gradient-primary">
              Why Choose AdaptiLearn?
            </Typography>
            <Typography variant="h6" className="text-neutral-600 max-w-2xl mx-auto">
              Experience the future of personalized learning with our AI-powered platform 
              designed specifically for B.Tech students.
            </Typography>
          </motion.div>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="card-elevated hover-lift h-full">
                    <CardContent className="p-8">
                      <div className={`w-16 h-16 ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-glow-primary`}>
                        <div className="text-white">
                          {feature.icon}
                        </div>
                      </div>
                      
                      <Typography variant="h5" className="font-semibold mb-4">
                        {feature.title}
                      </Typography>
                      
                      <Typography variant="body1" className="text-neutral-600 leading-relaxed">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <Container maxWidth="lg" className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center text-white"
          >
            <Typography variant="h2" className="font-bold mb-6">
              Ready to Transform Your Learning?
            </Typography>
            
            <Typography variant="h6" className="mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of B.Tech students who have already improved their exam 
              performance with our AI-powered adaptive learning platform.
            </Typography>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/auth')}
                className="bg-white text-primary-600 hover:bg-neutral-100 px-8 py-4 text-lg font-semibold hover-lift"
                endIcon={<ArrowForward />}
              >
                Start Your Journey
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </Container>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border border-white rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 border border-white rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 border border-white rounded-full"></div>
          <div className="absolute bottom-40 right-1/3 w-20 h-20 border border-white rounded-full"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-neutral-900 text-white">
        <Container maxWidth="lg">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <EmojiObjects className="text-white text-sm" />
              </div>
              <Typography variant="h6" className="font-bold">
                AdaptiLearn
              </Typography>
            </div>
            
            <Typography variant="body2" className="text-neutral-400">
              © 2024 AdaptiLearn. Transforming B.Tech education with AI.
            </Typography>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;