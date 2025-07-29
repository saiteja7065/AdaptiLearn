const admin = require('firebase-admin');
const { logger } = require('../utils/logger');

class AnalyticsService {
    constructor() {
        this.firestore = admin.firestore();
        this.analyticsQueue = [];
        this.batchSize = parseInt(process.env.ANALYTICS_BATCH_SIZE) || 100;
        this.flushInterval = 30000; // 30 seconds
        this.startBatchProcessor();
    }

    /**
     * Track user session
     */
    async trackSession(userId, sessionData) {
        try {
            const sessionDoc = {
                userId,
                startTime: new Date(),
                endTime: null,
                duration: 0,
                platform: sessionData.platform || 'web',
                userAgent: sessionData.userAgent,
                ipAddress: sessionData.ipAddress,
                activities: [],
                createdAt: new Date()
            };

            const docRef = await this.firestore
                .collection('userSessions')
                .add(sessionDoc);

            logger.info(`Session tracked for user: ${userId}`);
            return docRef.id;

        } catch (error) {
            logger.error('Error tracking session:', error);
            throw error;
        }
    }

    /**
     * Track user activity
     */
    async trackActivity(userId, activityType, metadata = {}) {
        const activity = {
            userId,
            type: activityType,
            timestamp: new Date(),
            metadata,
            sessionId: metadata.sessionId || null
        };

        // Add to queue for batch processing
        this.analyticsQueue.push({
            collection: 'userActivities',
            data: activity
        });

        // Also track real-time critical activities
        if (this.isCriticalActivity(activityType)) {
            await this.trackRealTime(activity);
        }
    }

    /**
     * Track assessment performance
     */
    async trackAssessmentPerformance(userId, assessmentData) {
        try {
            const performance = {
                userId,
                assessmentId: assessmentData.assessmentId,
                score: assessmentData.score,
                totalQuestions: assessmentData.totalQuestions,
                correctAnswers: assessmentData.correctAnswers,
                timeSpent: assessmentData.timeSpent,
                difficulty: assessmentData.difficulty,
                topics: assessmentData.topics || [],
                answers: assessmentData.answers || [],
                submittedAt: new Date(),
                analysisResults: {
                    strengthAreas: [],
                    weaknessAreas: [],
                    recommendations: []
                }
            };

            // Analyze performance
            const analysis = await this.analyzePerformance(performance);
            performance.analysisResults = analysis;

            // Store performance data
            await this.firestore
                .collection('assessmentPerformances')
                .add(performance);

            // Update user progress
            await this.updateUserProgress(userId, performance);

            logger.info(`Assessment performance tracked for user: ${userId}`);
            return performance;

        } catch (error) {
            logger.error('Error tracking assessment performance:', error);
            throw error;
        }
    }

    /**
     * Analyze user performance
     */
    async analyzePerformance(performance) {
        try {
            const analysis = {
                strengthAreas: [],
                weaknessAreas: [],
                recommendations: [],
                difficultyTrends: {},
                topicMastery: {}
            };

            // Analyze topic performance
            const topicScores = {};
            for (const answer of performance.answers) {
                const topic = answer.topic || 'general';
                if (!topicScores[topic]) {
                    topicScores[topic] = { correct: 0, total: 0 };
                }
                topicScores[topic].total++;
                if (answer.isCorrect) {
                    topicScores[topic].correct++;
                }
            }

            // Identify strengths and weaknesses
            for (const [topic, scores] of Object.entries(topicScores)) {
                const accuracy = scores.correct / scores.total;
                analysis.topicMastery[topic] = accuracy;

                if (accuracy >= 0.8) {
                    analysis.strengthAreas.push(topic);
                } else if (accuracy < 0.6) {
                    analysis.weaknessAreas.push(topic);
                }
            }

            // Generate recommendations
            analysis.recommendations = this.generateRecommendations(analysis);

            return analysis;

        } catch (error) {
            logger.error('Error analyzing performance:', error);
            return {
                strengthAreas: [],
                weaknessAreas: [],
                recommendations: []
            };
        }
    }

