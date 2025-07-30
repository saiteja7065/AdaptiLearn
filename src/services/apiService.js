// API Service Layer - Connects Frontend to Backend
import { auth } from '../firebase/config';

class APIService {
    constructor() {
        this.API_GATEWAY_URL = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:8080';
        this.AI_SERVICE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8000';
        this.DATA_SERVICE_URL = process.env.REACT_APP_DATA_SERVICE_URL || 'http://localhost:8001';
        this.authToken = null;
    }

    // Get authentication token
    async getAuthToken() {
        try {
            const user = auth.currentUser;
            if (user) {
                this.authToken = await user.getIdToken();
                return this.authToken;
            }
            return null;
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }

    // Generic API call with authentication
    async apiCall(url, options = {}) {
        try {
            const token = await this.getAuthToken();
            
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            };

            const response = await fetch(url, {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    }

    // Generic GET method for API calls
    async get(endpoint) {
        try {
            // Determine which service URL to use based on endpoint
            let baseUrl = this.AI_SERVICE_URL;
            if (endpoint.includes('/api/user/') || endpoint.includes('/api/gateway/')) {
                baseUrl = this.API_GATEWAY_URL;
            } else if (endpoint.includes('/api/data/')) {
                baseUrl = this.DATA_SERVICE_URL;
            }

            const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
            return await this.apiCall(url, { method: 'GET' });
        } catch (error) {
            console.error('GET request error:', error);
            throw error;
        }
    }

    // =============================================
    // AI SERVICE METHODS (Question Generation)
    // =============================================

    async generateQuestions(topic, difficulty = 'medium', count = 5, branch = '', semester = 1) {
        try {
            const response = await this.apiCall(`${this.AI_SERVICE_URL}/api/ai/generate-questions`, {
                method: 'POST',
                body: JSON.stringify({
                    content: `Generate questions for ${topic} in ${branch} engineering`,
                    num_questions: count,
                    difficulty: difficulty,
                    question_type: 'mcq',
                    subject: topic,
                    branch: branch,
                    semester: semester
                })
            });

            if (response.success && response.questions) {
                return response.questions.map(q => ({
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correct_answer,
                    explanation: q.explanation,
                    difficulty: q.difficulty,
                    subject: q.subject || topic,
                    topic: q.topic || topic
                }));
            }
            
            return this.getFallbackQuestions(topic, count);
        } catch (error) {
            console.error('Error generating questions:', error);
            return this.getFallbackQuestions(topic, count);
        }
    }

    async analyzeContent(content, content_type = 'text', branch = '', semester = 1) {
        try {
            const response = await this.apiCall(`${this.AI_SERVICE_URL}/api/ai/analyze-content`, {
                method: 'POST',
                body: JSON.stringify({
                    content,
                    content_type,
                    branch,
                    semester
                })
            });

            if (response.success && response.analysis) {
                return response.analysis;
            }
            
            return { topics: [], difficulty: 'medium', keywords: [] };
        } catch (error) {
            console.error('Error analyzing content:', error);
            return { topics: [], difficulty: 'medium', keywords: [] };
        }
    }

    async generateFeedback(performanceData, testResults = [], learningGoals = [], weakAreas = []) {
        try {
            const response = await this.apiCall(`${this.AI_SERVICE_URL}/api/ai/enhance-feedback`, {
                method: 'POST',
                body: JSON.stringify({
                    performance_data: performanceData,
                    test_results: testResults,
                    learning_goals: learningGoals,
                    weak_areas: weakAreas
                })
            });

            if (response.success && response.enhanced_feedback) {
                return response.enhanced_feedback;
            }
            
            return this.generateQuickFeedback(performanceData.average_score || 0, 'General');
        } catch (error) {
            console.error('Error generating feedback:', error);
            return this.generateQuickFeedback(performanceData.average_score || 0, 'General');
        }
    }

    // =============================================
    // DATA SERVICE METHODS (Analytics & Data)
    // =============================================

    async trackActivity(activityType, metadata = {}) {
        try {
            const user = auth.currentUser;
            if (!user) return;

            await this.apiCall(`${this.DATA_SERVICE_URL}/api/analytics/track`, {
                method: 'POST',
                body: JSON.stringify({
                    activityType,
                    metadata: {
                        ...metadata,
                        timestamp: new Date().toISOString()
                    }
                })
            });
        } catch (error) {
            console.error('Error tracking activity:', error);
        }
    }

    async submitAssessment(assessmentData) {
        try {
            const response = await this.apiCall(`${this.DATA_SERVICE_URL}/api/analytics/assessment`, {
                method: 'POST',
                body: JSON.stringify({ assessmentData })
            });

            return response.data || {};
        } catch (error) {
            console.error('Error submitting assessment:', error);
            throw error;
        }
    }

    async getUserAnalytics() {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const response = await this.apiCall(`${this.DATA_SERVICE_URL}/api/analytics/${user.uid}`);
            return response.data || {};
        } catch (error) {
            console.error('Error getting user analytics:', error);
            return null;
        }
    }

    async processSyllabus(syllabusData) {
        try {
            const response = await this.apiCall(`${this.DATA_SERVICE_URL}/api/syllabus/process`, {
                method: 'POST',
                body: JSON.stringify({ syllabusData })
            });

            return response.data || {};
        } catch (error) {
            console.error('Error processing syllabus:', error);
            throw error;
        }
    }

    async uploadSyllabusPDF(formData) {
        try {
            const response = await this.apiCall(`${this.AI_SERVICE_URL}/api/ai/upload-syllabus`, {
                method: 'POST',
                body: formData,
                headers: {} // Let browser set Content-Type for FormData
            });

            if (response.success) {
                return {
                    success: true,
                    extractedTopics: response.extractedTopics || [],
                    syllabusId: response.syllabusId
                };
            }
            
            return { success: false, error: 'Failed to process PDF' };
        } catch (error) {
            console.error('Error uploading syllabus PDF:', error);
            return { success: false, error: error.message };
        }
    }

    async generateSyllabusQuestions(syllabusData) {
        try {
            const response = await this.apiCall(`${this.AI_SERVICE_URL}/api/ai/generate-syllabus-questions`, {
                method: 'POST',
                body: JSON.stringify(syllabusData)
            });

            if (response.success && response.questions) {
                return response.questions.map(q => ({
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correct_answer,
                    explanation: q.explanation,
                    difficulty: q.difficulty,
                    topic: q.topic,
                    subject: syllabusData.subject
                }));
            }
            
            return this.getFallbackQuestions(syllabusData.subject, syllabusData.count || 10);
        } catch (error) {
            console.error('Error generating syllabus questions:', error);
            return this.getFallbackQuestions(syllabusData.subject, syllabusData.count || 10);
        }
    }

    // =============================================
    // API GATEWAY METHODS (User Management)
    // =============================================

    async getUserProfile() {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const response = await this.apiCall(`${this.API_GATEWAY_URL}/api/user/profile`);
            return response.data || {};
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    async updateUserProfile(profileData) {
        try {
            const response = await this.apiCall(`${this.API_GATEWAY_URL}/api/user/profile`, {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });

            return response.data || {};
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    // =============================================
    // FALLBACK METHODS (For Demo Reliability)
    // =============================================

    getFallbackQuestions(topic, count = 5) {
        // Create subject-specific question pools
        const subjectQuestions = this.getSubjectSpecificQuestions(topic);
        
        // If we have subject-specific questions, use them
        if (subjectQuestions.length > 0) {
            return subjectQuestions.slice(0, count);
        }

        // Generic fallback questions
        const fallbackQuestions = [
            {
                id: 'fallback_1',
                question: `What is the fundamental concept of ${topic}?`,
                options: [
                    'A basic principle that forms the foundation',
                    'An advanced technique',
                    'A complex algorithm',
                    'A simple procedure'
                ],
                correctAnswer: 0,
                explanation: `The fundamental concept of ${topic} refers to the basic principle that forms the foundation of understanding.`,
                difficulty: 'medium',
                topic: topic
            },
            {
                id: 'fallback_2',
                question: `Which of the following best describes ${topic}?`,
                options: [
                    'A theoretical framework',
                    'A practical application',
                    'A comprehensive system for learning and understanding',
                    'A simple tool'
                ],
                correctAnswer: 2,
                explanation: `${topic} is best described as a comprehensive system for learning and understanding.`,
                difficulty: 'medium',
                topic: topic
            },
            {
                id: 'fallback_3',
                question: `What is the primary benefit of studying ${topic}?`,
                options: [
                    'Memorizing facts',
                    'Developing analytical thinking',
                    'Following instructions',
                    'Completing assignments'
                ],
                correctAnswer: 1,
                explanation: `The primary benefit of studying ${topic} is developing analytical thinking skills.`,
                difficulty: 'medium',
                topic: topic
            }
        ];

        return fallbackQuestions.slice(0, count);
    }

    getSubjectSpecificQuestions(topic) {
        const topicLower = topic.toLowerCase();
        
        // Computer Science & Engineering Questions
        if (topicLower.includes('computer') || topicLower.includes('programming') || topicLower.includes('data structure') || topicLower.includes('algorithm')) {
            return [
                {
                    id: 'cse_1',
                    question: 'What is the time complexity of binary search?',
                    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(n²)'],
                    correctAnswer: 1,
                    explanation: 'Binary search has O(log n) time complexity as it divides the search space in half with each step.',
                    difficulty: 'medium',
                    topic: 'Data Structures & Algorithms'
                },
                {
                    id: 'cse_2',
                    question: 'Which data structure follows LIFO principle?',
                    options: ['Queue', 'Stack', 'Array', 'Linked List'],
                    correctAnswer: 1,
                    explanation: 'Stack follows Last In First Out (LIFO) principle where the last element added is the first one to be removed.',
                    difficulty: 'easy',
                    topic: 'Data Structures'
                },
                {
                    id: 'cse_3',
                    question: 'What is the purpose of a constructor in object-oriented programming?',
                    options: ['To destroy objects', 'To initialize objects', 'To copy objects', 'To compare objects'],
                    correctAnswer: 1,
                    explanation: 'A constructor is a special method used to initialize objects when they are created.',
                    difficulty: 'medium',
                    topic: 'Object Oriented Programming'
                },
                {
                    id: 'cse_4',
                    question: 'Which of the following is NOT a relational database operation?',
                    options: ['SELECT', 'INSERT', 'COMPILE', 'UPDATE'],
                    correctAnswer: 2,
                    explanation: 'COMPILE is not a relational database operation. SELECT, INSERT, and UPDATE are standard SQL operations.',
                    difficulty: 'easy',
                    topic: 'Database Management'
                },
                {
                    id: 'cse_5',
                    question: 'What does CPU stand for?',
                    options: ['Central Processing Unit', 'Computer Processing Unit', 'Central Program Unit', 'Computer Program Unit'],
                    correctAnswer: 0,
                    explanation: 'CPU stands for Central Processing Unit, which is the main component that performs calculations and executes instructions.',
                    difficulty: 'easy',
                    topic: 'Computer Architecture'
                }
            ];
        }
        
        // Electronics & Communication Engineering Questions
        if (topicLower.includes('electronic') || topicLower.includes('communication') || topicLower.includes('signal') || topicLower.includes('circuit')) {
            return [
                {
                    id: 'ece_1',
                    question: 'What is the unit of electrical resistance?',
                    options: ['Volt', 'Ampere', 'Ohm', 'Watt'],
                    correctAnswer: 2,
                    explanation: 'The unit of electrical resistance is Ohm (Ω), named after Georg Simon Ohm.',
                    difficulty: 'easy',
                    topic: 'Basic Electronics'
                },
                {
                    id: 'ece_2',
                    question: 'Which modulation technique is used in AM radio broadcasting?',
                    options: ['Frequency Modulation', 'Amplitude Modulation', 'Phase Modulation', 'Pulse Modulation'],
                    correctAnswer: 1,
                    explanation: 'AM radio uses Amplitude Modulation where the amplitude of the carrier wave is varied according to the information signal.',
                    difficulty: 'medium',
                    topic: 'Communication Systems'
                },
                {
                    id: 'ece_3',
                    question: 'What is the function of a diode?',
                    options: ['Amplification', 'Rectification', 'Oscillation', 'Modulation'],
                    correctAnswer: 1,
                    explanation: 'A diode primarily functions as a rectifier, allowing current to flow in only one direction.',
                    difficulty: 'medium',
                    topic: 'Electronic Devices'
                },
                {
                    id: 'ece_4',
                    question: 'In digital electronics, what does AND gate output when both inputs are 1?',
                    options: ['0', '1', 'X', 'Z'],
                    correctAnswer: 1,
                    explanation: 'An AND gate outputs 1 only when both inputs are 1. For all other input combinations, it outputs 0.',
                    difficulty: 'easy',
                    topic: 'Digital Electronics'
                },
                {
                    id: 'ece_5',
                    question: 'What is the bandwidth of human audible frequency range?',
                    options: ['20 Hz to 20 kHz', '0 Hz to 10 kHz', '100 Hz to 15 kHz', '50 Hz to 25 kHz'],
                    correctAnswer: 0,
                    explanation: 'The human audible frequency range is typically 20 Hz to 20 kHz.',
                    difficulty: 'medium',
                    topic: 'Signal Processing'
                }
            ];
        }
        
        // Mechanical Engineering Questions
        if (topicLower.includes('mechanical') || topicLower.includes('thermodynamic') || topicLower.includes('fluid') || topicLower.includes('machine')) {
            return [
                {
                    id: 'mech_1',
                    question: 'What is the first law of thermodynamics?',
                    options: ['Energy cannot be created or destroyed', 'Entropy always increases', 'Heat flows from hot to cold', 'Work equals force times distance'],
                    correctAnswer: 0,
                    explanation: 'The first law of thermodynamics states that energy cannot be created or destroyed, only transformed from one form to another.',
                    difficulty: 'medium',
                    topic: 'Thermodynamics'
                },
                {
                    id: 'mech_2',
                    question: 'What is the SI unit of force?',
                    options: ['Joule', 'Newton', 'Pascal', 'Watt'],
                    correctAnswer: 1,
                    explanation: 'The SI unit of force is Newton (N), named after Sir Isaac Newton.',
                    difficulty: 'easy',
                    topic: 'Mechanics'
                },
                {
                    id: 'mech_3',
                    question: 'Which type of stress is caused by forces acting parallel to the cross-sectional area?',
                    options: ['Tensile stress', 'Compressive stress', 'Shear stress', 'Bending stress'],
                    correctAnswer: 2,
                    explanation: 'Shear stress is caused by forces acting parallel to the cross-sectional area of a material.',
                    difficulty: 'medium',
                    topic: 'Strength of Materials'
                },
                {
                    id: 'mech_4',
                    question: 'What is the efficiency of an ideal Carnot engine operating between 400K and 300K?',
                    options: ['25%', '33%', '50%', '75%'],
                    correctAnswer: 0,
                    explanation: 'Carnot efficiency = 1 - (T_cold/T_hot) = 1 - (300/400) = 0.25 or 25%',
                    difficulty: 'hard',
                    topic: 'Thermodynamics'
                },
                {
                    id: 'mech_5',
                    question: 'What does CAD stand for in engineering?',
                    options: ['Computer Aided Design', 'Computer Assisted Drawing', 'Computer Advanced Design', 'Computer Automated Design'],
                    correctAnswer: 0,
                    explanation: 'CAD stands for Computer Aided Design, used for creating precise drawings and technical illustrations.',
                    difficulty: 'easy',
                    topic: 'Engineering Design'
                }
            ];
        }
        
        // Civil Engineering Questions
        if (topicLower.includes('civil') || topicLower.includes('construction') || topicLower.includes('structural') || topicLower.includes('concrete')) {
            return [
                {
                    id: 'civil_1',
                    question: 'What is the typical compressive strength of concrete after 28 days?',
                    options: ['15-25 MPa', '25-35 MPa', '35-45 MPa', '45-55 MPa'],
                    correctAnswer: 1,
                    explanation: 'The typical compressive strength of concrete after 28 days of curing is around 25-35 MPa for standard concrete.',
                    difficulty: 'medium',
                    topic: 'Concrete Technology'
                },
                {
                    id: 'civil_2',
                    question: 'What is the main function of reinforcement in concrete?',
                    options: ['Increase compressive strength', 'Increase tensile strength', 'Reduce weight', 'Improve workability'],
                    correctAnswer: 1,
                    explanation: 'Reinforcement in concrete primarily increases tensile strength as concrete is weak in tension.',
                    difficulty: 'medium',
                    topic: 'Structural Engineering'
                },
                {
                    id: 'civil_3',
                    question: 'What is the standard consistency of cement paste?',
                    options: ['26-33%', '20-25%', '35-40%', '15-20%'],
                    correctAnswer: 0,
                    explanation: 'The standard consistency of cement paste is typically 26-33% by weight of cement.',
                    difficulty: 'medium',
                    topic: 'Material Testing'
                },
                {
                    id: 'civil_4',
                    question: 'Which type of foundation is suitable for soft soils?',
                    options: ['Shallow foundation', 'Deep foundation', 'Mat foundation', 'Strip foundation'],
                    correctAnswer: 1,
                    explanation: 'Deep foundations like piles are suitable for soft soils as they transfer loads to deeper, stronger soil layers.',
                    difficulty: 'medium',
                    topic: 'Foundation Engineering'
                },
                {
                    id: 'civil_5',
                    question: 'What is the purpose of curing in concrete?',
                    options: ['To speed up construction', 'To prevent cracking', 'To maintain moisture for hydration', 'To reduce cost'],
                    correctAnswer: 2,
                    explanation: 'Curing maintains moisture in concrete to allow complete hydration of cement, achieving desired strength.',
                    difficulty: 'medium',
                    topic: 'Concrete Technology'
                }
            ];
        }

        // Mathematics Questions
        if (topicLower.includes('math') || topicLower.includes('calculus') || topicLower.includes('algebra') || topicLower.includes('geometry')) {
            return [
                {
                    id: 'math_1',
                    question: 'What is the derivative of x²?',
                    options: ['x', '2x', 'x²', '2x²'],
                    correctAnswer: 1,
                    explanation: 'The derivative of x² is 2x, using the power rule where d/dx(x^n) = nx^(n-1).',
                    difficulty: 'easy',
                    topic: 'Calculus'
                },
                {
                    id: 'math_2',
                    question: 'What is the value of sin(90°)?',
                    options: ['0', '1', '-1', '√2/2'],
                    correctAnswer: 1,
                    explanation: 'sin(90°) = 1. This is a standard trigonometric value.',
                    difficulty: 'easy',
                    topic: 'Trigonometry'
                },
                {
                    id: 'math_3',
                    question: 'What is the formula for the area of a circle?',
                    options: ['2πr', 'πr²', 'πr', '2πr²'],
                    correctAnswer: 1,
                    explanation: 'The area of a circle is πr², where r is the radius.',
                    difficulty: 'easy',
                    topic: 'Geometry'
                },
                {
                    id: 'math_4',
                    question: 'What is the solution to the equation 2x + 3 = 7?',
                    options: ['x = 1', 'x = 2', 'x = 3', 'x = 4'],
                    correctAnswer: 1,
                    explanation: '2x + 3 = 7, so 2x = 4, therefore x = 2.',
                    difficulty: 'easy',
                    topic: 'Algebra'
                },
                {
                    id: 'math_5',
                    question: 'What is the integral of 2x?',
                    options: ['x²', 'x² + C', '2', '2x + C'],
                    correctAnswer: 1,
                    explanation: 'The integral of 2x is x² + C, where C is the constant of integration.',
                    difficulty: 'medium',
                    topic: 'Calculus'
                }
            ];
        }

        return []; // Return empty array if no specific questions found
    }

    // =============================================
    // HEALTH CHECK METHODS
    // =============================================

    async checkBackendHealth() {
        try {
            const promises = [
                fetch(`${this.AI_SERVICE_URL}/health`).then(r => ({ service: 'ai', healthy: r.ok })),
                fetch(`${this.DATA_SERVICE_URL}/health`).then(r => ({ service: 'data', healthy: r.ok })),
                fetch(`${this.API_GATEWAY_URL}/health`).then(r => ({ service: 'gateway', healthy: r.ok }))
            ];

            const results = await Promise.allSettled(promises);
            
            return results.map(result => 
                result.status === 'fulfilled' 
                    ? result.value 
                    : { service: 'unknown', healthy: false }
            );
        } catch (error) {
            console.error('Error checking backend health:', error);
            return [
                { service: 'ai', healthy: false },
                { service: 'data', healthy: false },
                { service: 'gateway', healthy: false }
            ];
        }
    }

    // =============================================
    // AI TUTORING METHODS
    // =============================================

    async chatWithTutor(message, context = {}, conversationHistory = []) {
        try {
            // Use Gemini API for better responses
            const response = await this.callGeminiAPI(message, context);
            if (response) {
                return response;
            }
            
            return this.generateFallbackTutorResponse(message);
        } catch (error) {
            console.error('Error chatting with tutor:', error);
            return this.generateFallbackTutorResponse(message);
        }
    }

    async callGeminiAPI(message, context = {}) {
        try {
            const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'demo-key';
            const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
            
            const prompt = `You are an AI tutor for engineering and computer science students. Answer ONLY academic and study-related questions.

Rules:
1. Only answer questions about: programming, algorithms, data structures, mathematics, physics, engineering subjects, computer science concepts
2. If question is not academic, respond: "I can only help with academic topics. Please ask about your studies."
3. Provide clear, educational explanations with examples
4. Keep responses under 150 words

Student Question: ${message}

Response:`;

            const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (response.ok) {
                const data = await response.json();
                const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (aiResponse) {
                    return {
                        message: aiResponse,
                        confidence: 0.9,
                        sources: ['Gemini AI', 'Academic Resources'],
                        follow_up_questions: [
                            'Would you like me to explain this in more detail?',
                            'Do you have any specific questions about this topic?',
                            'Should I provide some practice problems?'
                        ]
                    };
                }
            }
        } catch (error) {
            console.error('Gemini API error:', error);
        }
        return null;
    }

    generateFallbackTutorResponse(message) {
        const messageLower = message.toLowerCase();
        
        // Algorithm related questions
        if (messageLower.includes('algorithm') || messageLower.includes('sorting') || messageLower.includes('searching')) {
            if (messageLower.includes('sorting')) {
                return {
                    message: 'Sorting algorithms arrange data in a specific order. Common ones include Bubble Sort (O(n²)), Quick Sort (O(n log n) average), Merge Sort (O(n log n) guaranteed), and Heap Sort. Each has different time complexities and use cases.',
                    confidence: 0.9,
                    sources: ['Algorithm Design Manual', 'Computer Science Fundamentals'],
                    follow_up_questions: [
                        'Which sorting algorithm would you like to understand in detail?',
                        'Do you need help with time complexity analysis?',
                        'Should I explain when to use which sorting algorithm?'
                    ]
                };
            } else if (messageLower.includes('searching')) {
                return {
                    message: 'Searching algorithms find specific elements in data structures. Linear search checks each element (O(n)), while binary search works on sorted arrays (O(log n)). Hash tables provide O(1) average search time.',
                    confidence: 0.9,
                    sources: ['Algorithm Design Manual', 'Data Structures'],
                    follow_up_questions: [
                        'Would you like to learn about binary search implementation?',
                        'Do you need help with hash table concepts?',
                        'Should I explain search optimization techniques?'
                    ]
                };
            } else {
                return {
                    message: 'Algorithms are step-by-step procedures for solving computational problems. They have time and space complexity measures. Key categories include sorting, searching, graph algorithms, dynamic programming, and greedy algorithms.',
                    confidence: 0.9,
                    sources: ['Algorithm Design Manual', 'Computer Science Fundamentals'],
                    follow_up_questions: [
                        'Which type of algorithm interests you most?',
                        'Do you need help with Big O notation?',
                        'Should I explain algorithm design techniques?'
                    ]
                };
            }
        }
        
        // Data structure related questions
        else if (messageLower.includes('data structure') || messageLower.includes('array') || messageLower.includes('linked list') || messageLower.includes('tree') || messageLower.includes('graph')) {
            if (messageLower.includes('array')) {
                return {
                    message: 'Arrays store elements in contiguous memory locations with constant-time access O(1) by index. They have fixed size in most languages. Operations: access O(1), search O(n), insertion/deletion O(n) for arbitrary positions.',
                    confidence: 0.9,
                    sources: ['Data Structures Textbook', 'Programming Fundamentals'],
                    follow_up_questions: [
                        'Do you need help with array operations?',
                        'Should I explain dynamic arrays vs static arrays?',
                        'Would you like to see array implementation examples?'
                    ]
                };
            } else if (messageLower.includes('linked list')) {
                return {
                    message: 'Linked lists store data in nodes connected by pointers. Unlike arrays, they allow dynamic sizing. Singly linked lists have one pointer per node, doubly linked lists have two. Insertion/deletion at known positions is O(1).',
                    confidence: 0.9,
                    sources: ['Data Structures Textbook', 'Programming Fundamentals'],
                    follow_up_questions: [
                        'Would you like to understand linked list implementation?',
                        'Do you need help with linked list vs array comparison?',
                        'Should I explain different types of linked lists?'
                    ]
                };
            } else if (messageLower.includes('tree')) {
                return {
                    message: 'Trees are hierarchical data structures with nodes connected by edges. Binary trees have at most 2 children per node. Binary Search Trees maintain order for efficient searching O(log n). Other types include AVL, Red-Black, and B-trees.',
                    confidence: 0.9,
                    sources: ['Data Structures Textbook', 'Tree Algorithms'],
                    follow_up_questions: [
                        'Which type of tree would you like to learn about?',
                        'Do you need help with tree traversal algorithms?',
                        'Should I explain tree balancing concepts?'
                    ]
                };
            } else {
                return {
                    message: 'Data structures organize and store data for efficient access and modification. Common types include arrays, linked lists, stacks, queues, trees, graphs, and hash tables. Each has specific use cases and performance characteristics.',
                    confidence: 0.9,
                    sources: ['Data Structures Textbook', 'Programming Fundamentals'],
                    follow_up_questions: [
                        'Which data structure would you like to explore?',
                        'Do you need help choosing the right data structure?',
                        'Should I explain time complexity comparisons?'
                    ]
                };
            }
        }
        
        // Database related questions
        else if (messageLower.includes('database') || messageLower.includes('sql') || messageLower.includes('normalization')) {
            if (messageLower.includes('sql')) {
                return {
                    message: 'SQL (Structured Query Language) is used to manage relational databases. Key commands include SELECT (retrieve data), INSERT (add data), UPDATE (modify data), DELETE (remove data). Joins combine data from multiple tables.',
                    confidence: 0.9,
                    sources: ['Database Systems', 'SQL Reference'],
                    follow_up_questions: [
                        'Do you need help with specific SQL queries?',
                        'Should I explain different types of JOINs?',
                        'Would you like to learn about SQL optimization?'
                    ]
                };
            } else if (messageLower.includes('normalization')) {
                return {
                    message: 'Database normalization reduces redundancy and improves data integrity. 1NF eliminates repeating groups, 2NF removes partial dependencies, 3NF eliminates transitive dependencies. Higher normal forms exist for specific cases.',
                    confidence: 0.9,
                    sources: ['Database Design', 'Relational Theory'],
                    follow_up_questions: [
                        'Which normal form would you like to understand better?',
                        'Do you need help with normalization examples?',
                        'Should I explain denormalization trade-offs?'
                    ]
                };
            } else {
                return {
                    message: 'Databases store and organize data systematically. Relational databases use tables with relationships, while NoSQL databases offer flexible schemas. Key concepts include ACID properties, indexing, and query optimization.',
                    confidence: 0.9,
                    sources: ['Database Systems', 'Data Management'],
                    follow_up_questions: [
                        'Are you interested in relational or NoSQL databases?',
                        'Do you need help with database design principles?',
                        'Should I explain ACID properties?'
                    ]
                };
            }
        }
        
        // Operating Systems questions
        else if (messageLower.includes('operating system') || messageLower.includes('process') || messageLower.includes('thread') || messageLower.includes('memory')) {
            if (messageLower.includes('process')) {
                return {
                    message: 'A process is a program in execution with its own memory space. Process states include new, ready, running, waiting, and terminated. The OS scheduler manages process execution using algorithms like Round Robin, Priority, or Shortest Job First.',
                    confidence: 0.9,
                    sources: ['Operating System Concepts', 'System Programming'],
                    follow_up_questions: [
                        'Do you need help with process scheduling algorithms?',
                        'Should I explain process vs thread differences?',
                        'Would you like to learn about inter-process communication?'
                    ]
                };
            } else if (messageLower.includes('memory')) {
                return {
                    message: 'Memory management handles allocation and deallocation of memory. Virtual memory uses paging/segmentation to provide larger address spaces. Techniques include demand paging, page replacement algorithms (LRU, FIFO), and memory protection.',
                    confidence: 0.9,
                    sources: ['Operating System Concepts', 'Memory Management'],
                    follow_up_questions: [
                        'Do you need help with virtual memory concepts?',
                        'Should I explain page replacement algorithms?',
                        'Would you like to learn about memory allocation strategies?'
                    ]
                };
            } else {
                return {
                    message: 'Operating Systems manage computer hardware and provide services to applications. Key functions include process management, memory management, file systems, and I/O handling. Examples include Windows, Linux, and macOS.',
                    confidence: 0.9,
                    sources: ['Operating System Concepts', 'System Design'],
                    follow_up_questions: [
                        'Which OS concept would you like to explore?',
                        'Do you need help with system calls?',
                        'Should I explain OS architecture?'
                    ]
                };
            }
        }
        
        // Engineering subjects
        else if (messageLower.includes('thermodynamics') || messageLower.includes('heat') || messageLower.includes('energy')) {
            return {
                message: 'Thermodynamics studies heat, work, and energy transfer. The First Law states energy is conserved (ΔU = Q - W). The Second Law introduces entropy and irreversibility. Applications include heat engines, refrigerators, and power cycles.',
                confidence: 0.9,
                sources: ['Thermodynamics Textbook', 'Engineering Fundamentals'],
                follow_up_questions: [
                    'Do you need help with thermodynamic laws?',
                    'Should I explain heat engine cycles?',
                    'Would you like to learn about entropy calculations?'
                ]
            };
        }
        
        // Handle common academic abbreviations and terms
        else if (messageLower.includes('cse') || messageLower.includes('computer science engineering')) {
            return {
                message: 'CSE stands for Computer Science Engineering. It\'s a branch of engineering that combines computer science principles with engineering practices. CSE covers programming, algorithms, data structures, software engineering, computer networks, databases, and system design.',
                confidence: 0.95,
                sources: ['Engineering Curriculum', 'Academic Standards'],
                follow_up_questions: [
                    'Would you like to know about CSE subjects and curriculum?',
                    'Do you need information about CSE career opportunities?',
                    'Should I explain the difference between CS and CSE?'
                ]
            };
        }
        else if (messageLower.includes('ece') || messageLower.includes('electronics')) {
            return {
                message: 'ECE stands for Electronics and Communication Engineering. It deals with electronic devices, circuits, communication systems, signal processing, and electromagnetic theory. Key areas include analog/digital electronics, microprocessors, and wireless communication.',
                confidence: 0.95,
                sources: ['Engineering Curriculum', 'Electronics Fundamentals'],
                follow_up_questions: [
                    'Would you like to learn about ECE core subjects?',
                    'Do you need help with electronics concepts?',
                    'Should I explain communication systems basics?'
                ]
            };
        }
        else if (messageLower.includes('mechanical') || messageLower.includes('mech')) {
            return {
                message: 'Mechanical Engineering deals with design, manufacturing, and maintenance of mechanical systems. Core subjects include thermodynamics, fluid mechanics, machine design, manufacturing processes, and materials science.',
                confidence: 0.95,
                sources: ['Mechanical Engineering Fundamentals', 'Engineering Curriculum'],
                follow_up_questions: [
                    'Which mechanical engineering subject interests you?',
                    'Do you need help with thermodynamics concepts?',
                    'Should I explain manufacturing processes?'
                ]
            };
        }
        // Default response for non-academic queries
        else {
            return {
                message: `I'm an academic tutor focused on helping with engineering and computer science studies. For "${message}", I'd be happy to help if it's related to your coursework. Please ask me about subjects like algorithms, data structures, programming, mathematics, physics, or engineering topics.`,
                confidence: 0.6,
                sources: ['Academic Tutor Guidelines'],
                follow_up_questions: [
                    'What subject would you like help with?',
                    'Do you have any programming questions?',
                    'Would you like help with engineering concepts?'
                ]
            };
        }
    }

    // =============================================
    // UTILITY METHODS
    // =============================================

    calculateScore(userAnswers, questions) {
        if (!userAnswers || !questions || questions.length === 0) return 0;

        let correct = 0;
        questions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            const correctAnswer = question.correctAnswer;
            
            if (userAnswer === correctAnswer) {
                correct++;
            }
        });

        return Math.round((correct / questions.length) * 100);
    }

    generateQuickFeedback(score, topic) {
        if (score >= 80) {
            return {
                message: `Excellent work on ${topic}! You've mastered the concepts.`,
                recommendations: [
                    'Try more challenging questions',
                    'Explore advanced topics',
                    'Help others learn'
                ],
                level: 'excellent'
            };
        } else if (score >= 60) {
            return {
                message: `Good progress on ${topic}! You're on the right track.`,
                recommendations: [
                    'Review the concepts you missed',
                    'Practice more questions',
                    'Focus on understanding'
                ],
                level: 'good'
            };
        } else {
            return {
                message: `Keep working on ${topic}. Practice makes perfect!`,
                recommendations: [
                    'Review fundamental concepts',
                    'Take your time to understand',
                    'Ask for help when needed'
                ],
                level: 'needs_improvement'
            };
        }
    }

    async generateAdaptiveQuestions(userPerformance, subject, difficulty = 'medium', count = 10) {
        try {
            // Analyze user's weak areas
            const weakAreas = this.identifyWeakAreas(userPerformance);
            const strongAreas = this.identifyStrongAreas(userPerformance);
            
            // Generate questions with 60% focus on weak areas, 40% mixed
            const weakAreaQuestions = Math.ceil(count * 0.6);
            const mixedQuestions = count - weakAreaQuestions;
            
            const questions = [];
            
            // Generate questions for weak areas
            for (let i = 0; i < weakAreaQuestions && i < weakAreas.length; i++) {
                const areaQuestions = await this.generateQuestions(
                    weakAreas[i], 
                    this.adjustDifficulty(difficulty, userPerformance[weakAreas[i]] || 0),
                    Math.ceil(weakAreaQuestions / weakAreas.length)
                );
                questions.push(...areaQuestions);
            }
            
            // Generate mixed questions
            const mixedTopics = [...weakAreas, ...strongAreas].slice(0, 3);
            for (const topic of mixedTopics) {
                if (questions.length < count) {
                    const topicQuestions = await this.generateQuestions(
                        topic,
                        difficulty,
                        Math.ceil(mixedQuestions / mixedTopics.length)
                    );
                    questions.push(...topicQuestions);
                }
            }
            
            return questions.slice(0, count);
        } catch (error) {
            console.error('Error generating adaptive questions:', error);
            return await this.generateQuestions(subject, difficulty, count);
        }
    }

    identifyWeakAreas(userPerformance) {
        return Object.entries(userPerformance)
            .filter(([_, score]) => score < 70)
            .sort(([_, a], [__, b]) => a - b)
            .map(([topic, _]) => topic)
            .slice(0, 3);
    }

    identifyStrongAreas(userPerformance) {
        return Object.entries(userPerformance)
            .filter(([_, score]) => score >= 80)
            .sort(([_, a], [__, b]) => b - a)
            .map(([topic, _]) => topic)
            .slice(0, 2);
    }

    adjustDifficulty(baseDifficulty, performanceScore) {
        if (performanceScore < 50) return 'easy';
        if (performanceScore < 70) return 'medium';
        return 'hard';
    }
}

// Export singleton instance
export default new APIService();
