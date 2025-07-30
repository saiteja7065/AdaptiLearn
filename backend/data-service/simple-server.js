const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'data-service', timestamp: new Date().toISOString() });
});

// Analytics endpoints
app.post('/api/analytics/track', (req, res) => {
  console.log('Activity tracked:', req.body);
  res.json({ success: true, message: 'Activity tracked successfully' });
});

app.post('/api/analytics/assessment', (req, res) => {
  console.log('Assessment submitted:', req.body);
  res.json({ 
    success: true, 
    message: 'Assessment submitted successfully',
    assessmentId: `assessment_${Date.now()}`
  });
});

app.get('/api/analytics/performance', (req, res) => {
  const { branch = 'CSE', semester = 1 } = req.query;
  
  // Mock performance data
  const mockData = {
    overall_score: 78,
    total_tests: 6,
    subject_performance: [
      { subject: 'Data Structures', score: 82, improvement: 5 },
      { subject: 'Algorithms', score: 75, improvement: 3 },
      { subject: 'Database Systems', score: 70, improvement: -2 },
      { subject: 'Operating Systems', score: 85, improvement: 8 }
    ],
    performance_trend: 'improving',
    weak_areas: ['Database Systems'],
    strong_areas: ['Operating Systems', 'Data Structures'],
    branch,
    semester
  };
  
  res.json({ success: true, analytics: mockData });
});

// Question generation endpoints
app.post('/api/questions/generate', (req, res) => {
  const { subject = 'Computer Science', difficulty = 'medium', count = 10 } = req.body;
  
  // Mock questions
  const mockQuestions = [
    {
      id: 1,
      question: "What is the time complexity of binary search?",
      options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      correctAnswer: 1,
      difficulty,
      subject,
      explanation: "Binary search divides the search space in half with each comparison."
    },
    {
      id: 2,
      question: "Which data structure uses LIFO principle?",
      options: ["Queue", "Stack", "Array", "Linked List"],
      correctAnswer: 1,
      difficulty,
      subject,
      explanation: "Stack follows Last In First Out (LIFO) principle."
    },
    {
      id: 3,
      question: "What is the purpose of a primary key in a database?",
      options: ["To create relationships", "To uniquely identify records", "To sort data", "To backup data"],
      correctAnswer: 1,
      difficulty,
      subject,
      explanation: "A primary key uniquely identifies each record in a database table."
    }
  ];
  
  res.json({ 
    success: true, 
    questions: mockQuestions.slice(0, parseInt(count) || 10),
    metadata: { subject, difficulty, count }
  });
});

// Syllabus endpoints
app.get('/api/syllabus', (req, res) => {
  const mockSyllabi = [
    {
      id: 'cs_ds',
      subject: 'Data Structures',
      title: 'Data Structures and Algorithms',
      topics: ['Arrays', 'Linked Lists', 'Trees', 'Graphs'],
      difficulty: 'medium'
    },
    {
      id: 'cs_db',
      subject: 'Database Systems',
      title: 'Database Management Systems',
      topics: ['SQL', 'Normalization', 'Indexing', 'Transactions'],
      difficulty: 'medium'
    }
  ];
  
  res.json({ success: true, syllabi: mockSyllabi });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`✅ Data Service running on port ${PORT}`);
  console.log(`📊 Analytics API: http://localhost:${PORT}/api/analytics`);
  console.log(`❓ Questions API: http://localhost:${PORT}/api/questions`);
  console.log(`📚 Syllabus API: http://localhost:${PORT}/api/syllabus`);
});
