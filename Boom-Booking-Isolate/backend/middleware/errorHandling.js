/**
 * Enhanced Error Handling and Logging System
 * 
 * Comprehensive error handling, structured logging, and monitoring
 * for production deployment with proper error categorization.
 */

import { pool } from '../database/postgres.js';

// Error categories for proper handling
export const ErrorTypes = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  RATE_LIMIT: 'rate_limit',
  DATABASE: 'database',
  NETWORK: 'network',
  SECURITY: 'security',
  BUSINESS_LOGIC: 'business_logic',
  EXTERNAL_SERVICE: 'external_service',
  INTERNAL: 'internal'
};

// Error severity levels
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Custom error class with enhanced properties
export class AppError extends Error {
  constructor(message, type = ErrorTypes.INTERNAL, severity = ErrorSeverity.MEDIUM, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, ErrorTypes.VALIDATION, ErrorSeverity.LOW, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message, details = null) {
    super(message, ErrorTypes.AUTHENTICATION, ErrorSeverity.MEDIUM, 401, details);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message, details = null) {
    super(message, ErrorTypes.AUTHORIZATION, ErrorSeverity.MEDIUM, 403, details);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message, details = null) {
    super(message, ErrorTypes.NOT_FOUND, ErrorSeverity.LOW, 404, details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, ErrorTypes.CONFLICT, ErrorSeverity.MEDIUM, 409, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message, details = null) {
    super(message, ErrorTypes.RATE_LIMIT, ErrorSeverity.MEDIUM, 429, details);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(message, details = null) {
    super(message, ErrorTypes.DATABASE, ErrorSeverity.HIGH, 500, details);
    this.name = 'DatabaseError';
  }
}

export class SecurityError extends AppError {
  constructor(message, details = null) {
    super(message, ErrorTypes.SECURITY, ErrorSeverity.HIGH, 400, details);
    this.name = 'SecurityError';
  }
}

// Enhanced logger with structured logging
export class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  // Log levels
  static LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  };

