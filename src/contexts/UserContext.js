import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import realTimeDataService from '../services/realTimeDataService';
import { 
  createUserDocumentFromAuth, 
  getUserDocument, 
  updateUserDocument,
  saveUserAssessment,
  getUserAssessments,
  saveMockTestResult as firebaseSaveMockTest,
  getUserMockTests
} from '../firebase/config';

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
  
  // Real-time data states
  const [branches, setBranches] = useState([]);
  const [subjectsByBranch, setSubjectsByBranch] = useState({});
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Load branches on component mount
  useEffect(() => {
    loadBranches();
  }, []);

  // Load branches from real-time service
  const loadBranches = async () => {
    setLoadingBranches(true);
    try {
      const branchesData = await realTimeDataService.getBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading branches:', error);
      // Fallback to static data
      setBranches([
        { id: 'cse', name: 'Computer Science Engineering', code: 'CSE', popularity: 95 },
        { id: 'ece', name: 'Electronics and Communication Engineering', code: 'ECE', popularity: 85 },
        { id: 'mech', name: 'Mechanical Engineering', code: 'MECH', popularity: 80 },
        { id: 'civil', name: 'Civil Engineering', code: 'CIVIL', popularity: 75 },
        { id: 'eee', name: 'Electrical and Electronics Engineering', code: 'EEE', popularity: 70 },
        { id: 'it', name: 'Information Technology', code: 'IT', popularity: 90 },
        { id: 'chem', name: 'Chemical Engineering', code: 'CHEM', popularity: 65 },
        { id: 'aero', name: 'Aeronautical Engineering', code: 'AERO', popularity: 60 }
      ]);
    } finally {
      setLoadingBranches(false);
    }
  };

  // Load subjects for a specific branch
  const loadSubjectsForBranch = async (branchId) => {
    if (subjectsByBranch[branchId]) {
      return subjectsByBranch[branchId]; // Return cached data
    }

    setLoadingSubjects(true);
    try {
      const subjects = await realTimeDataService.getSubjectsByBranch(branchId);
      setSubjectsByBranch(prev => ({
        ...prev,
        [branchId]: subjects
      }));
      return subjects;
    } catch (error) {
      console.error(`Error loading subjects for ${branchId}:`, error);
      return [];
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Get subjects for a branch (with real-time loading)
  const getSubjectsForBranch = (branchId) => {
    if (!branchId) return [];
    
    // If not loaded, trigger loading
    if (!subjectsByBranch[branchId]) {
      loadSubjectsForBranch(branchId);
      return [];
    }
    
    return subjectsByBranch[branchId];
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
      
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const profile = {
        ...profileData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to Firebase
      await createUserDocumentFromAuth(user, profile);
      
      // Save subject preferences for analytics using real-time service
      if (profileData.selectedSubjects && profileData.selectedSubjects.length > 0) {
        const subjectsData = await loadSubjectsForBranch(profileData.branch);
        const selectedSubjectsDetails = subjectsData.filter(s => 
          profileData.selectedSubjects.includes(s.id)
        );
        
        await realTimeDataService.saveSubjectPreferences(
          user.uid, 
          profileData.branch, 
          selectedSubjectsDetails
        );
      }
      
      setUserProfile(profile);
      
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
      
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const updatedProfile = {
        ...userProfile,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Update in Firebase
      await updateUserDocument(user.uid, updatedProfile);
      
      setUserProfile(updatedProfile);
      
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
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const assessmentResult = {
        id: Date.now().toString(),
        userId: user.uid,
        ...result,
        timestamp: new Date().toISOString()
      };
      
      // Save to Firebase
      await saveUserAssessment(user.uid, assessmentResult);
      
      const updatedResults = [...assessmentResults, assessmentResult];
      setAssessmentResults(updatedResults);
      
      return { success: true, result: assessmentResult };
    } catch (error) {
      console.error('Assessment save error:', error);
      return { success: false, error: error.message };
    }
  };

  const saveMockTestResult = async (result) => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const mockTestResult = {
        id: Date.now().toString(),
        userId: user.uid,
        ...result,
        timestamp: new Date().toISOString()
      };
      
      // Save to Firebase
      await firebaseSaveMockTest(user.uid, mockTestResult);
      
      const updatedResults = [...mockTestResults, mockTestResult];
      setMockTestResults(updatedResults);
      
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
    const loadUserData = async () => {
      if (isAuthenticated && user?.uid) {
        console.log('🔄 Loading user data for:', user.uid);
        try {
          setLoading(true);
          
          // Add a timeout to prevent infinite loading
          const timeoutId = setTimeout(() => {
            console.log('⏰ Loading timeout - setting empty profile');
            setUserProfile({});
            setLoading(false);
          }, 5000); // 5 second timeout
          
          // Load user profile from Firebase
          const profileData = await getUserDocument(user.uid);
          console.log('📄 Profile data received:', profileData);
          
          // Clear timeout since we got a response
          clearTimeout(timeoutId);
          
          if (profileData) {
            setUserProfile(profileData);
            console.log('✅ Profile loaded successfully');
          } else {
            // Set empty object for new users without profile
            setUserProfile({});
            console.log('📝 New user - empty profile set');
          }

          // Load assessment results from Firebase
          const assessments = await getUserAssessments(user.uid);
          setAssessmentResults(assessments || []);

          // Load mock test results from Firebase
          const mockTests = await getUserMockTests(user.uid);
          setMockTestResults(mockTests || []);
          
          console.log('🎯 User data loading completed');
        } catch (error) {
          console.error('❌ Error loading user data:', error);
          // Fallback to localStorage if Firebase fails
          const savedProfile = localStorage.getItem('userProfile');
          if (savedProfile) {
            try {
              setUserProfile(JSON.parse(savedProfile));
              console.log('💾 Loaded profile from localStorage');
            } catch (parseError) {
              console.error('Error parsing saved profile:', parseError);
              setUserProfile({});
            }
          } else {
            // Set empty object for new users
            setUserProfile({});
            console.log('📝 Fallback - empty profile set');
          }
        } finally {
          setLoading(false);
          console.log('⏰ Loading state set to false');
        }
      } else {
        console.log('🚫 No authenticated user or user ID');
        // Clear data when not authenticated
        setUserProfile(null);
        setAssessmentResults([]);
        setMockTestResults([]);
      }
    };

    loadUserData();
  }, [isAuthenticated, user]);

  const value = {
    userProfile,
    assessmentResults,
    mockTestResults,
    loading,
    branches,
    subjectsByBranch: getSubjectsForBranch, // Function to get subjects dynamically
    semesters,
    createProfile,
    updateProfile,
    saveAssessmentResult,
    saveMockTestResult,
    getPerformanceAnalytics,
    // Real-time data functions
    loadSubjectsForBranch,
    loadingBranches,
    loadingSubjects,
    realTimeService: realTimeDataService
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};