    /**
     * Generate learning recommendations
     */
    generateRecommendations(analysis) {
        const recommendations = [];

        // Recommendations for weak areas
        for (const weakArea of analysis.weaknessAreas) {
            recommendations.push({
                type: 'improvement',
                topic: weakArea,
                message: `Focus more on ${weakArea} - consider reviewing fundamentals`,
                priority: 'high',
                suggestedActions: [
                    'Review theory materials',
                    'Practice more questions',
                    'Take focused mini-tests'
                ]
            });
        }

        // Recommendations for strong areas
        for (const strongArea of analysis.strengthAreas) {
            recommendations.push({
                type: 'advancement',
                topic: strongArea,
                message: `Great progress in ${strongArea} - try advanced level questions`,
                priority: 'medium',
                suggestedActions: [
                    'Attempt challenging questions',
                    'Explore advanced concepts',
                    'Help others in discussion forums'
                ]
            });
        }

        // General recommendations
        if (analysis.weaknessAreas.length > analysis.strengthAreas.length) {
            recommendations.push({
                type: 'general',
                message: 'Consider spacing out your study sessions for better retention',
                priority: 'medium',
                suggestedActions: [
                    'Take regular breaks',
                    'Review previous topics',
                    'Focus on understanding concepts'
                ]
            });
        }

        return recommendations;
    }

    /**
     * Update user progress
     */
    async updateUserProgress(userId, performance) {
        try {
            const userProgressRef = this.firestore
                .collection('userProgress')
                .doc(userId);

            const progressDoc = await userProgressRef.get();
            let progressData = progressDoc.exists ? progressDoc.data() : {
                userId,
                totalAssessments: 0,
                totalScore: 0,
                averageScore: 0,
                topicProgress: {},
                difficultyProgress: {
                    easy: { attempted: 0, correct: 0 },
                    medium: { attempted: 0, correct: 0 },
                    hard: { attempted: 0, correct: 0 }
                },
                lastUpdated: new Date(),
                createdAt: new Date()
            };

            // Update overall stats
            progressData.totalAssessments++;
            progressData.totalScore += performance.score;
            progressData.averageScore = progressData.totalScore / progressData.totalAssessments;

            // Update topic progress
            for (const [topic, mastery] of Object.entries(performance.analysisResults.topicMastery)) {
                if (!progressData.topicProgress[topic]) {
                    progressData.topicProgress[topic] = {
                        attempts: 0,
                        totalScore: 0,
                        averageScore: 0,
                        lastAttempt: null
                    };
                }

                const topicData = progressData.topicProgress[topic];
                topicData.attempts++;
                topicData.totalScore += mastery;
                topicData.averageScore = topicData.totalScore / topicData.attempts;
                topicData.lastAttempt = new Date();
            }

            // Update difficulty progress
            const difficulty = performance.difficulty || 'medium';
            if (progressData.difficultyProgress[difficulty]) {
                progressData.difficultyProgress[difficulty].attempted++;
                if (performance.score >= 0.7) { // Consider 70% as passing
                    progressData.difficultyProgress[difficulty].correct++;
                }
            }

            progressData.lastUpdated = new Date();

            await userProgressRef.set(progressData, { merge: true });

            logger.info(`Updated progress for user: ${userId}`);

        } catch (error) {
            logger.error('Error updating user progress:', error);
            throw error;
        }
    }

    /**
     * Track syllabus processing
     */
    async trackSyllabusProcessed(userId, topicCount) {
        await this.trackActivity(userId, 'syllabus_processed', {
            topicCount,
            timestamp: new Date()
        });
    }

    /**
     * Track question generation
     */
    async trackQuestionGeneration(userId, questionCount, difficulty, topics) {
        await this.trackActivity(userId, 'questions_generated', {
            questionCount,
            difficulty,
            topics,
            timestamp: new Date()
        });
    }

