# AdaptiLearn Syllabus-Based Architecture Design

## 🏗️ Firebase Schema for Syllabus Management

### Collection Structure:

```
adaptilearn-312da/
├── branches/
│   ├── {branchId} (cse, ece, mech, etc.)
│   │   ├── name: "Computer Science Engineering"
│   │   ├── code: "CSE"
│   │   └── totalSemesters: 8
│
├── syllabus/
│   ├── {syllabusId}
│   │   ├── branchId: "cse"
│   │   ├── semester: 1
│   │   ├── year: 1
│   │   ├── subjects: [
│   │   │   {
│   │   │     subjectId: "math1",
│   │   │     name: "Engineering Mathematics I",
│   │   │     code: "MATH101",
│   │   │     credits: 4,
│   │   │     units: [
│   │   │       {
│   │   │         unitNumber: 1,
│   │   │         title: "Differential Calculus",
│   │   │         topics: [
│   │   │           "Limits and Continuity",
│   │   │           "Derivatives",
│   │   │           "Applications of Derivatives"
│   │   │         ],
│   │   │         weightage: 20
│   │   │       }
│   │   │     ]
│   │   │   }
│   │   │ ]
│   │   ├── pdfUrl: "gs://adaptilearn.../cse_sem1_2.pdf"
│   │   └── extractedAt: timestamp
│
├── questions/
│   ├── {questionId}
│   │   ├── branchId: "cse"
│   │   ├── semester: 1
│   │   ├── subjectId: "math1"
│   │   ├── unitNumber: 1
│   │   ├── topic: "Derivatives"
│   │   ├── difficulty: "medium" // easy, medium, hard
│   │   ├── type: "mcq" // mcq, numerical, descriptive
│   │   ├── question: "Find the derivative of x²+3x+2"
│   │   ├── options: ["2x+3", "x²+3", "2x+2", "3x+2"]
│   │   ├── correctAnswer: "2x+3"
│   │   ├── explanation: "Using power rule..."
│   │   ├── marks: 2
│   │   ├── timeLimit: 120 // seconds
│   │   ├── bloomsLevel: "application" // knowledge, comprehension, application, analysis
│   │   └── createdAt: timestamp
│
├── assessments/
│   ├── {assessmentId}
│   │   ├── type: "assignment" // assignment, mock_test, quick_quiz
│   │   ├── branchId: "cse"
│   │   ├── semester: 1
│   │   ├── subjects: ["math1", "physics1"]
│   │   ├── syllabusCoverage: {
│   │   │   "math1": [1, 2], // units covered
│   │   │   "physics1": [1]
│   │   │ }
│   │   ├── totalMarks: 100
│   │   ├── duration: 180 // minutes
│   │   ├── questions: [questionId1, questionId2, ...]
│   │   ├── difficultyDistribution: {
│   │   │   easy: 40%, medium: 40%, hard: 20%
│   │   │ }
│   │   └── createdAt: timestamp
│
└── syllabusAnalysis/
    ├── {analysisId}
    │   ├── branchId: "cse"
    │   ├── semester: 1
    │   ├── extractedTopics: ["topic1", "topic2", ...]
    │   ├── suggestedQuestions: 50
    │   ├── coverageGaps: ["missing_topic1"]
    │   ├── aiAnalysis: "Comprehensive coverage of..."
    │   └── lastUpdated: timestamp
```

## 🚀 Data Flow Architecture

### 1. PDF Upload & Processing Pipeline:
```
PDF Upload → Firebase Storage → AI Processing → Topic Extraction → 
Question Generation → Assessment Creation → Analytics
```

### 2. Question Generation Strategy:
- **Unit-wise Coverage**: Each unit gets proportional questions
- **Difficulty Progression**: Easy → Medium → Hard distribution
- **Bloom's Taxonomy**: Knowledge, Comprehension, Application, Analysis
- **Weightage-based**: Important topics get more questions

### 3. Assessment Types:
- **Quick Quiz**: 10-15 questions, single unit
- **Assignment**: 25-50 questions, multiple units
- **Mock Test**: 100+ questions, full semester/multiple subjects
- **Previous Year Papers**: Based on actual exam patterns
