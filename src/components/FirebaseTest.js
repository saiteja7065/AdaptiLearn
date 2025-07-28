import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  TextField, 
  Alert,
  CircularProgress 
} from '@mui/material';

const FirebaseTest = () => {
  const { user } = useAuth();
  const { 
    userProfile, 
    createProfile, 
    saveAssessmentResult, 
    saveMockTestResult, 
    loading 
  } = useUser();
  
  const [testResult, setTestResult] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  
  const handleCreateTestProfile = async () => {
    setTestLoading(true);
    try {
      const result = await createProfile({
        fullName: 'Test User',
        branch: 'cse',
        semester: 3,
        subjects: ['ds', 'algo', 'dbms'],
        goals: ['Improve problem solving', 'Better exam scores']
      });
      
      if (result.success) {
        setTestResult('✅ Profile created successfully!');
      } else {
        setTestResult(`❌ Profile creation failed: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
    }
    setTestLoading(false);
  };
  
  const handleTestAssessment = async () => {
    setTestLoading(true);
    try {
      const result = await saveAssessmentResult({
        type: 'quick-assessment',
        subject: 'Data Structures',
        score: 85,
        totalQuestions: 10,
        correctAnswers: 8,
        timeSpent: 300,
        subjectScores: {
          'Arrays': 90,
          'Linked Lists': 80,
          'Trees': 85
        }
      });
      
      if (result.success) {
        setTestResult('✅ Assessment result saved successfully!');
      } else {
        setTestResult(`❌ Assessment save failed: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
    }
    setTestLoading(false);
  };
  
  const handleTestMockTest = async () => {
    setTestLoading(true);
    try {
      const result = await saveMockTestResult({
        type: 'mock-test',
        testName: 'CSE Mock Test 1',
        subjects: ['Data Structures', 'Algorithms'],
        overallScore: 78,
        totalQuestions: 50,
        correctAnswers: 39,
        timeSpent: 3600,
        subjectScores: {
          'Data Structures': 82,
          'Algorithms': 74
        }
      });
      
      if (result.success) {
        setTestResult('✅ Mock test result saved successfully!');
      } else {
        setTestResult(`❌ Mock test save failed: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
    }
    setTestLoading(false);
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please log in to test Firebase integration
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🧪 Firebase Integration Test
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current User: {user.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            UID: {user.uid}
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Profile Status
          </Typography>
          {loading ? (
            <CircularProgress size={20} />
          ) : userProfile ? (
            <Box>
              <Typography variant="body1" color="success.main">
                ✅ Profile exists
              </Typography>
              <Typography variant="body2">
                Name: {userProfile.fullName}
              </Typography>
              <Typography variant="body2">
                Branch: {userProfile.branch}
              </Typography>
              <Typography variant="body2">
                Semester: {userProfile.semester}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1" color="warning.main">
              ⚠️ No profile found
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Firebase Operations
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleCreateTestProfile}
              disabled={testLoading}
            >
              Create Test Profile
            </Button>
            
            <Button 
              variant="contained" 
              onClick={handleTestAssessment}
              disabled={testLoading || !userProfile}
            >
              Save Test Assessment
            </Button>
            
            <Button 
              variant="contained" 
              onClick={handleTestMockTest}
              disabled={testLoading || !userProfile}
            >
              Save Test Mock Test
            </Button>
          </Box>
          
          {testLoading && <CircularProgress size={20} />}
          
          {testResult && (
            <Alert 
              severity={testResult.includes('✅') ? 'success' : 'error'}
              sx={{ mt: 2 }}
            >
              {testResult}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FirebaseTest;