    /**
     * Get user analytics dashboard data
     */
    async getUserAnalytics(userId) {
        try {
            // Get user progress
            const progressDoc = await this.firestore
                .collection('userProgress')
                .doc(userId)
                .get();

            const progress = progressDoc.exists ? progressDoc.data() : null;

            // Get recent activities
            const activitiesSnapshot = await this.firestore
                .collection('userActivities')
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            const activities = activitiesSnapshot.docs.map(doc => doc.data());

            // Get recent assessments
            const assessmentsSnapshot = await this.firestore
                .collection('assessmentPerformances')
                .where('userId', '==', userId)
                .orderBy('submittedAt', 'desc')
                .limit(10)
                .get();

            const assessments = assessmentsSnapshot.docs.map(doc => doc.data());

            // Calculate insights
            const insights = this.calculateInsights(progress, activities, assessments);

            return {
                progress,
                recentActivities: activities.slice(0, 10),
                recentAssessments: assessments,
                insights,
                generatedAt: new Date()
            };

        } catch (error) {
            logger.error('Error getting user analytics:', error);
            throw error;
        }
    }

    /**
     * Calculate user insights
     */
    calculateInsights(progress, activities, assessments) {
        const insights = {
            studyStreak: 0,
            preferredStudyTime: null,
            improvementTrend: 'stable',
            nextRecommendations: []
        };

        if (!progress || !activities.length) {
            return insights;
        }

        // Calculate study streak
        insights.studyStreak = this.calculateStudyStreak(activities);

        // Find preferred study time
        insights.preferredStudyTime = this.findPreferredStudyTime(activities);

        // Calculate improvement trend
        if (assessments.length >= 3) {
            insights.improvementTrend = this.calculateImprovementTrend(assessments);
        }

        // Generate next recommendations
        insights.nextRecommendations = this.generateNextRecommendations(progress, assessments);

        return insights;
    }

    /**
     * Calculate study streak
     */
    calculateStudyStreak(activities) {
        const studyActivities = activities.filter(activity => 
            ['assessment_completed', 'practice_session', 'question_answered'].includes(activity.type)
        );

        if (studyActivities.length === 0) return 0;

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < 30; i++) { // Check last 30 days
            const dayActivities = studyActivities.filter(activity => {
                const activityDate = new Date(activity.timestamp);
                activityDate.setHours(0, 0, 0, 0);
                return activityDate.getTime() === currentDate.getTime();
            });

            if (dayActivities.length > 0) {
                streak++;
            } else if (streak > 0) {
                break; // Streak broken
            }

            currentDate.setDate(currentDate.getDate() - 1);
        }

