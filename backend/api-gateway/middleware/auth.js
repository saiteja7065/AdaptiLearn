const admin = require('firebase-admin');
const logger = require('../../shared/utils/logger');

// Initialize Firebase Admin SDK
let isFirebaseInitialized = false;

function initializeFirebase() {
    if (isFirebaseInitialized) return;
    
    try {
        // Initialize with service account credentials
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // Use service account file path
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        } else {
            // For development, use Application Default Credentials
            admin.initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        }
        
        isFirebaseInitialized = true;
        logger.info('Firebase Admin SDK initialized successfully');
    } catch (error) {
        logger.error('Firebase Admin initialization error:', error);
        throw error;
    }
}

/**
 * Middleware to verify Firebase ID tokens
 */
const verifyFirebaseToken = async (req, res, next) => {
    try {
        // Initialize Firebase if not already done
        if (!isFirebaseInitialized) {
            initializeFirebase();
        }

        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authorization header with Bearer token required'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Firebase ID token required'
            });
        }

        // Verify the token with Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(token, true);
        
        // Add user information to request object
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            email_verified: decodedToken.email_verified,
            name: decodedToken.name,
            picture: decodedToken.picture,
            firebase: decodedToken
        };

        // Log successful authentication
        logger.info(`User authenticated: ${req.user.uid} (${req.user.email})`);

        next();
    } catch (error) {
        logger.error('Token verification error:', error);

        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                error: 'Token Expired',
                message: 'Firebase ID token has expired. Please refresh your login.',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (error.code === 'auth/id-token-revoked') {
            return res.status(401).json({
                error: 'Token Revoked',
                message: 'Firebase ID token has been revoked. Please login again.',
                code: 'TOKEN_REVOKED'
            });
        }

        if (error.code === 'auth/invalid-id-token') {
            return res.status(401).json({
                error: 'Invalid Token',
                message: 'Firebase ID token is invalid or malformed.',
                code: 'INVALID_TOKEN'
            });
        }

        return res.status(401).json({
            error: 'Authentication Error',
            message: 'Failed to verify Firebase ID token',
            code: 'AUTH_ERROR'
        });
    }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No authentication provided, continue without user
            req.user = null;
            return next();
        }

        // If auth header exists, verify it
        await verifyFirebaseToken(req, res, next);
    } catch (error) {
        // On error, continue without user (don't fail the request)
        req.user = null;
        logger.warn('Optional auth failed, continuing without user:', error.message);
        next();
    }
};

/**
 * Role-based authorization middleware
 */
const requireRole = (role) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required'
                });
            }

            // Get custom claims from Firebase
            const userRecord = await admin.auth().getUser(req.user.uid);
            const customClaims = userRecord.customClaims || {};

            if (!customClaims.role || customClaims.role !== role) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: `Role '${role}' required for this operation`,
                    userRole: customClaims.role || 'user'
                });
            }

            req.user.role = customClaims.role;
            next();
        } catch (error) {
            logger.error('Role verification error:', error);
            return res.status(500).json({
                error: 'Authorization Error',
                message: 'Failed to verify user role'
            });
        }
    };
};

/**
 * Rate limiting per user
 */
const userRateLimit = (maxRequests = 50, windowMinutes = 15) => {
    const userRequestCounts = new Map();
    const windowMs = windowMinutes * 60 * 1000;

    return (req, res, next) => {
        if (!req.user) {
            return next(); // Skip rate limiting for unauthenticated requests
        }

        const userId = req.user.uid;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean up old entries
        if (Math.random() < 0.1) { // 10% chance to cleanup
            for (const [key, data] of userRequestCounts.entries()) {
                if (data.firstRequest < windowStart) {
                    userRequestCounts.delete(key);
                }
            }
        }

        // Get or create user request data
        let userData = userRequestCounts.get(userId);
        if (!userData || userData.firstRequest < windowStart) {
            userData = {
                count: 0,
                firstRequest: now
            };
            userRequestCounts.set(userId, userData);
        }

        userData.count++;

        if (userData.count > maxRequests) {
            const resetTime = new Date(userData.firstRequest + windowMs);
            return res.status(429).json({
                error: 'Rate Limit Exceeded',
                message: `Too many requests. Limit: ${maxRequests} per ${windowMinutes} minutes`,
                retryAfter: resetTime.toISOString(),
                current: userData.count,
                limit: maxRequests
            });
        }

        // Add rate limit headers
        res.set({
            'X-RateLimit-Limit': maxRequests,
            'X-RateLimit-Remaining': Math.max(0, maxRequests - userData.count),
            'X-RateLimit-Reset': new Date(userData.firstRequest + windowMs).toISOString()
        });

        next();
    };
};

/**
 * Development mode bypass for testing
 */
const developmentAuth = (req, res, next) => {
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
        logger.warn('⚠️  DEVELOPMENT MODE: Bypassing authentication');
        req.user = {
            uid: 'dev-user-123',
            email: 'dev@adaptilearn.com',
            email_verified: true,
            name: 'Development User',
            picture: null,
            role: 'admin'
        };
        return next();
    }
    
    // In production or when bypass is disabled, use normal auth
    return verifyFirebaseToken(req, res, next);
};

module.exports = {
    verifyFirebaseToken,
    optionalAuth,
    requireRole,
    userRateLimit,
    developmentAuth,
    // Export for backward compatibility
    default: process.env.NODE_ENV === 'development' ? developmentAuth : verifyFirebaseToken
};
