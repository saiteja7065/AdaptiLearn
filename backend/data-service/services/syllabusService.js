const admin = require('firebase-admin');
const { logger } = require('../utils/logger');
const analyticsService = require('./analyticsService');

class SyllabusService {
    constructor() {
        this.firestore = admin.firestore();
        this.cache = new Map();
        this.cacheExpiry = 1000 * 60 * 60; // 1 hour
    }

    /**
     * Process and analyze syllabus content
     */
    async processSyllabus(syllabusData, userId) {
        try {
            logger.info(`Processing syllabus for user: ${userId}`);

            // Validate syllabus data
            const validatedData = this.validateSyllabusStructure(syllabusData);
            
            // Extract key topics and concepts
            const extractedTopics = await this.extractTopics(validatedData);
            
            // Generate learning objectives
            const learningObjectives = await this.generateLearningObjectives(extractedTopics);
            
            // Create difficulty mapping
            const difficultyMapping = this.createDifficultyMapping(extractedTopics);
            
            // Store processed syllabus
            const processedSyllabus = {
                originalData: validatedData,
                extractedTopics,
                learningObjectives,
                difficultyMapping,
                processedAt: new Date(),
                userId,
                version: '1.0'
            };

            await this.storeSyllabus(userId, processedSyllabus);
            
            // Track analytics
            await analyticsService.trackSyllabusProcessed(userId, extractedTopics.length);
            
            return processedSyllabus;

        } catch (error) {
            logger.error('Error processing syllabus:', error);
            throw new Error(`Syllabus processing failed: ${error.message}`);
        }
    }