        return streak;
    }

    /**
     * Find preferred study time
     */
    findPreferredStudyTime(activities) {
        const hourCounts = {};

        for (const activity of activities) {
            const hour = new Date(activity.timestamp).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }

        let maxHour = 0;
        let maxCount = 0;

        for (const [hour, count] of Object.entries(hourCounts)) {
            if (count > maxCount) {
                maxCount = count;
                maxHour = parseInt(hour);
            }
        }

        if (maxHour >= 6 && maxHour < 12) return 'morning';
        if (maxHour >= 12 && maxHour < 18) return 'afternoon';
        if (maxHour >= 18 && maxHour < 22) return 'evening';
        return 'night';
    }

    /**
     * Calculate improvement trend
     */
    calculateImprovementTrend(assessments) {
        if (assessments.length < 3) return 'insufficient_data';

        const recentScores = assessments.slice(0, 3).map(a => a.score).reverse();
        const olderScores = assessments.slice(3, 6).map(a => a.score);

        const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
        const olderAvg = olderScores.length > 0 
            ? olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length
            : recentAvg;

        if (recentAvg > olderAvg + 0.1) return 'improving';
        if (recentAvg < olderAvg - 0.1) return 'declining';
        return 'stable';
    }

    /**
     * Generate next recommendations
     */
    generateNextRecommendations(progress, assessments) {
        const recommendations = [];

        if (!progress) return recommendations;

        // Recommendation based on weak topics
        const weakTopics = Object.entries(progress.topicProgress || {})
            .filter(([_, data]) => data.averageScore < 0.6)
            .sort(([_, a], [__, b]) => a.averageScore - b.averageScore)
            .slice(0, 3)
            .map(([topic, _]) => topic);

        for (const topic of weakTopics) {
            recommendations.push({
                type: 'practice',
                message: `Practice more questions on ${topic}`,
                priority: 'high'
            });
        }

        // Recommendation based on difficulty
        const difficultyData = progress.difficultyProgress || {};
        for (const [difficulty, data] of Object.entries(difficultyData)) {
            if (data.attempted > 0 && (data.correct / data.attempted) > 0.8) {
                const nextDifficulty = difficulty === 'easy' ? 'medium' : 'hard';
                recommendations.push({
                    type: 'challenge',
                    message: `Try ${nextDifficulty} level questions`,
                    priority: 'medium'
                });
                break;
            }
        }

        return recommendations.slice(0, 3);
    }

    /**
     * Check if activity is critical (needs real-time tracking)
     */
    isCriticalActivity(activityType) {
        const criticalActivities = [
            'assessment_completed',
            'error_occurred',
            'payment_completed',
            'subscription_changed'
        ];
        return criticalActivities.includes(activityType);
    }

    /**
     * Track activity in real-time
     */
    async trackRealTime(activity) {
        try {
            await this.firestore
                .collection('userActivities')
                .add(activity);
        } catch (error) {
            logger.error('Error tracking real-time activity:', error);
        }
    }

    /**
     * Start batch processor for analytics
     */
    startBatchProcessor() {
        setInterval(() => {
            this.flushAnalyticsQueue();
        }, this.flushInterval);
    }

    /**
     * Flush analytics queue in batches
     */
    async flushAnalyticsQueue() {
        if (this.analyticsQueue.length === 0) return;

        try {
            const batch = this.firestore.batch();
            const itemsToProcess = this.analyticsQueue.splice(0, this.batchSize);

            for (const item of itemsToProcess) {
                const docRef = this.firestore.collection(item.collection).doc();
                batch.set(docRef, item.data);
            }

            await batch.commit();
            logger.info(`Flushed ${itemsToProcess.length} analytics items`);

        } catch (error) {
            logger.error('Error flushing analytics queue:', error);
            // Re-add items to queue for retry
            this.analyticsQueue.unshift(...itemsToProcess);
        }
    }

    /**
     * Get system-wide analytics
     */
    async getSystemAnalytics(timeRange = '7d') {
        try {
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

            // Get user activities in time range
            const activitiesSnapshot = await this.firestore
                .collection('userActivities')
                .where('timestamp', '>=', startDate)
                .where('timestamp', '<=', endDate)
                .get();

            const activities = activitiesSnapshot.docs.map(doc => doc.data());

            // Get assessments in time range
            const assessmentsSnapshot = await this.firestore
                .collection('assessmentPerformances')
                .where('submittedAt', '>=', startDate)
                .where('submittedAt', '<=', endDate)
                .get();

            const assessments = assessmentsSnapshot.docs.map(doc => doc.data());

            return {
                timeRange,
                totalActivities: activities.length,
                totalAssessments: assessments.length,
                uniqueUsers: new Set(activities.map(a => a.userId)).size,
                averageScore: assessments.length > 0 
                    ? assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length 
                    : 0,
                activityBreakdown: this.getActivityBreakdown(activities),
                topTopics: this.getTopTopics(assessments),
                generatedAt: new Date()
            };

        } catch (error) {
            logger.error('Error getting system analytics:', error);
            throw error;
        }
    }

    /**
     * Get activity breakdown
     */
    getActivityBreakdown(activities) {
        const breakdown = {};
        for (const activity of activities) {
            breakdown[activity.type] = (breakdown[activity.type] || 0) + 1;
        }
        return breakdown;
    }

    /**
     * Get top topics from assessments
     */
    getTopTopics(assessments) {
        const topicCounts = {};
        
        for (const assessment of assessments) {
            for (const topic of assessment.topics || []) {
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            }
        }

        return Object.entries(topicCounts)
            .sort(([_, a], [__, b]) => b - a)
            .slice(0, 10)
            .map(([topic, count]) => ({ topic, count }));
    }
}

module.exports = new AnalyticsService();
