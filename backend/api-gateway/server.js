const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Import custom middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const logger = require('../shared/utils/logger');

// Import routes
const aiRoutes = require('./routes/ai');
const dataRoutes = require('./routes/data');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 8080;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.openai.com", "https://generativelanguage.googleapis.com"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Request logging
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'https://localhost:3000',
            'https://your-firebase-app.web.app',
            'https://your-custom-domain.com'
        ];
        
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks
    skip: (req) => req.path === '/health'
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (no auth required)
app.use('/health', healthRoutes);

// API routes with authentication
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/data', authMiddleware, dataRoutes);

// Service proxies for microservices
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const DATA_SERVICE_URL = process.env.DATA_SERVICE_URL || 'http://localhost:8001';

// Proxy to AI service with authentication
app.use('/api/ai-direct', 
    authMiddleware,
    createProxyMiddleware({
        target: AI_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            '^/api/ai-direct': '/api/ai'
        },
        onProxyReq: (proxyReq, req) => {
            // Add user context to proxied requests
            if (req.user) {
                proxyReq.setHeader('X-User-ID', req.user.uid);
                proxyReq.setHeader('X-User-Email', req.user.email);
            }
        },
        onError: (err, req, res) => {
            logger.error('AI Service Proxy Error:', err);
            res.status(503).json({
                error: 'AI Service temporarily unavailable',
                message: 'Please try again later'
            });
        }
    })
);

// Proxy to Data service with authentication
app.use('/api/data-direct',
    authMiddleware,
    createProxyMiddleware({
        target: DATA_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            '^/api/data-direct': '/api/data'
        },
        onProxyReq: (proxyReq, req) => {
            if (req.user) {
                proxyReq.setHeader('X-User-ID', req.user.uid);
                proxyReq.setHeader('X-User-Email', req.user.email);
            }
        },
        onError: (err, req, res) => {
            logger.error('Data Service Proxy Error:', err);
            res.status(503).json({
                error: 'Data Service temporarily unavailable',
                message: 'Please try again later'
            });
        }
    })
);

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'AdaptiLearn API Gateway',
        version: '1.0.0',
        description: 'Gateway for AdaptiLearn microservices',
        endpoints: {
            health: {
                'GET /health': 'Service health check'
            },
            ai: {
                'POST /api/ai/generate-questions': 'Generate questions from content',
                'POST /api/ai/analyze-content': 'Analyze content and extract topics',
                'POST /api/ai/chat-tutor': 'AI tutoring chatbot',
                'POST /api/ai/process-pdf': 'Process PDF files',
                'POST /api/ai/enhance-feedback': 'Enhance performance feedback'
            },
            data: {
                'GET /api/data/external-questions': 'Fetch questions from external APIs',
                'POST /api/data/analytics': 'Advanced analytics processing',
                'GET /api/data/subjects': 'Get subject data',
                'POST /api/data/syllabus': 'Process syllabus data'
            }
        },
        authentication: 'Firebase ID Token required in Authorization header',
        rateLimit: '100 requests per 15 minutes per IP'
    });
});

// Catch-all for unmatched routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: `The endpoint ${req.method} ${req.originalUrl} does not exist.`,
        availableEndpoints: '/api/docs'
    });
});

// Global error handling middleware
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

// Start server
const server = app.listen(PORT, () => {
    logger.info(`🚀 API Gateway running on port ${PORT}`);
    logger.info(`📚 API Documentation available at http://localhost:${PORT}/api/docs`);
    logger.info(`🏥 Health check available at http://localhost:${PORT}/health`);
    
    // Log service URLs for debugging
    logger.info(`🤖 AI Service URL: ${AI_SERVICE_URL}`);
    logger.info(`📊 Data Service URL: ${DATA_SERVICE_URL}`);
});

module.exports = app;
