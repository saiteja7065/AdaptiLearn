const admin = require('firebase-admin');
const { logger } = require('../utils/logger');

class FirebaseConnector {
    constructor() {
        this.firestore = admin.firestore();
        this.auth = admin.auth();
        this.storage = admin.storage();
        this.connectionHealthy = true;
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Initialize Firebase connection
     */
    async initialize() {
        try {
            // Test Firestore connection
            await this.firestore.collection('_health').limit(1).get();
            logger.info('Firebase Firestore connection established');

            // Test Auth connection
            await this.auth.listUsers(1);
            logger.info('Firebase Auth connection established');

            this.connectionHealthy = true;
            return true;

        } catch (error) {
            logger.error('Failed to initialize Firebase connection:', error);
            this.connectionHealthy = false;
            throw error;
        }
    }

    /**
     * Execute Firestore operation with retry logic
     */
    async executeWithRetry(operation, operationName = 'operation') {
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const result = await operation();
                this.connectionHealthy = true;
                return result;

            } catch (error) {
                logger.warn(`${operationName} attempt ${attempt} failed:`, error.message);

                if (attempt === this.retryAttempts) {
                    this.connectionHealthy = false;
                    throw error;
                }

                // Wait before retry
                await this.delay(this.retryDelay * attempt);
            }
        }
    }

    /**
     * Get user data from Firebase Auth
     */
    async getUserData(userId) {
        return this.executeWithRetry(async () => {
            const userRecord = await this.auth.getUser(userId);
            return {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                photoURL: userRecord.photoURL,
                emailVerified: userRecord.emailVerified,
                disabled: userRecord.disabled,
                metadata: {
                    creationTime: userRecord.metadata.creationTime,
                    lastSignInTime: userRecord.metadata.lastSignInTime
                },
                customClaims: userRecord.customClaims || {}
            };
        }, 'getUserData');
    }

    /**
     * Create or update user profile
     */
    async updateUserProfile(userId, profileData) {
        return this.executeWithRetry(async () => {
            const userRef = this.firestore.collection('users').doc(userId);
            
            const updateData = {
                ...profileData,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            };

            await userRef.set(updateData, { merge: true });
            
            logger.info(`User profile updated for: ${userId}`);
            return updateData;

        }, 'updateUserProfile');
    }

    /**
     * Get user assessments
     */
    async getUserAssessments(userId, limit = 10) {
        return this.executeWithRetry(async () => {
            const assessmentsSnapshot = await this.firestore
                .collection('assessments')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            return assessmentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        }, 'getUserAssessments');
    }

    /**
     * Save assessment results
     */
    async saveAssessmentResults(userId, assessmentData) {
        return this.executeWithRetry(async () => {
            const assessmentRef = this.firestore.collection('assessments').doc();
            
            const saveData = {
                ...assessmentData,
                userId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await assessmentRef.set(saveData);
            
            // Also update user progress
            await this.updateUserProgress(userId, assessmentData);

            logger.info(`Assessment results saved for user: ${userId}`);
            return assessmentRef.id;

        }, 'saveAssessmentResults');
    }

    /**
     * Update user progress
     */
    async updateUserProgress(userId, assessmentData) {
        return this.executeWithRetry(async () => {
            const progressRef = this.firestore.collection('userProgress').doc(userId);
            
            const progressDoc = await progressRef.get();
            let progressData = progressDoc.exists ? progressDoc.data() : {
                userId,
                totalAssessments: 0,
                totalScore: 0,
                averageScore: 0,
                subjectProgress: {},
                lastActivity: null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // Update overall progress
            progressData.totalAssessments += 1;
            progressData.totalScore += assessmentData.score || 0;
            progressData.averageScore = progressData.totalScore / progressData.totalAssessments;
            progressData.lastActivity = admin.firestore.FieldValue.serverTimestamp();

            // Update subject-specific progress
            const subject = assessmentData.subject || 'general';
            if (!progressData.subjectProgress[subject]) {
                progressData.subjectProgress[subject] = {
                    attempts: 0,
                    totalScore: 0,
                    averageScore: 0,
                    lastAttempt: null
                };
            }

            const subjectData = progressData.subjectProgress[subject];
            subjectData.attempts += 1;
            subjectData.totalScore += assessmentData.score || 0;
            subjectData.averageScore = subjectData.totalScore / subjectData.attempts;
            subjectData.lastAttempt = admin.firestore.FieldValue.serverTimestamp();

            progressData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

            await progressRef.set(progressData, { merge: true });
            
            logger.info(`User progress updated for: ${userId}`);
            return progressData;

        }, 'updateUserProgress');
    }

    /**
     * Get user progress
     */
    async getUserProgress(userId) {
        return this.executeWithRetry(async () => {
            const progressDoc = await this.firestore
                .collection('userProgress')
                .doc(userId)
                .get();

            if (!progressDoc.exists) {
                return null;
            }

            return {
                id: progressDoc.id,
                ...progressDoc.data()
            };

        }, 'getUserProgress');
    }

    /**
     * Store generated questions
     */
    async storeQuestions(questions, metadata = {}) {
        return this.executeWithRetry(async () => {
            const batch = this.firestore.batch();
            const questionRefs = [];

            for (const question of questions) {
                const questionRef = this.firestore.collection('questions').doc();
                questionRefs.push(questionRef);

                const questionData = {
                    ...question,
                    ...metadata,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                };

                batch.set(questionRef, questionData);
            }

            await batch.commit();
            
            logger.info(`Stored ${questions.length} questions in Firebase`);
            return questionRefs.map(ref => ref.id);

        }, 'storeQuestions');
    }

    /**
     * Get questions by criteria
     */
    async getQuestions(criteria = {}, limit = 10) {
        return this.executeWithRetry(async () => {
            let query = this.firestore.collection('questions');

            // Apply filters
            if (criteria.subject) {
                query = query.where('subject', '==', criteria.subject);
            }
            if (criteria.difficulty) {
                query = query.where('difficulty', '==', criteria.difficulty);
            }
            if (criteria.topic) {
                query = query.where('topic', '==', criteria.topic);
            }

            query = query.limit(limit);

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        }, 'getQuestions');
    }

    /**
     * Upload file to Firebase Storage
     */
    async uploadFile(filePath, fileName, metadata = {}) {
        return this.executeWithRetry(async () => {
            const bucket = this.storage.bucket();
            const file = bucket.file(fileName);

            const uploadOptions = {
                metadata: {
                    metadata: {
                        ...metadata,
                        uploadedAt: new Date().toISOString()
                    }
                }
            };

            await bucket.upload(filePath, uploadOptions);
            
            // Get download URL
            const [url] = await file.getSignedUrl({
                action: 'read',
                expires: '03-09-2491' // Far future date
            });

            logger.info(`File uploaded to Firebase Storage: ${fileName}`);
            return url;

        }, 'uploadFile');
    }

    /**
     * Store syllabus data
     */
    async storeSyllabus(userId, syllabusData) {
        return this.executeWithRetry(async () => {
            const syllabusRef = this.firestore
                .collection('syllabi')
                .doc(userId);

            const saveData = {
                ...syllabusData,
                userId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await syllabusRef.set(saveData, { merge: true });
            
            logger.info(`Syllabus stored for user: ${userId}`);
            return syllabusRef.id;

        }, 'storeSyllabus');
    }

    /**
     * Get user syllabus
     */
    async getUserSyllabus(userId) {
        return this.executeWithRetry(async () => {
            const syllabusDoc = await this.firestore
                .collection('syllabi')
                .doc(userId)
                .get();

            if (!syllabusDoc.exists) {
                return null;
            }

            return {
                id: syllabusDoc.id,
                ...syllabusDoc.data()
            };

        }, 'getUserSyllabus');
    }

    /**
     * Store analytics data
     */
    async storeAnalytics(analyticsData) {
        return this.executeWithRetry(async () => {
            const analyticsRef = this.firestore.collection('analytics').doc();
            
            const saveData = {
                ...analyticsData,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            };

            await analyticsRef.set(saveData);
            
            return analyticsRef.id;

        }, 'storeAnalytics');
    }

    /**
     * Get system analytics
     */
    async getSystemAnalytics(timeRange = '7d') {
        return this.executeWithRetry(async () => {
            const endDate = new Date();
            const startDate = new Date();
            
            switch (timeRange) {
                case '24h':
                    startDate.setDate(endDate.getDate() - 1);
                    break;
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                default:
                    startDate.setDate(endDate.getDate() - 7);
            }

            const analyticsSnapshot = await this.firestore
                .collection('analytics')
                .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
                .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
                .get();

            return analyticsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        }, 'getSystemAnalytics');
    }

    /**
     * Batch operations for better performance
     */
    async batchWrite(operations) {
        return this.executeWithRetry(async () => {
            const batch = this.firestore.batch();
            
            for (const operation of operations) {
                const { type, ref, data } = operation;
                
                switch (type) {
                    case 'set':
                        batch.set(ref, data);
                        break;
                    case 'update':
                        batch.update(ref, data);
                        break;
                    case 'delete':
                        batch.delete(ref);
                        break;
                    default:
                        logger.warn(`Unknown batch operation type: ${type}`);
                }
            }

            await batch.commit();
            logger.info(`Batch operation completed with ${operations.length} operations`);

        }, 'batchWrite');
    }

    /**
     * Check connection health
     */
    async checkHealth() {
        try {
            await this.firestore.collection('_health').limit(1).get();
            this.connectionHealthy = true;
            return { healthy: true, timestamp: new Date() };

        } catch (error) {
            this.connectionHealthy = false;
            logger.error('Firebase health check failed:', error);
            return { 
                healthy: false, 
                error: error.message, 
                timestamp: new Date() 
            };
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            healthy: this.connectionHealthy,
            retryAttempts: this.retryAttempts,
            lastCheck: new Date()
        };
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create real-time listener
     */
    createListener(collection, callback, filters = {}) {
        try {
            let query = this.firestore.collection(collection);

            // Apply filters
            for (const [field, value] of Object.entries(filters)) {
                query = query.where(field, '==', value);
            }

            const unsubscribe = query.onSnapshot(
                (snapshot) => {
                    const data = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    callback(data);
                },
                (error) => {
                    logger.error(`Real-time listener error for ${collection}:`, error);
                    callback(null, error);
                }
            );

            logger.info(`Real-time listener created for collection: ${collection}`);
            return unsubscribe;

        } catch (error) {
            logger.error('Error creating real-time listener:', error);
            throw error;
        }
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        try {
            // Cleanup can include closing connections, clearing caches, etc.
            logger.info('Firebase connector cleanup completed');
        } catch (error) {
            logger.error('Error during Firebase connector cleanup:', error);
        }
    }
}

module.exports = new FirebaseConnector();
