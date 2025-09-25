/**
 * Advanced Security Middleware
 * 
 * Comprehensive security measures including rate limiting, input sanitization,
 * request validation, and security headers for production deployment.
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { pool } from '../database/postgres.js';

// Rate limiting configurations
export const createRateLimit = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health';
    },
    ...options
  });
};

// Specific rate limits for different endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: {
    error: 'Too many login attempts, please try again in 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 API requests per 15 minutes
  message: {
    error: 'API rate limit exceeded, please try again later.',
    code: 'API_RATE_LIMIT_EXCEEDED'
  }
});

export const bookingRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 booking operations per 5 minutes
  message: {
    error: 'Too many booking operations, please slow down.',
    code: 'BOOKING_RATE_LIMIT_EXCEEDED'
  }
});

// Enhanced security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Input sanitization
export const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Remove potentially dangerous characters
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Request size limiting
export const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxBytes = parseSize(maxSize);

    if (contentLength > maxBytes) {
      return res.status(413).json({
        error: 'Request entity too large',
        code: 'REQUEST_TOO_LARGE',
        maxSize
      });
    }

    next();
  };
};

// Parse size string to bytes
const parseSize = (size) => {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
  
  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }
  
  return parseFloat(match[1]) * units[match[2]];
};

// Advanced input validation
export const advancedValidation = {
  // Enhanced email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be valid and not exceed 255 characters'),

  // Strong password validation
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  // Enhanced phone validation
  phone: body('phone')
    .optional()
    .isMobilePhone('any')
    .isLength({ max: 20 })
    .withMessage('Phone number must be valid and not exceed 20 characters'),

  // Enhanced name validation
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes')
    .customSanitizer(value => value.replace(/\s+/g, ' ').trim()),

  // UUID validation
  uuid: (field) => body(field)
    .isUUID(4)
    .withMessage(`${field} must be a valid UUID`),

  // Enhanced date validation
  date: body('date')
    .optional()
    .isISO8601({ strict: true })
    .withMessage('Date must be in valid ISO8601 format')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const maxFuture = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year from now
      
      if (date < new Date('1900-01-01') || date > maxFuture) {
        throw new Error('Date must be between 1900 and 1 year from now');
      }
      
      return true;
    }),

  // Enhanced time validation
  time: body('time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in valid HH:MM format'),

  // Enhanced numeric validation
  positiveNumber: (field, min = 0, max = 999999) => body(field)
    .isNumeric()
    .isFloat({ min, max })
    .withMessage(`${field} must be a number between ${min} and ${max}`),

  // Room capacity validation
  roomCapacity: body('capacity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Room capacity must be between 1 and 100'),

  // Price validation
  price: body('price_per_hour')
    .isNumeric()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Price must be between 0 and 10000'),

  // Booking duration validation
  bookingDuration: (startField, endField) => {
    return [
      body(startField).isISO8601().withMessage('Start time must be valid'),
      body(endField).isISO8601().withMessage('End time must be valid'),
      body(endField).custom((endTime, { req }) => {
        const startTime = new Date(req.body[startField]);
        const endTimeDate = new Date(endTime);
        
        if (endTimeDate <= startTime) {
          throw new Error('End time must be after start time');
        }
        
        const duration = endTimeDate - startTime;
        const maxDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        
        if (duration > maxDuration) {
          throw new Error('Booking duration cannot exceed 8 hours');
        }
        
        return true;
      })
    ];
  }
};

// Request validation middleware
export const validateRequest = (validations) => {
  return async (req, res, next) => {
    try {
      // Run all validations
      await Promise.all(validations.map(validation => validation.run(req)));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value,
            location: err.location
          }))
        });
      }

      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        error: 'Internal validation error',
        code: 'VALIDATION_INTERNAL_ERROR'
      });
    }
  };
};

// SQL injection prevention
export const preventSqlInjection = (req, res, next) => {
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/)/,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\bUNION\s+SELECT\b)/i,
    /(script\s*:)/i,
    /(javascript\s*:)/i
  ];

  const checkForInjection = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string') {
        for (const pattern of sqlInjectionPatterns) {
          if (pattern.test(value)) {
            throw new Error(`Potential SQL injection detected in ${currentPath}`);
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        checkForInjection(value, currentPath);
      }
    }
  };

  try {
    if (req.body) checkForInjection(req.body, 'body');
    if (req.query) checkForInjection(req.query, 'query');
    if (req.params) checkForInjection(req.params, 'params');
    
    next();
  } catch (error) {
    console.warn('SQL injection attempt detected:', error.message);
    res.status(400).json({
      error: 'Invalid input detected',
      code: 'SECURITY_VIOLATION'
    });
  }
};

// Request logging for security monitoring
export const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    tenantId: req.tenant_id,
    userId: req.user?.id
  };

  // Log response details
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const responseData = {
      ...logData,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    };

    // Log security-relevant events
    if (res.statusCode >= 400) {
      console.warn('Security Event:', responseData);
    }

    // Log to database for security monitoring
    logSecurityEvent(responseData);
  });

  next();
};

// Log security events to database
const logSecurityEvent = async (eventData) => {
  try {
    await pool.query(
      `INSERT INTO security_logs (event_type, event_data, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        eventData.statusCode >= 400 ? 'security_incident' : 'request',
        JSON.stringify(eventData),
        eventData.ip,
        eventData.userAgent
      ]
    );
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// CSRF protection
export const csrfProtection = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const token = req.get('X-CSRF-Token') || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      error: 'CSRF token mismatch',
      code: 'CSRF_TOKEN_MISMATCH'
    });
  }

  next();
};

// IP whitelist middleware
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No whitelist configured
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        error: 'Access denied from this IP address',
        code: 'IP_NOT_WHITELISTED'
      });
    }

    next();
  };
};

// Request fingerprinting for security
export const requestFingerprinting = (req, res, next) => {
  const fingerprint = crypto
    .createHash('sha256')
    .update(
      `${req.ip}-${req.get('User-Agent')}-${req.get('Accept-Language')}-${req.get('Accept-Encoding')}`
    )
    .digest('hex');

  req.fingerprint = fingerprint;
  next();
};

export default {
  createRateLimit,
  authRateLimit,
  apiRateLimit,
  bookingRateLimit,
  securityHeaders,
  sanitizeInput,
  requestSizeLimit,
  advancedValidation,
  validateRequest,
  preventSqlInjection,
  securityLogger,
  csrfProtection,
  ipWhitelist,
  requestFingerprinting
};