    /**
     * Validate syllabus structure
     */
    validateSyllabusStructure(syllabusData) {
        const required = ['subject', 'grade', 'board', 'topics'];
        
        for (const field of required) {
            if (!syllabusData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (!Array.isArray(syllabusData.topics) || syllabusData.topics.length === 0) {
            throw new Error('Topics must be a non-empty array');
        }

        return {
            ...syllabusData,
            validatedAt: new Date(),
            structure: 'validated'
        };
    }

    /**
     * Extract topics and subtopics from syllabus
     */
    async extractTopics(syllabusData) {
        try {
            const topics = [];
            
            for (const topic of syllabusData.topics) {
                const processedTopic = {
                    id: this.generateTopicId(topic.name),
                    name: topic.name,
                    subtopics: [],
                    concepts: [],
                    difficulty: topic.difficulty || 'medium',
                    estimatedTime: topic.estimatedTime || 60, // minutes
                    prerequisites: topic.prerequisites || [],
                    learningOutcomes: topic.learningOutcomes || []
                };

                // Process subtopics if they exist
                if (topic.subtopics && Array.isArray(topic.subtopics)) {
                    for (const subtopic of topic.subtopics) {
                        processedTopic.subtopics.push({
                            id: this.generateTopicId(subtopic.name || subtopic),
                            name: subtopic.name || subtopic,
                            concepts: subtopic.concepts || [],
                            difficulty: subtopic.difficulty || processedTopic.difficulty
                        });
                    }
                }

                // Extract key concepts
                processedTopic.concepts = this.extractConcepts(topic);
                
                topics.push(processedTopic);
            }

            return topics;

        } catch (error) {
            logger.error('Error extracting topics:', error);
            throw error;
        }
    }

    /**
     * Extract key concepts from topic
     */
    extractConcepts(topic) {
        const concepts = [];
        
        // Extract from topic description
        if (topic.description) {
            const extracted = this.extractConceptsFromText(topic.description);
            concepts.push(...extracted);
        }

        // Extract from explicit concepts list
        if (topic.concepts && Array.isArray(topic.concepts)) {
            concepts.push(...topic.concepts);
        }

        // Extract from learning outcomes
        if (topic.learningOutcomes && Array.isArray(topic.learningOutcomes)) {
            const fromOutcomes = topic.learningOutcomes
                .flatMap(outcome => this.extractConceptsFromText(outcome));
            concepts.push(...fromOutcomes);
        }

        // Remove duplicates and filter
        return [...new Set(concepts)]
            .filter(concept => concept.length > 2)
            .slice(0, 10); // Limit to top 10 concepts
    }

    /**
     * Extract concepts from text using simple NLP
     */
    extractConceptsFromText(text) {
        if (!text || typeof text !== 'string') return [];

        // Simple keyword extraction
        const keywords = text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3)
            .filter(word => !this.isStopWord(word));

        // Extract noun phrases (simplified)
        const concepts = [];
        const words = text.split(/\s+/);
        
        for (let i = 0; i < words.length - 1; i++) {
            const phrase = words.slice(i, i + 2).join(' ');
            if (phrase.length > 5 && !this.containsStopWord(phrase)) {
                concepts.push(phrase);
            }
        }

        return [...new Set([...keywords, ...concepts])].slice(0, 5);
    }

    /**
     * Check if word is a stop word
     */
    isStopWord(word) {
        const stopWords = [
            'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
            'those', 'will', 'would', 'could', 'should', 'must', 'can', 'may'
        ];
        return stopWords.includes(word.toLowerCase());
    }

    /**
     * Check if phrase contains stop words
     */
    containsStopWord(phrase) {
        return phrase.toLowerCase().split(/\s+/).some(word => this.isStopWord(word));
    }

    /**
     * Generate learning objectives from topics
     */
    async generateLearningObjectives(topics) {
        const objectives = [];

        for (const topic of topics) {
            const topicObjectives = {
                topicId: topic.id,
                topicName: topic.name,
                objectives: []
            };

            // Generate objectives based on difficulty level
            const templates = this.getObjectiveTemplates(topic.difficulty);
            
            for (const concept of topic.concepts.slice(0, 3)) {
                const template = templates[Math.floor(Math.random() * templates.length)];
                topicObjectives.objectives.push(
                    template.replace('[CONCEPT]', concept).replace('[TOPIC]', topic.name)
                );
            }

            // Add existing learning outcomes
            if (topic.learningOutcomes && topic.learningOutcomes.length > 0) {
                topicObjectives.objectives.push(...topic.learningOutcomes);
            }

            objectives.push(topicObjectives);
        }

        return objectives;
    }

    /**
     * Get objective templates based on difficulty
     */
    getObjectiveTemplates(difficulty) {
        const templates = {
            easy: [
                "Understand the basic concept of [CONCEPT]",
                "Identify key features of [CONCEPT]",
                "Recall fundamental principles of [TOPIC]"
            ],
            medium: [
                "Analyze the relationship between [CONCEPT] and related topics",
                "Apply knowledge of [CONCEPT] to solve problems",
                "Explain the significance of [CONCEPT] in [TOPIC]"
            ],
            hard: [
                "Evaluate different approaches to [CONCEPT]",
                "Create solutions using advanced [CONCEPT] techniques",
                "Synthesize complex ideas related to [CONCEPT] and [TOPIC]"
            ]
        };

        return templates[difficulty] || templates.medium;
    }

    /**
     * Create difficulty mapping for topics
     */
    createDifficultyMapping(topics) {
        const mapping = {
            easy: [],
            medium: [],
            hard: []
        };

        for (const topic of topics) {
            const difficulty = topic.difficulty || 'medium';
            mapping[difficulty].push({
                topicId: topic.id,
                name: topic.name,
                estimatedTime: topic.estimatedTime,
                conceptCount: topic.concepts.length
            });
        }

        return mapping;
    }

    /**
     * Store processed syllabus in Firestore
     */
    async storeSyllabus(userId, processedSyllabus) {
        try {
            const docRef = this.firestore
                .collection('processedSyllabi')
                .doc(userId);

            await docRef.set(processedSyllabus, { merge: true });
            
            // Cache the result
            this.cache.set(userId, {
                data: processedSyllabus,
                timestamp: Date.now()
            });

            logger.info(`Stored processed syllabus for user: ${userId}`);
            return docRef.id;

        } catch (error) {
            logger.error('Error storing syllabus:', error);
            throw error;
        }
    }

    /**
     * Get processed syllabus for user
     */
    async getSyllabus(userId) {
        try {
            // Check cache first
            const cached = this.cache.get(userId);
            if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
                return cached.data;
            }

            // Fetch from Firestore
            const doc = await this.firestore
                .collection('processedSyllabi')
                .doc(userId)
                .get();

            if (!doc.exists) {
                return null;
            }

            const data = doc.data();
            
            // Update cache
            this.cache.set(userId, {
                data,
                timestamp: Date.now()
            });

            return data;

        } catch (error) {
            logger.error('Error getting syllabus:', error);
            throw error;
        }
    }

    /**
     * Generate topic ID
     */
    generateTopicId(topicName) {
        return topicName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    /**
     * Get syllabus statistics
     */
    async getSyllabusStats(userId) {
        try {
            const syllabus = await this.getSyllabus(userId);
            if (!syllabus) {
                return null;
            }

            const stats = {
                totalTopics: syllabus.extractedTopics.length,
                totalConcepts: syllabus.extractedTopics.reduce(
                    (sum, topic) => sum + topic.concepts.length, 0
                ),
                difficultyDistribution: {
                    easy: syllabus.difficultyMapping.easy.length,
                    medium: syllabus.difficultyMapping.medium.length,
                    hard: syllabus.difficultyMapping.hard.length
                },
                estimatedTotalTime: syllabus.extractedTopics.reduce(
                    (sum, topic) => sum + (topic.estimatedTime || 60), 0
                ),
                processedAt: syllabus.processedAt
            };

            return stats;

        } catch (error) {
            logger.error('Error getting syllabus stats:', error);
            throw error;
        }
    }
}

module.exports = new SyllabusService();
