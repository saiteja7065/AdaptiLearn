// Analytics Service - Enhanced performance tracking and insights
import apiService from './apiService';
import { auth } from '../firebase/config';

class AnalyticsService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // =============================================
    // PERFORMANCE ANALYTICS
    // =============================================

    async getDetailedAnalytics(userId, timeRange = '30d') {
        const cacheKey = `analytics_${userId}_${timeRange}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await apiService.get(`/api/analytics/detailed?timeRange=${timeRange}`);
            
            if (response.success) {
                const analytics = this.processAnalyticsData(response.data);
                
                // Cache the result
                this.cache.set(cacheKey, {
                    data: analytics,
                    timestamp: Date.now()
                });
                
                return analytics;
            }
            
            return this.getFallbackAnalytics();
        } catch (error) {
            console.error('Error fetching detailed analytics:', error);
            return this.getFallbackAnalytics();
        }
    }

    processAnalyticsData(rawData) {
        return {
            overview: {
                totalTests: rawData.totalTests || 0,
                averageScore: rawData.averageScore || 0,
                totalStudyTime: rawData.totalStudyTime || 0,
                improvementRate: rawData.improvementRate || 0,
                consistencyScore: rawData.consistencyScore || 0
            },
            subjectBreakdown: this.calculateSubjectBreakdown(rawData.subjectData || []),
            performanceTrends: this.calculateTrends(rawData.historicalData || []),
            weaknessAnalysis: this.analyzeWeaknesses(rawData.questionData || []),
            strengthAnalysis: this.analyzeStrengths(rawData.questionData || []),
            recommendations: this.generateRecommendations(rawData),
            studyPatterns: this.analyzeStudyPatterns(rawData.sessionData || [])
        };
    }

    calculateSubjectBreakdown(subjectData) {
        return subjectData.map(subject => ({
            name: subject.name,
            score: subject.averageScore,
            testsCount: subject.testsCount,
            timeSpent: subject.totalTime,
            difficulty: subject.averageDifficulty,
            improvement: subject.improvementRate,
            lastTestDate: subject.lastTestDate,
            topicBreakdown: subject.topics || []
        }));
    }

    calculateTrends(historicalData) {
        const trends = {
            daily: [],
            weekly: [],
            monthly: []
        };

        // Process daily trends
        const dailyMap = new Map();
        historicalData.forEach(entry => {
            const date = new Date(entry.date).toDateString();
            if (!dailyMap.has(date)) {
                dailyMap.set(date, { scores: [], count: 0 });
            }
            dailyMap.get(date).scores.push(entry.score);
            dailyMap.get(date).count++;
        });

        dailyMap.forEach((data, date) => {
            trends.daily.push({
                date,
                averageScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
                testsCount: data.count
            });
        });

        return trends;
    }

    analyzeWeaknesses(questionData) {
        const topicPerformance = new Map();
        
        questionData.forEach(question => {
            const topic = question.topic || 'General';
            if (!topicPerformance.has(topic)) {
                topicPerformance.set(topic, { correct: 0, total: 0, questions: [] });
            }
            
            const topicData = topicPerformance.get(topic);
            topicData.total++;
            if (question.isCorrect) topicData.correct++;
            topicData.questions.push(question);
        });

        const weaknesses = [];
        topicPerformance.forEach((data, topic) => {
            const accuracy = (data.correct / data.total) * 100;
            if (accuracy < 70) {
                weaknesses.push({
                    topic,
                    accuracy,
                    questionsAttempted: data.total,
                    commonMistakes: this.identifyCommonMistakes(data.questions),
                    recommendedActions: this.getTopicRecommendations(topic, accuracy)
                });
            }
        });

        return weaknesses.sort((a, b) => a.accuracy - b.accuracy);
    }

    analyzeStrengths(questionData) {
        const topicPerformance = new Map();
        
        questionData.forEach(question => {
            const topic = question.topic || 'General';
            if (!topicPerformance.has(topic)) {
                topicPerformance.set(topic, { correct: 0, total: 0 });
            }
            
            const topicData = topicPerformance.get(topic);
            topicData.total++;
            if (question.isCorrect) topicData.correct++;
        });

        const strengths = [];
        topicPerformance.forEach((data, topic) => {
            const accuracy = (data.correct / data.total) * 100;
            if (accuracy >= 80) {
                strengths.push({
                    topic,
                    accuracy,
                    questionsAttempted: data.total,
                    masteryLevel: accuracy >= 95 ? 'Expert' : accuracy >= 85 ? 'Advanced' : 'Proficient'
                });
            }
        });

        return strengths.sort((a, b) => b.accuracy - a.accuracy);
    }

    identifyCommonMistakes(questions) {
        const mistakes = new Map();
        
        questions.filter(q => !q.isCorrect).forEach(question => {
            const mistakeType = this.categorizeMistake(question);
            mistakes.set(mistakeType, (mistakes.get(mistakeType) || 0) + 1);
        });

        return Array.from(mistakes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([type, count]) => ({ type, count }));
    }

    categorizeMistake(question) {
        // Simple categorization based on question properties
        if (question.difficulty === 'easy') return 'Conceptual Understanding';
        if (question.difficulty === 'hard') return 'Complex Problem Solving';
        if (question.type === 'calculation') return 'Calculation Errors';
        return 'Application of Concepts';
    }

    getTopicRecommendations(topic, accuracy) {
        const recommendations = [];
        
        if (accuracy < 50) {
            recommendations.push(`Review fundamental concepts of ${topic}`);
            recommendations.push(`Practice basic ${topic} problems daily`);
            recommendations.push(`Seek additional help or tutoring for ${topic}`);
        } else if (accuracy < 70) {
            recommendations.push(`Focus on intermediate ${topic} problems`);
            recommendations.push(`Review common ${topic} patterns and formulas`);
            recommendations.push(`Take targeted ${topic} practice tests`);
        }

        return recommendations;
    }

    generateRecommendations(rawData) {
        const recommendations = [];
        
        // Study time recommendations
        if (rawData.averageStudyTime < 60) {
            recommendations.push({
                type: 'study_time',
                priority: 'high',
                message: 'Increase daily study time to at least 1 hour',
                action: 'Set a daily study schedule'
            });
        }

        // Consistency recommendations
        if (rawData.consistencyScore < 0.7) {
            recommendations.push({
                type: 'consistency',
                priority: 'medium',
                message: 'Improve study consistency for better retention',
                action: 'Take tests regularly, at least 3 times per week'
            });
        }

        // Performance recommendations
        if (rawData.averageScore < 70) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: 'Focus on improving overall performance',
                action: 'Review weak topics and practice more questions'
            });
        }

        return recommendations;
    }

    analyzeStudyPatterns(sessionData) {
        const patterns = {
            preferredTimes: this.getPreferredStudyTimes(sessionData),
            sessionDuration: this.getAverageSessionDuration(sessionData),
            studyFrequency: this.getStudyFrequency(sessionData),
            mostProductiveDay: this.getMostProductiveDay(sessionData)
        };

        return patterns;
    }

    getPreferredStudyTimes(sessionData) {
        const timeSlots = new Map();
        
        sessionData.forEach(session => {
            const hour = new Date(session.startTime).getHours();
            const timeSlot = this.getTimeSlot(hour);
            timeSlots.set(timeSlot, (timeSlots.get(timeSlot) || 0) + 1);
        });

        return Array.from(timeSlots.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([slot, count]) => ({ timeSlot: slot, sessions: count }));
    }

    getTimeSlot(hour) {
        if (hour >= 6 && hour < 12) return 'Morning';
        if (hour >= 12 && hour < 17) return 'Afternoon';
        if (hour >= 17 && hour < 21) return 'Evening';
        return 'Night';
    }

    getAverageSessionDuration(sessionData) {
        if (sessionData.length === 0) return 0;
        
        const totalDuration = sessionData.reduce((sum, session) => {
            return sum + (session.duration || 0);
        }, 0);

        return Math.round(totalDuration / sessionData.length);
    }

    getStudyFrequency(sessionData) {
        const dates = new Set();
        sessionData.forEach(session => {
            dates.add(new Date(session.startTime).toDateString());
        });

        const daysStudied = dates.size;
        const totalDays = 30; // Last 30 days
        
        return {
            daysStudied,
            frequency: (daysStudied / totalDays) * 100,
            streak: this.calculateCurrentStreak(sessionData)
        };
    }

    calculateCurrentStreak(sessionData) {
        const sortedDates = [...new Set(sessionData.map(s => 
            new Date(s.startTime).toDateString()
        ))].sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        let currentDate = new Date();
        
        for (const dateStr of sortedDates) {
            const sessionDate = new Date(dateStr);
            const daysDiff = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    getMostProductiveDay(sessionData) {
        const dayPerformance = new Map();
        
        sessionData.forEach(session => {
            const day = new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long' });
            if (!dayPerformance.has(day)) {
                dayPerformance.set(day, { sessions: 0, totalScore: 0 });
            }
            
            const dayData = dayPerformance.get(day);
            dayData.sessions++;
            dayData.totalScore += session.averageScore || 0;
        });

        let bestDay = null;
        let bestAverage = 0;

        dayPerformance.forEach((data, day) => {
            const average = data.totalScore / data.sessions;
            if (average > bestAverage) {
                bestAverage = average;
                bestDay = day;
            }
        });

        return { day: bestDay, averageScore: bestAverage };
    }

    getFallbackAnalytics() {
        return {
            overview: {
                totalTests: 0,
                averageScore: 0,
                totalStudyTime: 0,
                improvementRate: 0,
                consistencyScore: 0
            },
            subjectBreakdown: [],
            performanceTrends: { daily: [], weekly: [], monthly: [] },
            weaknessAnalysis: [],
            strengthAnalysis: [],
            recommendations: [
                {
                    type: 'getting_started',
                    priority: 'high',
                    message: 'Take your first assessment to get personalized insights',
                    action: 'Start with a diagnostic test'
                }
            ],
            studyPatterns: {
                preferredTimes: [],
                sessionDuration: 0,
                studyFrequency: { daysStudied: 0, frequency: 0, streak: 0 },
                mostProductiveDay: { day: null, averageScore: 0 }
            }
        };
    }

    // =============================================
    // REAL-TIME TRACKING
    // =============================================

    async trackStudySession(sessionData) {
        try {
            await apiService.trackActivity('study_session', {
                duration: sessionData.duration,
                questionsAttempted: sessionData.questionsAttempted,
                averageScore: sessionData.averageScore,
                topics: sessionData.topics,
                startTime: sessionData.startTime,
                endTime: sessionData.endTime
            });
        } catch (error) {
            console.error('Error tracking study session:', error);
        }
    }

    async trackQuestionAttempt(questionData) {
        try {
            await apiService.trackActivity('question_attempt', {
                questionId: questionData.id,
                topic: questionData.topic,
                difficulty: questionData.difficulty,
                isCorrect: questionData.isCorrect,
                timeSpent: questionData.timeSpent,
                userAnswer: questionData.userAnswer,
                correctAnswer: questionData.correctAnswer
            });
        } catch (error) {
            console.error('Error tracking question attempt:', error);
        }
    }

    // =============================================
    // PERFORMANCE PREDICTIONS
    // =============================================

    async getPredictiveInsights(userId) {
        try {
            const response = await apiService.get(`/api/analytics/predictions`);
            
            if (response.success) {
                return response.predictions;
            }
            
            return this.generateBasicPredictions();
        } catch (error) {
            console.error('Error fetching predictions:', error);
            return this.generateBasicPredictions();
        }
    }

    generateBasicPredictions() {
        return {
            expectedImprovement: {
                timeframe: '2 weeks',
                scoreIncrease: 5,
                confidence: 0.7
            },
            readinessAssessment: {
                examReadiness: 'Moderate',
                recommendedPrepTime: '3 weeks',
                focusAreas: ['Practice more questions', 'Review weak topics']
            },
            studyEfficiency: {
                currentEfficiency: 0.6,
                potentialImprovement: 0.3,
                recommendations: ['Increase study consistency', 'Focus on weak areas']
            }
        };
    }

    // =============================================
    // CACHE MANAGEMENT
    // =============================================

    clearCache() {
        this.cache.clear();
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export singleton instance
export default new AnalyticsService();