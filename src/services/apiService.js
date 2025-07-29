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

    // =============================================
    // AI SERVICE METHODS (Question Generation)
    // =============================================

    async generateQuestions(topic, difficulty = 'medium', count = 5) {
        try {
            const response = await this.apiCall(`${this.AI_SERVICE_URL}/api/generate-questions`, {
                method: 'POST',
                body: JSON.stringify({
                    topic,
                    difficulty,
                    count,
                    question_type: 'mcq'
                })
            });

            return response.questions || [];
        } catch (error) {
            console.error('Error generating questions:', error);
            // Fallback to mock questions for demo
            return this.getFallbackQuestions(topic, count);
        }
    }

    async analyzeContent(content, content_type = 'text') {
        try {
            const response = await this.apiCall(`${this.AI_SERVICE_URL}/api/analyze-content`, {
                method: 'POST',
                body: JSON.stringify({
                    content,
                    content_type
                })
            });

            return response.analysis || {};
        } catch (error) {
            console.error('Error analyzing content:', error);
            return { topics: [], difficulty: 'medium' };
        }
    }

    async generateFeedback(userAnswers, questions) {
        try {
            const response = await this.apiCall(`${this.AI_SERVICE_URL}/api/generate-feedback`, {
                method: 'POST',
                body: JSON.stringify({
                    user_answers: userAnswers,
                    questions: questions
                })
            });

            return response.feedback || {};
        } catch (error) {
            console.error('Error generating feedback:', error);
            return { score: 0, recommendations: [] };
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
}

// Export singleton instance
export default new APIService();
