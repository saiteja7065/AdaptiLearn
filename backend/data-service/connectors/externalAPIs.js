const axios = require('axios');
const { logger } = require('../utils/logger');

class ExternalAPIConnector {
    constructor() {
        this.baseConfig = {
            timeout: 30000,
            headers: {
                'User-Agent': 'AdaptiLearn/1.0'
            }
        };
        this.rateLimits = new Map();
    }

    /**
     * Question Bank API Connector
     */
    async fetchQuestionsFromBank(subject, difficulty, count = 10) {
        try {
            const apiKey = process.env.QUESTION_BANK_API_KEY;
            const baseUrl = process.env.QUESTION_BANK_API_URL;

            if (!apiKey || !baseUrl) {
                logger.warn('Question bank API credentials not configured');
                return this.getFallbackQuestions(subject, difficulty, count);
            }

            // Check rate limits
            if (!this.checkRateLimit('question_bank')) {
                logger.warn('Question bank API rate limit exceeded');
                return this.getFallbackQuestions(subject, difficulty, count);
            }

            const response = await axios.get(`${baseUrl}/questions`, {
                ...this.baseConfig,
                params: {
                    subject,
                    difficulty,
                    limit: count,
                    format: 'mcq'
                },
                headers: {
                    ...this.baseConfig.headers,
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            this.updateRateLimit('question_bank');

            return this.formatQuestions(response.data.questions || []);

        } catch (error) {
            logger.error('Error fetching from question bank:', error);
            return this.getFallbackQuestions(subject, difficulty, count);
        }
    }

    /**
     * Educational Content API Connector
     */
    async fetchEducationalContent(topic, contentType = 'explanation') {
        try {
            const apiKey = process.env.EDUCATION_API_KEY;
            const baseUrl = process.env.EDUCATION_API_URL || 'https://api.education.com/v1';

            if (!apiKey) {
                logger.warn('Education API credentials not configured');
                return this.getFallbackContent(topic, contentType);
            }

            if (!this.checkRateLimit('education_api')) {
                logger.warn('Education API rate limit exceeded');
                return this.getFallbackContent(topic, contentType);
            }

            const response = await axios.get(`${baseUrl}/content`, {
                ...this.baseConfig,
                params: {
                    topic,
                    type: contentType,
                    format: 'text'
                },
                headers: {
                    ...this.baseConfig.headers,
                    'X-API-Key': apiKey
                }
            });

            this.updateRateLimit('education_api');

            return {
                topic,
                content: response.data.content,
                source: 'education_api',
                confidence: response.data.confidence || 0.8,
                lastUpdated: new Date()
            };

        } catch (error) {
            logger.error('Error fetching educational content:', error);
            return this.getFallbackContent(topic, contentType);
        }
    }

    /**
     * Syllabus Standards API Connector
     */
    async fetchSyllabusStandards(board, grade, subject) {
        try {
            const apiKey = process.env.SYLLABUS_API_KEY;
            const baseUrl = process.env.SYLLABUS_API_URL;

            if (!apiKey || !baseUrl) {
                logger.warn('Syllabus API credentials not configured');
                return this.getFallbackSyllabus(board, grade, subject);
            }

            if (!this.checkRateLimit('syllabus_api')) {
                logger.warn('Syllabus API rate limit exceeded');
                return this.getFallbackSyllabus(board, grade, subject);
            }

            const response = await axios.get(`${baseUrl}/syllabus`, {
                ...this.baseConfig,
                params: {
                    board: board.toLowerCase(),
                    grade,
                    subject: subject.toLowerCase()
                },
                headers: {
                    ...this.baseConfig.headers,
                    'Authorization': `Api-Key ${apiKey}`
                }
            });

            this.updateRateLimit('syllabus_api');

            return {
                board,
                grade,
                subject,
                topics: response.data.topics || [],
                standards: response.data.standards || [],
                learningObjectives: response.data.learning_objectives || [],
                source: 'syllabus_api',
                lastUpdated: new Date()
            };

        } catch (error) {
            logger.error('Error fetching syllabus standards:', error);
            return this.getFallbackSyllabus(board, grade, subject);
        }
    }

    /**
     * Academic Research API Connector
     */
    async fetchAcademicResources(query, limit = 5) {
        try {
            const apiKey = process.env.ACADEMIC_API_KEY;
            const baseUrl = process.env.ACADEMIC_API_URL || 'https://api.semanticscholar.org/v1';

            if (!this.checkRateLimit('academic_api')) {
                logger.warn('Academic API rate limit exceeded');
                return this.getFallbackResources(query, limit);
            }

            const response = await axios.get(`${baseUrl}/paper/search`, {
                ...this.baseConfig,
                params: {
                    query,
                    limit,
                    fields: 'title,abstract,authors,year,url'
                },
                headers: {
                    ...this.baseConfig.headers,
                    ...(apiKey && { 'x-api-key': apiKey })
                }
            });

            this.updateRateLimit('academic_api');

            return {
                query,
                papers: (response.data.papers || []).map(paper => ({
                    title: paper.title,
                    abstract: paper.abstract,
                    authors: paper.authors?.map(a => a.name).join(', ') || 'Unknown',
                    year: paper.year,
                    url: paper.url,
                    relevanceScore: this.calculateRelevance(query, paper)
                })),
                source: 'academic_api',
                lastUpdated: new Date()
            };

        } catch (error) {
            logger.error('Error fetching academic resources:', error);
            return this.getFallbackResources(query, limit);
        }
    }

    /**
     * Educational Video API Connector
     */
    async fetchEducationalVideos(topic, duration = 'medium') {
        try {
            const apiKey = process.env.YOUTUBE_API_KEY;
            const baseUrl = 'https://www.googleapis.com/youtube/v3';

            if (!apiKey) {
                logger.warn('YouTube API key not configured');
                return this.getFallbackVideos(topic);
            }

            if (!this.checkRateLimit('youtube_api')) {
                logger.warn('YouTube API rate limit exceeded');
                return this.getFallbackVideos(topic);
            }

            const durationFilter = this.getDurationFilter(duration);
            const searchQuery = `${topic} tutorial education lesson`;

            const response = await axios.get(`${baseUrl}/search`, {
                ...this.baseConfig,
                params: {
                    key: apiKey,
                    q: searchQuery,
                    part: 'snippet',
                    type: 'video',
                    maxResults: 10,
                    order: 'relevance',
                    videoDuration: durationFilter,
                    videoEmbeddable: 'true',
                    videoSyndicated: 'true'
                }
            });

            this.updateRateLimit('youtube_api');

            return {
                topic,
                videos: response.data.items.map(item => ({
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnail: item.snippet.thumbnails.medium?.url,
                    videoId: item.id.videoId,
                    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                    channel: item.snippet.channelTitle,
                    publishedAt: item.snippet.publishedAt
                })),
                source: 'youtube_api',
                lastUpdated: new Date()
            };

        } catch (error) {
            logger.error('Error fetching educational videos:', error);
            return this.getFallbackVideos(topic);
        }
    }

    /**
     * Rate limiting check
     */
    checkRateLimit(apiName) {
        const now = Date.now();
        const limits = {
            question_bank: { requests: 100, window: 3600000 }, // 100 per hour
            education_api: { requests: 50, window: 3600000 },  // 50 per hour
            syllabus_api: { requests: 200, window: 3600000 },  // 200 per hour
            academic_api: { requests: 30, window: 3600000 },   // 30 per hour
            youtube_api: { requests: 100, window: 3600000 }    // 100 per hour
        };

        const limit = limits[apiName];
        if (!limit) return true;

        const rateLimitData = this.rateLimits.get(apiName) || { requests: 0, windowStart: now };

        // Reset window if expired
        if (now - rateLimitData.windowStart > limit.window) {
            rateLimitData.requests = 0;
            rateLimitData.windowStart = now;
        }

        return rateLimitData.requests < limit.requests;
    }

    /**
     * Update rate limit counter
     */
    updateRateLimit(apiName) {
        const now = Date.now();
        const rateLimitData = this.rateLimits.get(apiName) || { requests: 0, windowStart: now };
        
        rateLimitData.requests++;
        this.rateLimits.set(apiName, rateLimitData);
    }

    /**
     * Format questions from external API
     */
    formatQuestions(questions) {
        return questions.map(q => ({
            id: q.id || this.generateQuestionId(),
            question: q.question || q.text,
            options: q.options || q.choices || [],
            correctAnswer: q.correct_answer || q.answer,
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'medium',
            topic: q.topic || q.subject || '',
            source: 'external_api',
            createdAt: new Date()
        }));
    }

    /**
     * Generate fallback questions
     */
    getFallbackQuestions(subject, difficulty, count) {
        const templates = {
            mathematics: [
                'What is the result of {operation}?',
                'Solve for x in the equation: {equation}',
                'Find the {calculation} of {expression}'
            ],
            science: [
                'What is the {concept} in {topic}?',
                'Which of the following is true about {phenomenon}?',
                'The {property} of {element} is:'
            ],
            english: [
                'What is the {grammar_concept} in this sentence?',
                'Identify the {literary_device} in the passage',
                'Choose the correct {word_type}:'
            ]
        };

        const subjectTemplates = templates[subject.toLowerCase()] || templates.science;
        const questions = [];

        for (let i = 0; i < count; i++) {
            const template = subjectTemplates[i % subjectTemplates.length];
            questions.push({
                id: this.generateQuestionId(),
                question: `Sample question ${i + 1}: ${template}`,
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 'Option A',
                explanation: 'This is a fallback question generated locally.',
                difficulty,
                topic: subject,
                source: 'fallback',
                createdAt: new Date()
            });
        }

        return questions;
    }

    /**
     * Get fallback educational content
     */
    getFallbackContent(topic, contentType) {
        const content = {
            explanation: `This is a basic explanation of ${topic}. The concept involves understanding the fundamental principles and applications. For detailed information, please refer to your textbooks or consult with your instructor.`,
            summary: `${topic} - Key points: Definition, characteristics, applications, and examples.`,
            examples: `Common examples of ${topic} include practical applications and real-world scenarios.`
        };

        return {
            topic,
            content: content[contentType] || content.explanation,
            source: 'fallback',
            confidence: 0.5,
            lastUpdated: new Date()
        };
    }

    /**
     * Get fallback syllabus
     */
    getFallbackSyllabus(board, grade, subject) {
        const commonTopics = {
            mathematics: ['Numbers', 'Algebra', 'Geometry', 'Statistics', 'Probability'],
            science: ['Physics', 'Chemistry', 'Biology', 'Environmental Science'],
            english: ['Grammar', 'Literature', 'Writing', 'Reading Comprehension'],
            social_studies: ['History', 'Geography', 'Civics', 'Economics']
        };

        return {
            board,
            grade,
            subject,
            topics: commonTopics[subject.toLowerCase()] || ['General Topics'],
            standards: ['Basic understanding', 'Application', 'Analysis'],
            learningObjectives: ['Understand concepts', 'Apply knowledge', 'Solve problems'],
            source: 'fallback',
            lastUpdated: new Date()
        };
    }

    /**
     * Get fallback academic resources
     */
    getFallbackResources(query, limit) {
        return {
            query,
            papers: [{
                title: `Research on ${query}`,
                abstract: `This paper discusses various aspects of ${query} and its applications in educational contexts.`,
                authors: 'Educational Research Team',
                year: new Date().getFullYear(),
                url: '#',
                relevanceScore: 0.5
            }],
            source: 'fallback',
            lastUpdated: new Date()
        };
    }

    /**
     * Get fallback videos
     */
    getFallbackVideos(topic) {
        return {
            topic,
            videos: [{
                title: `Introduction to ${topic}`,
                description: `Educational video covering the basics of ${topic}`,
                thumbnail: '/default-thumbnail.jpg',
                videoId: 'sample',
                url: '#',
                channel: 'AdaptiLearn Education',
                publishedAt: new Date().toISOString()
            }],
            source: 'fallback',
            lastUpdated: new Date()
        };
    }

    /**
     * Get duration filter for YouTube
     */
    getDurationFilter(duration) {
        const filters = {
            short: 'short',    // < 4 minutes
            medium: 'medium',  // 4-20 minutes
            long: 'long'       // > 20 minutes
        };
        return filters[duration] || 'medium';
    }

    /**
     * Calculate relevance score
     */
    calculateRelevance(query, paper) {
        if (!paper.title && !paper.abstract) return 0;

        const queryWords = query.toLowerCase().split(/\s+/);
        const paperText = `${paper.title || ''} ${paper.abstract || ''}`.toLowerCase();
        
        let matches = 0;
        for (const word of queryWords) {
            if (paperText.includes(word)) {
                matches++;
            }
        }

        return Math.min(matches / queryWords.length, 1);
    }

    /**
     * Generate question ID
     */
    generateQuestionId() {
        return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Test API connectivity
     */
    async testConnectivity() {
        const results = {
            question_bank: false,
            education_api: false,
            syllabus_api: false,
            academic_api: false,
            youtube_api: false
        };

        // Test each API with a simple request
        try {
            if (process.env.QUESTION_BANK_API_URL && process.env.QUESTION_BANK_API_KEY) {
                await axios.get(`${process.env.QUESTION_BANK_API_URL}/health`, {
                    timeout: 5000,
                    headers: { 'Authorization': `Bearer ${process.env.QUESTION_BANK_API_KEY}` }
                });
                results.question_bank = true;
            }
        } catch (error) {
            logger.debug('Question bank API not accessible');
        }

        try {
            if (process.env.YOUTUBE_API_KEY) {
                await axios.get('https://www.googleapis.com/youtube/v3/search', {
                    timeout: 5000,
                    params: {
                        key: process.env.YOUTUBE_API_KEY,
                        q: 'test',
                        part: 'snippet',
                        maxResults: 1
                    }
                });
                results.youtube_api = true;
            }
        } catch (error) {
            logger.debug('YouTube API not accessible');
        }

        return results;
    }
}

module.exports = new ExternalAPIConnector();
