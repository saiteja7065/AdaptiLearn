// Test Analytics Update Script
// This will help us test if analytics updates work after mock test completion

console.log('🧪 Testing Analytics Update Flow...');

// Function to simulate a mock test result
const simulateTestResult = {
  userId: 'test-user-123',
  syllabus: 'Data Structures',
  score: 85,
  totalQuestions: 10,
  correctAnswers: 8,
  insights: {
    nextDifficulty: 'medium',
    weakAreas: ['Arrays'],
    strongAreas: ['Stacks', 'Queues']
  },
  branch: 'CSE',
  semester: 3,
  testMode: 'timed',
  timestamp: new Date(),
  timeTaken: 1200, // 20 minutes
  topic: 'Data Structures',
  subject: 'Computer Science',
  type: 'Mock Test',
  date: new Date().toISOString().split('T')[0],
  questions: [
    { id: 1, difficulty: 'easy' },
    { id: 2, difficulty: 'medium' },
    { id: 3, difficulty: 'hard' }
  ],
  userAnswers: { 1: 0, 2: 1, 3: 0 }
};

console.log('📊 Sample Test Result:', simulateTestResult);
console.log('✅ Ready for testing!');
