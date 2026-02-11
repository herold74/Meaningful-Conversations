/**
 * Rate Limiting Middleware
 * 
 * Protects authentication endpoints from brute force attacks,
 * credential stuffing, and registration spam.
 * 
 * Uses in-memory store (suitable for single-server deployment).
 * For multi-server deployment, consider Redis store.
 */

const rateLimit = require('express-rate-limit');

/**
 * Login rate limiter - Protects against brute force password attacks
 * 5 attempts per 10 minutes per IP
 */
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 attempts
    message: { 
        error: 'Too many login attempts. Please try again in 10 minutes.',
        errorCode: 'RATE_LIMIT_LOGIN'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
        console.warn(`🚫 Rate limit exceeded for login from IP: ${req.ip}`);
        res.status(429).json(options.message);
    },
});

/**
 * Registration rate limiter - Prevents spam account creation
 * 3 registrations per hour per IP
 */
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations
    message: { 
        error: 'Too many accounts created from this IP. Please try again later.',
        errorCode: 'RATE_LIMIT_REGISTER'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        console.warn(`🚫 Rate limit exceeded for registration from IP: ${req.ip}`);
        res.status(429).json(options.message);
    },
});

/**
 * Password reset rate limiter - Prevents email bombing
 * 3 requests per hour per IP
 */
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests
    message: { 
        error: 'Too many password reset requests. Please try again later.',
        errorCode: 'RATE_LIMIT_FORGOT_PASSWORD'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        console.warn(`🚫 Rate limit exceeded for password reset from IP: ${req.ip}`);
        res.status(429).json(options.message);
    },
});

/**
 * Email verification rate limiter - Higher limit for legitimate resends
 * 10 requests per 15 minutes per IP
 */
const verifyEmailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests
    message: { 
        error: 'Too many verification attempts. Please try again later.',
        errorCode: 'RATE_LIMIT_VERIFY_EMAIL'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        console.warn(`🚫 Rate limit exceeded for email verification from IP: ${req.ip}`);
        res.status(429).json(options.message);
    },
});

/**
 * Gemini (LLM) rate limiter - Prevents API quota abuse
 * Authenticated users: 20 requests per minute (keyed by user ID)
 * Guests: 10 requests per minute (keyed by IP)
 */
const geminiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: (req) => req.userId ? 20 : 10,
    keyGenerator: (req) => {
        if (req.userId) return `user_${req.userId}`;
        // Normalize IPv6 addresses to /64 subnet for consistent rate limiting
        const ip = req.ip || 'unknown';
        if (ip.includes(':')) {
            return ip.split(':').slice(0, 4).join(':');
        }
        return ip;
    },
    message: { 
        error: 'Too many requests. Please slow down and try again in a moment.',
        errorCode: 'RATE_LIMIT_GEMINI'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Disable validation - we handle IPv6 normalization in keyGenerator ourselves
    validate: false,
    handler: (req, res, next, options) => {
        const identifier = req.userId ? `user ${req.userId}` : `IP ${req.ip}`;
        console.warn(`🚫 Gemini rate limit exceeded for ${identifier}`);
        res.status(429).json(options.message);
    },
});

module.exports = { 
    loginLimiter, 
    registerLimiter, 
    forgotPasswordLimiter,
    verifyEmailLimiter,
    geminiLimiter
};