  // Format log entry
  formatLog(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      meta: {
        ...meta,
        pid: process.pid,
        hostname: process.env.HOSTNAME || 'unknown',
        version: process.env.npm_package_version || '1.0.0'
      }
    };
  }

  // Log to console with colors
  logToConsole(level, formattedLog) {
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[90m'  // Gray
    };

    const reset = '\x1b[0m';
    const color = colors[level] || '';
    
    console.log(`${color}[${level.toUpperCase()}]${reset} ${formattedLog.timestamp} [${formattedLog.context}] ${formattedLog.message}`);
    
    if (Object.keys(formattedLog.meta).length > 3) { // More than just pid, hostname, version
      console.log(`${color}  Meta:${reset}`, formattedLog.meta);
    }
  }

  // Log to database
  async logToDatabase(formattedLog) {
    try {
      await pool.query(
        `INSERT INTO application_logs (level, context, message, meta, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          formattedLog.level,
          formattedLog.context,
          formattedLog.message,
          JSON.stringify(formattedLog.meta)
        ]
      );
    } catch (error) {
      console.error('Failed to log to database:', error);
    }
  }

  // Error logging
  async error(message, meta = {}) {
    const formattedLog = this.formatLog(Logger.LEVELS.ERROR, message, meta);
    this.logToConsole('error', formattedLog);
    await this.logToDatabase(formattedLog);
  }

  // Warning logging
  async warn(message, meta = {}) {
    const formattedLog = this.formatLog(Logger.LEVELS.WARN, message, meta);
    this.logToConsole('warn', formattedLog);
    await this.logToDatabase(formattedLog);
  }

  // Info logging
  async info(message, meta = {}) {
    const formattedLog = this.formatLog(Logger.LEVELS.INFO, message, meta);
    this.logToConsole('info', formattedLog);
    await this.logToDatabase(formattedLog);
  }

  // Debug logging
  async debug(message, meta = {}) {
    const formattedLog = this.formatLog(Logger.LEVELS.DEBUG, message, meta);
    this.logToConsole('debug', formattedLog);
    await this.logToDatabase(formattedLog);
  }
}

// Create logger instance
export const logger = new Logger('BoomBooking');

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert known error types to AppError
  if (!(error instanceof AppError)) {
    if (error.name === 'ValidationError') {
      error = new ValidationError(error.message, error.errors);
    } else if (error.name === 'UnauthorizedError') {
      error = new AuthenticationError(error.message);
    } else if (error.name === 'ForbiddenError') {
      error = new AuthorizationError(error.message);
    } else if (error.name === 'CastError') {
      error = new ValidationError('Invalid data format');
    } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
      error = new DatabaseError('Database operation failed', error.message);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      error = new AppError('Network error', ErrorTypes.NETWORK, ErrorSeverity.MEDIUM, 503);
    } else {
      // Unknown error - wrap it
      error = new AppError(
        process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        ErrorTypes.INTERNAL,
        ErrorSeverity.CRITICAL,
        500,
        process.env.NODE_ENV === 'development' ? { stack: error.stack } : null
      );
    }
  }

  // Log error
  logger.error(`Error ${error.statusCode}: ${error.message}`, {
    type: error.type,
    severity: error.severity,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    tenantId: req.tenant_id,
    userId: req.user?.id,
    stack: error.stack,
    details: error.details
  });

  // Send error response
  const response = {
    success: false,
    error: error.message,
    type: error.type,
    code: error.name.toUpperCase()
  };

  // Include details in development or for specific error types
  if (process.env.NODE_ENV === 'development' || error.type === ErrorTypes.VALIDATION) {
    response.details = error.details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database error handler
export const handleDatabaseError = (error, context = 'Database operation') => {
  logger.error(`Database error in ${context}`, {
    code: error.code,
    detail: error.detail,
    hint: error.hint,
    position: error.position,
    routine: error.routine,
    stack: error.stack
  });

  // Categorize PostgreSQL errors
  if (error.code) {
    switch (error.code) {
      case '23505': // unique_violation
        return new ConflictError('Resource already exists', { constraint: error.constraint });
      case '23503': // foreign_key_violation
        return new ValidationError('Referenced resource does not exist', { constraint: error.constraint });
      case '23502': // not_null_violation
        return new ValidationError('Required field is missing', { column: error.column });
      case '23514': // check_violation
        return new ValidationError('Data validation failed', { constraint: error.constraint });
      case '42P01': // undefined_table
        return new DatabaseError('Database table not found');
      case '42703': // undefined_column
        return new DatabaseError('Database column not found');
      case '08006': // connection_failure
        return new DatabaseError('Database connection failed');
      default:
        return new DatabaseError('Database operation failed', { code: error.code });
    }
  }

  return new DatabaseError('Database operation failed', error.message);
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    tenantId: req.tenant_id,
    userId: req.user?.id,
    contentLength: req.get('Content-Length')
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    logger.info(`${req.method} ${req.url} - ${res.statusCode}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      tenantId: req.tenant_id,
      userId: req.user?.id
    });

    return originalEnd.apply(this, args);
  };

  next();
};

// Unhandled error handlers
export const setupGlobalErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Exit process after logging
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason?.toString(),
      stack: reason?.stack,
      promise: promise.toString()
    });
  });

  // Handle warnings
  process.on('warning', (warning) => {
    logger.warn('Process Warning', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    });
  });
};

// Health check with detailed status
export const healthCheck = async (req, res) => {
  try {
    const checks = {
      database: { status: 'unknown', latency: 0 },
      memory: { status: 'unknown', usage: 0 },
      uptime: process.uptime()
    };

    // Check database connectivity
    const dbStart = Date.now();
    try {
      await pool.query('SELECT 1');
      checks.database = {
        status: 'healthy',
        latency: Date.now() - dbStart
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        latency: Date.now() - dbStart,
        error: error.message
      };
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    checks.memory = {
      status: memUsagePercent > 90 ? 'critical' : memUsagePercent > 80 ? 'warning' : 'healthy',
      usage: Math.round(memUsagePercent),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) // MB
    };

    const overallStatus = checks.database.status === 'healthy' && 
                         checks.memory.status !== 'critical' ? 'healthy' : 'unhealthy';

    res.status(overallStatus === 'healthy' ? 200 : 503).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks
    });

  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  SecurityError,
  Logger,
  logger,
  errorHandler,
  asyncHandler,
  handleDatabaseError,
  requestLogger,
  setupGlobalErrorHandlers,
  healthCheck
};
