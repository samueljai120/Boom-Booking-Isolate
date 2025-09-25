/**
 * Production Configuration
 * 
 * Optimized configuration for production deployment with
 * security, performance, and monitoring settings.
 */

import { config } from 'dotenv';

// Load environment variables
config();

// Production environment configuration
export const productionConfig = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: 'production',
    trustProxy: true, // Trust proxy headers
    compression: {
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return true;
      }
    }
  },

  // Database configuration
  database: {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    pool: {
      min: 2,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    },
    queryTimeout: 30000,
    statementTimeout: 30000,
    idleInTransactionSessionTimeout: 60000
  },

  // Security configuration
  security: {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      algorithm: 'HS256'
    },
    
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['https://yourdomain.com'],
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-CSRF-Token',
        'X-Tenant-ID'
      ]
    },

    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // 1000 requests per window
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === '/api/health'
    },

    auth: {
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      passwordResetExpires: 60 * 60 * 1000, // 1 hour
      sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
    },

    helmet: {
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
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  },

  // Performance configuration
  performance: {
    cache: {
      rooms: { ttl: 600000, maxSize: 100 }, // 10 minutes
      bookings: { ttl: 120000, maxSize: 500 }, // 2 minutes
      businessHours: { ttl: 1800000, maxSize: 50 }, // 30 minutes
      settings: { ttl: 3600000, maxSize: 20 }, // 1 hour
      users: { ttl: 900000, maxSize: 200 } // 15 minutes
    },

    compression: {
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return true;
      }
    },

    pagination: {
      defaultLimit: 20,
      maxLimit: 100
    },

    queryOptimization: {
      statementTimeout: 30000,
      lockTimeout: 10000,
      idleInTransactionSessionTimeout: 60000
    }
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    enableConsole: process.env.NODE_ENV !== 'production',
    enableDatabase: true,
    maxLogEntries: 100000,
    logRotation: {
      enabled: true,
      maxSize: '100MB',
      maxFiles: 5
    }
  },

  // Monitoring configuration
  monitoring: {
    enableMetrics: true,
    enableAnalytics: true,
    metricsInterval: 60000, // 1 minute
    healthCheckInterval: 30000, // 30 seconds
    
    alerts: {
      memoryThreshold: 90, // 90%
      cpuThreshold: 80, // 80%
      responseTimeThreshold: 5000, // 5 seconds
      errorRateThreshold: 5 // 5%
    },

    reporting: {
      dailyReports: true,
      weeklyReports: true,
      monthlyReports: true,
      emailNotifications: process.env.ALERT_EMAIL ? [process.env.ALERT_EMAIL] : []
    }
  },

  // WebSocket configuration
  websocket: {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['https://yourdomain.com'],
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB
    transports: ['websocket', 'polling']
  },

  // File upload configuration
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    tempPath: process.env.TEMP_PATH || './temp'
  },

  // Email configuration
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
    templates: {
      welcome: 'welcome',
      passwordReset: 'password-reset',
      bookingConfirmation: 'booking-confirmation',
      bookingCancellation: 'booking-cancellation'
    }
  },

  // External services
  external: {
    payment: {
      provider: process.env.PAYMENT_PROVIDER || 'stripe',
      stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
      }
    },

    analytics: {
      googleAnalytics: process.env.GA_TRACKING_ID,
      mixpanel: process.env.MIXPANEL_TOKEN
    },

    monitoring: {
      sentry: {
        dsn: process.env.SENTRY_DSN,
        environment: 'production',
        tracesSampleRate: 0.1
      }
    }
  },

  // Feature flags
  features: {
    enableAnalytics: process.env.ENABLE_ANALYTICS !== 'false',
    enableMonitoring: process.env.ENABLE_MONITORING !== 'false',
    enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
    enablePaymentProcessing: process.env.ENABLE_PAYMENT_PROCESSING === 'true',
    enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false',
    enableFileUpload: process.env.ENABLE_FILE_UPLOAD === 'true'
  }
};

// Environment validation
export const validateEnvironment = () => {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'CORS_ORIGIN'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Validate database URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  console.log('✅ Environment validation passed');
};

// Performance optimization settings
export const performanceOptimizations = {
  // Database optimizations
  database: {
    // Enable connection pooling
    enablePooling: true,
    
    // Optimize queries
    enableQueryOptimization: true,
    
    // Enable prepared statements
    enablePreparedStatements: true,
    
    // Connection limits
    maxConnections: 20,
    minConnections: 2,
    
    // Timeout settings
    connectionTimeout: 30000,
    queryTimeout: 30000,
    statementTimeout: 30000
  },

  // Memory optimizations
  memory: {
    // Enable garbage collection monitoring
    enableGCMonitoring: true,
    
    // Memory limits
    maxHeapSize: '1GB',
    
    // Enable memory leak detection
    enableLeakDetection: true
  },

  // Network optimizations
  network: {
    // Enable keep-alive
    enableKeepAlive: true,
    
    // Connection limits
    maxConnections: 1000,
    
    // Timeout settings
    keepAliveTimeout: 65000,
    headersTimeout: 66000
  }
};

// Security hardening
export const securityHardening = {
  // Remove server information from headers
  hideServerInfo: true,
  
  // Disable X-Powered-By header
  disablePoweredBy: true,
  
  // Enable strict transport security
  enableHSTS: true,
  
  // Enable content type sniffing protection
  enableContentTypeProtection: true,
  
  // Enable DNS prefetch control
  enableDNSPrefetchControl: true,
  
  // Frame options
  frameOptions: 'DENY',
  
  // XSS protection
  xssProtection: true,
  
  // Content type options
  contentTypeOptions: 'nosniff'
};

// Export configuration
export default {
  productionConfig,
  validateEnvironment,
  performanceOptimizations,
  securityHardening
};
