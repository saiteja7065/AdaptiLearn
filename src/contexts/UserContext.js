import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [mockTestResults, setMockTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Available branches and subjects
  const branches = [
    { id: 'cse', name: 'Computer Science Engineering', code: 'CSE' },
    { id: 'ece', name: 'Electronics and Communication Engineering', code: 'ECE' },
    { id: 'mech', name: 'Mechanical Engineering', code: 'MECH' },
    { id: 'civil', name: 'Civil Engineering', code: 'CIVIL' },
    { id: 'eee', name: 'Electrical and Electronics Engineering', code: 'EEE' },
    { id: 'it', name: 'Information Technology', code: 'IT' },
    { id: 'chem', name: 'Chemical Engineering', code: 'CHEM' },
    { id: 'aero', name: 'Aeronautical Engineering', code: 'AERO' }
  ];

  const subjectsByBranch = {
    cse: [
      { id: 'ds', name: 'Data Structures', code: 'DS' },
      { id: 'algo', name: 'Algorithms', code: 'ALGO' },
      { id: 'dbms', name: 'Database Management Systems', code: 'DBMS' },
      { id: 'os', name: 'Operating Systems', code: 'OS' },
      { id: 'cn', name: 'Computer Networks', code: 'CN' },
      { id: 'se', name: 'Software Engineering', code: 'SE' },
      { id: 'oops', name: 'Object Oriented Programming', code: 'OOPS' },
      { id: 'web', name: 'Web Technologies', code: 'WEB' }
    ],
    ece: [
      { id: 'signals', name: 'Signals and Systems', code: 'SS' },
      { id: 'comm', name: 'Communication Systems', code: 'COMM' },
      { id: 'dsp', name: 'Digital Signal Processing', code: 'DSP' },
      { id: 'vlsi', name: 'VLSI Design', code: 'VLSI' },
      { id: 'embedded', name: 'Embedded Systems', code: 'ES' },
      { id: 'microwave', name: 'Microwave Engineering', code: 'MW' }
    ],
    mech: [
      { id: 'thermo', name: 'Thermodynamics', code: 'THERMO' },
      { id: 'fluid', name: 'Fluid Mechanics', code: 'FM' },
      { id: 'som', name: 'Strength of Materials', code: 'SOM' },
      { id: 'manufacturing', name: 'Manufacturing Processes', code: 'MP' },
      { id: 'design', name: 'Machine Design', code: 'MD' },
      { id: 'heat', name: 'Heat Transfer', code: 'HT' }
    ],
    // Add more subjects for other branches as needed
  };

  const semesters = [
    { id: 1, name: '1st Semester' },
    { id: 2, name: '2nd Semester' },
    { id: 3, name: '3rd Semester' },
    { id: 4, name: '4th Semester' },
    { id: 5, name: '5th Semester' },
    { id: 6, name: '6th Semester' },
    { id: 7, name: '7th Semester' },
    { id: 8, name: '8th Semester' }
  ];

  // Create or update user profile
  const createProfile = async (profileData) => {
    try {
      setLoading(true);
      
      const profile = {
        ...profileData,
        userId: user?.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUserProfile(profile);
      localStorage.setItem('userProfile', JSON.stringify(profile));
      
      return { success: true, profile };
    } catch (error) {
      console.error('Profile creation error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      
      const updatedProfile = {
        ...userProfile,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUserProfile(updatedProfile);
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Assessment functions
  const saveAssessmentResult = async (result) => {
    try {
      const assessmentResult = {
        id: Date.now().toString(),
        userId: user?.uid,
        ...result,
        timestamp: new Date().toISOString()
      };
      
      const updatedResults = [...assessmentResults, assessmentResult];
      setAssessmentResults(updatedResults);
      localStorage.setItem('assessmentResults', JSON.stringify(updatedResults));
      
      return { success: true, result: assessmentResult };
    } catch (error) {
      console.error('Assessment save error:', error);
      return { success: false, error: error.message };
    }
  };

  const saveMockTestResult = async (result) => {
    try {
      const mockTestResult = {
        id: Date.now().toString(),
        userId: user?.uid,
        ...result,
        timestamp: new Date().toISOString()
      };
      
      const updatedResults = [...mockTestResults, mockTestResult];
      setMockTestResults(updatedResults);
      localStorage.setItem('mockTestResults', JSON.stringify(updatedResults));
      
      return { success: true, result: mockTestResult };
    } catch (error) {
      console.error('Mock test save error:', error);
      return { success: false, error: error.message };
    }
  };

  // Analytics functions
  const getPerformanceAnalytics = () => {
    if (!assessmentResults.length && !mockTestResults.length) {
      return null;
    }

    const allResults = [...assessmentResults, ...mockTestResults];
    const subjectPerformance = {};
    const overallStats = {
      totalTests: allResults.length,
      averageScore: 0,
      strongAreas: [],
      weakAreas: [],
      improvementTrend: 'stable'
    };

    // Calculate subject-wise performance
    allResults.forEach(result => {
      if (result.subjectScores) {
        Object.entries(result.subjectScores).forEach(([subject, score]) => {
          if (!subjectPerformance[subject]) {
            subjectPerformance[subject] = { scores: [], average: 0 };
          }
          subjectPerformance[subject].scores.push(score);
        });
      }
    });

    // Calculate averages and identify strong/weak areas
    Object.keys(subjectPerformance).forEach(subject => {
      const scores = subjectPerformance[subject].scores;
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      subjectPerformance[subject].average = Math.round(average);
      
      if (average >= 80) {
        overallStats.strongAreas.push({ subject, score: average });
      } else if (average < 60) {
        overallStats.weakAreas.push({ subject, score: average });
      }
    });

    // Calculate overall average
    const allScores = Object.values(subjectPerformance).flatMap(perf => perf.scores);
    overallStats.averageScore = Math.round(
      allScores.reduce((sum, score) => sum + score, 0) / allScores.length
    );

    return {
      subjectPerformance,
      overallStats
    };
  };

  // Load user data on authentication change
  useEffect(() => {
    if (isAuthenticated && user) {
      // Load saved profile
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        try {
          setUserProfile(JSON.parse(savedProfile));
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }

      // Load assessment results
      const savedAssessments = localStorage.getItem('assessmentResults');
      if (savedAssessments) {
        try {
          setAssessmentResults(JSON.parse(savedAssessments));
        } catch (error) {
          console.error('Error loading assessments:', error);
        }
      }

      // Load mock test results
      const savedMockTests = localStorage.getItem('mockTestResults');
      if (savedMockTests) {
        try {
          setMockTestResults(JSON.parse(savedMockTests));
        } catch (error) {
          console.error('Error loading mock tests:', error);
        }
      }
    } else {
      // Clear data when not authenticated
      setUserProfile(null);
      setAssessmentResults([]);
      setMockTestResults([]);
    }
  }, [isAuthenticated, user]);

  const value = {
    userProfile,
    assessmentResults,
    mockTestResults,
    loading,
    branches,
    subjectsByBranch,
    semesters,
    createProfile,
    updateProfile,
    saveAssessmentResult,
    saveMockTestResult,
    getPerformanceAnalytics
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};