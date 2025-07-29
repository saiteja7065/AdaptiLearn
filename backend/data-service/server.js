const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
require('dotenv').config();

const { logger } = require('./utils/logger');
const syllabusService = require('./services/syllabusService');
const analyticsService = require('./services/analyticsService');
const externalAPIs = require('./connectors/externalAPIs');
const firebaseConnector = require('./connectors/firebaseConnector');

const app = express();
const PORT = process.env.PORT || 8001;

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
        projectId: process.env.FIREBASE_PROJECT_ID
    });
}

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Authentication middleware
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No valid authentication token provided' });
        }

        const token = authHeader.substring(7);
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();

    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(401).json({ error: 'Invalid authentication token' });
    }
};

if (!admin.apps.length) {
    const config = {
        projectId: process.env.FIREBASE_PROJECT_ID
    };
    
    if (serviceAccount) {
        config.credential = admin.credential.cert(serviceAccount);
    }
    
    admin.initializeApp(config);
}

const db = admin.firestore();

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'data-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// User Profile Routes
app.get('/api/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            id: userDoc.id,
            ...userDoc.data()
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userData = req.body;
        
        await db.collection('users').doc(userId).set({
            ...userData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        res.json({ success: true, userId });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Syllabus Routes
app.get('/api/users/:userId/syllabus', async (req, res) => {
    try {
        const { userId } = req.params;
        const syllabusSnapshot = await db.collection('users')
            .doc(userId)
            .collection('syllabus')
            .orderBy('createdAt', 'desc')
            .get();
        
        const syllabus = [];
        syllabusSnapshot.forEach(doc => {
            syllabus.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.json(syllabus);
    } catch (error) {
        console.error('Error fetching syllabus:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/users/:userId/syllabus', async (req, res) => {
    try {
        const { userId } = req.params;
        const syllabusData = req.body;
        
        const docRef = await db.collection('users')
            .doc(userId)
            .collection('syllabus')
            .add({
                ...syllabusData,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        
        res.json({ success: true, id: docRef.id });
    } catch (error) {
        console.error('Error creating syllabus:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Assessment Routes
app.get('/api/users/:userId/assessments', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10, offset = 0 } = req.query;
        
        const assessmentsSnapshot = await db.collection('users')
            .doc(userId)
            .collection('assessments')
            .orderBy('createdAt', 'desc')
            .limit(parseInt(limit))
            .offset(parseInt(offset))
            .get();
        
        const assessments = [];
        assessmentsSnapshot.forEach(doc => {
            assessments.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.json(assessments);
    } catch (error) {
        console.error('Error fetching assessments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/users/:userId/assessments', async (req, res) => {
    try {
        const { userId } = req.params;
        const assessmentData = req.body;
        
        const docRef = await db.collection('users')
            .doc(userId)
            .collection('assessments')
            .add({
                ...assessmentData,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        
        res.json({ success: true, id: docRef.id });
    } catch (error) {
        console.error('Error creating assessment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/users/:userId/assessments/:assessmentId', async (req, res) => {
    try {
        const { userId, assessmentId } = req.params;
        const assessmentDoc = await db.collection('users')
            .doc(userId)
            .collection('assessments')
            .doc(assessmentId)
            .get();
        
        if (!assessmentDoc.exists) {
            return res.status(404).json({ error: 'Assessment not found' });
        }
        
        res.json({
            id: assessmentDoc.id,
            ...assessmentDoc.data()
        });
    } catch (error) {
        console.error('Error fetching assessment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Progress Tracking Routes
app.get('/api/users/:userId/progress', async (req, res) => {
    try {
        const { userId } = req.params;
        const { subject, timeframe = '30' } = req.query;
        
        let query = db.collection('users')
            .doc(userId)
            .collection('progress')
            .orderBy('timestamp', 'desc');
        
        if (subject) {
            query = query.where('subject', '==', subject);
        }
        
        // Filter by timeframe (days)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeframe));
        query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate));
        
        const progressSnapshot = await query.get();
        const progress = [];
        progressSnapshot.forEach(doc => {
            progress.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.json(progress);
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/users/:userId/progress', async (req, res) => {
    try {
        const { userId } = req.params;
        const progressData = req.body;
        
        const docRef = await db.collection('users')
            .doc(userId)
            .collection('progress')
            .add({
                ...progressData,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                userId
            });
        
        res.json({ success: true, id: docRef.id });
    } catch (error) {
        console.error('Error recording progress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Analytics Routes
app.get('/api/users/:userId/analytics', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get recent assessments for analytics
        const assessmentsSnapshot = await db.collection('users')
            .doc(userId)
            .collection('assessments')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        const assessments = [];
        assessmentsSnapshot.forEach(doc => {
            assessments.push(doc.data());
        });
        
        // Calculate analytics
        const analytics = calculateUserAnalytics(assessments);
        
        res.json(analytics);
    } catch (error) {
        console.error('Error generating analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to calculate analytics
function calculateUserAnalytics(assessments) {
    if (assessments.length === 0) {
        return {
            totalAssessments: 0,
            averageScore: 0,
            subjectBreakdown: {},
            progressTrend: 'stable',
            strongAreas: [],
            improvementAreas: []
        };
    }
    
    const totalAssessments = assessments.length;
    const averageScore = assessments.reduce((sum, assessment) => sum + (assessment.score || 0), 0) / totalAssessments;
    
    // Subject breakdown
    const subjectBreakdown = {};
    assessments.forEach(assessment => {
        const subject = assessment.subject || 'Unknown';
        if (!subjectBreakdown[subject]) {
            subjectBreakdown[subject] = { count: 0, totalScore: 0 };
        }
        subjectBreakdown[subject].count++;
        subjectBreakdown[subject].totalScore += assessment.score || 0;
    });
    
    // Calculate averages for each subject
    Object.keys(subjectBreakdown).forEach(subject => {
        subjectBreakdown[subject].averageScore = 
            subjectBreakdown[subject].totalScore / subjectBreakdown[subject].count;
    });
    
    // Identify strong and weak areas
    const subjectAverages = Object.entries(subjectBreakdown).map(([subject, data]) => ({
        subject,
        average: data.averageScore
    }));
    
    subjectAverages.sort((a, b) => b.average - a.average);
    
    const strongAreas = subjectAverages.slice(0, 3).map(item => item.subject);
    const improvementAreas = subjectAverages.slice(-3).reverse().map(item => item.subject);
    
    // Calculate progress trend (simplified)
    const recentScores = assessments.slice(0, 10).map(a => a.score || 0);
    const olderScores = assessments.slice(10, 20).map(a => a.score || 0);
    
    const recentAvg = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
    const olderAvg = olderScores.length > 0 ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length : recentAvg;
    
    let progressTrend = 'stable';
    if (recentAvg > olderAvg + 5) progressTrend = 'improving';
    else if (recentAvg < olderAvg - 5) progressTrend = 'declining';
    
    return {
        totalAssessments,
        averageScore: Math.round(averageScore * 100) / 100,
        subjectBreakdown,
        progressTrend,
        strongAreas,
        improvementAreas
    };
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Data Service running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
