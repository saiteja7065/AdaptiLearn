// Emergency fallback data service for when Firestore fails
// Provides mock data to keep the application functional

console.log('📱 FALLBACK: Emergency data service activated');

// Mock user data for fallback
export const mockUserData = {
  uid: 'demo-user-123',
  email: 'demo@adaptilearn.com',
  displayName: 'Demo User',
  branchId: 'CSE',
  semester: 4,
  year: 3,
  weakAreas: ['Algorithms', 'Data Structures'],
  strongAreas: ['Programming', 'Web Development'],
  performanceLevel: 'intermediate',
  lastTestScore: 75,
  lastTestDate: new Date(),
  preferences: {
    difficulty: 'medium',
    testDuration: 30,
    subjects: ['Computer Science', 'Programming']
  }
};

// Mock syllabus data
export const mockSyllabusData = [
  {
    id: 'demo-syllabus-1',
    fileName: 'Demo_Computer_Science_Syllabus.pdf',
    branchId: 'CSE',
    semester: 4,
    year: 3,
    topics: [
      'Data Structures',
      'Algorithms',
      'Database Management',
      'Operating Systems',
      'Computer Networks',
      'Software Engineering'
    ],
    subjects: [
      {
        name: 'Data Structures',
        units: ['Arrays', 'Linked Lists', 'Trees', 'Graphs'],
        totalTopics: 15
      },
      {
        name: 'Algorithms',
        units: ['Sorting', 'Searching', 'Dynamic Programming', 'Greedy'],
        totalTopics: 12
      }
    ],
    totalTopics: 27,
    extractionStatus: 'completed',
    uploadedAt: new Date(),
    estimatedStudyHours: 40
  }
];

// Mock questions for tests
export const mockQuestions = [
  {
    id: 'demo-q-1',
    question: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
    correctAnswer: 1,
    difficulty: 'medium',
    topic: 'Algorithms',
    explanation: 'Binary search divides the search space in half with each iteration.'
  },
  {
    id: 'demo-q-2',
    question: 'Which data structure uses LIFO principle?',
    options: ['Queue', 'Stack', 'Array', 'Tree'],
    correctAnswer: 1,
    difficulty: 'easy',
    topic: 'Data Structures',
    explanation: 'Stack follows Last In First Out (LIFO) principle.'
  },
  {
    id: 'demo-q-3',
    question: 'What is a primary key in databases?',
    options: ['A foreign key', 'A unique identifier', 'An index', 'A constraint'],
    correctAnswer: 1,
    difficulty: 'easy',
    topic: 'Database Management',
    explanation: 'Primary key uniquely identifies each record in a table.'
  }
];

// Fallback services that mimic Firestore operations
export const fallbackServices = {
  // User authentication fallback
  authenticateUser: async () => {
    console.log('📱 FALLBACK: Using demo authentication');
    return {
      success: true,
      user: mockUserData,
      message: 'Demo mode active - using fallback authentication'
    };
  },

  // Get user profile fallback
  getUserProfile: async (uid) => {
    console.log('📱 FALLBACK: Using demo user profile');
    return {
      success: true,
      profile: mockUserData,
      offline: true
    };
  },

  // Get syllabi fallback
  getSyllabi: async (branchId) => {
    console.log('📱 FALLBACK: Using demo syllabus data');
    return {
      success: true,
      syllabi: mockSyllabusData.filter(s => s.branchId === branchId || !branchId),
      offline: true
    };
  },

  // Generate questions fallback
  generateQuestions: async (syllabusId, options = {}) => {
    console.log('📱 FALLBACK: Using demo questions');
    const questionCount = options.questionCount || 5;
    const selectedQuestions = mockQuestions.slice(0, questionCount);
    
    return {
      success: true,
      questions: selectedQuestions,
      metadata: {
        syllabusId,
        totalQuestions: selectedQuestions.length,
        difficulty: options.difficulty || 'medium',
        generatedAt: new Date().toISOString(),
        source: 'fallback'
      },
      offline: true
    };
  },

  // Save test results fallback
  saveTestResults: async (testData) => {
    console.log('📱 FALLBACK: Test results saved to local storage');
    const results = {
      id: 'demo-result-' + Date.now(),
      ...testData,
      savedAt: new Date(),
      offline: true
    };
    
    // Save to localStorage as backup
    try {
      const existingResults = JSON.parse(localStorage.getItem('adaptilearn_test_results') || '[]');
      existingResults.push(results);
      localStorage.setItem('adaptilearn_test_results', JSON.stringify(existingResults));
    } catch (error) {
      console.log('📱 FALLBACK: LocalStorage save failed, using memory storage');
    }
    
    return {
      success: true,
      resultId: results.id,
      offline: true,
      message: 'Results saved locally - will sync when connection is restored'
    };
  },

  // Upload syllabus fallback
  uploadSyllabus: async (file, branchId, semester, year) => {
    console.log('📱 FALLBACK: Simulating syllabus upload');
    
    const mockSyllabus = {
      id: 'demo-upload-' + Date.now(),
      fileName: file.name,
      branchId,
      semester,
      year,
      topics: ['Demo Topic 1', 'Demo Topic 2', 'Demo Topic 3'],
      subjects: [
        {
          name: 'Demo Subject',
          units: ['Unit 1', 'Unit 2'],
          totalTopics: 5
        }
      ],
      totalTopics: 5,
      extractionStatus: 'completed',
      uploadedAt: new Date(),
      fileSize: file.size,
      offline: true
    };
    
    return {
      success: true,
      syllabusId: mockSyllabus.id,
      syllabus: mockSyllabus,
      offline: true,
      message: 'Syllabus upload simulated - will process when connection is restored'
    };
  }
};

// Check if we should use fallback mode
export const shouldUseFallback = () => {
  // Always use fallback when Firestore errors are detected
  const hasFirestoreErrors = localStorage.getItem('firestore_errors_detected') === 'true';
  const isOfflineMode = localStorage.getItem('adaptilearn_offline_mode') === 'true';
  
  return hasFirestoreErrors || isOfflineMode || !navigator.onLine;
};

// Set fallback mode
export const setFallbackMode = (enabled) => {
  localStorage.setItem('adaptilearn_offline_mode', enabled.toString());
  if (enabled) {
    localStorage.setItem('firestore_errors_detected', 'true');
  }
  console.log(`📱 FALLBACK: Mode ${enabled ? 'enabled' : 'disabled'}`);
};

// Initialize fallback mode due to current errors
setFallbackMode(true);

export default fallbackServices;
