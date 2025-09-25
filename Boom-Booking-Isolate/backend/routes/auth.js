import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { pool } from '../database/postgres.js';

const router = express.Router();

// Validate JWT secret on startup
const validateJWTSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'fallback-secret') {
    console.error('❌ JWT_SECRET not set or using fallback value');
    console.error('🔧 Please set JWT_SECRET environment variable for security');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production environment');
    }
  } else {
    console.log('✅ JWT_SECRET is properly configured');
  }
};

// Validate JWT secret on module load
validateJWTSecret();

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get JWT secret with validation
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'fallback-secret') {
      console.error('❌ JWT_SECRET not properly configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Generate JWT token with tenant context
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role || 'user',
        tenant_id: user.tenant_id || 1 // Include tenant ID in token
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    // console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isLength({ min: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    const existingUser = existingResult.rows[0];

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, hashedPassword, name, 'user']
    );

    // Get JWT secret with validation
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'fallback-secret') {
      console.error('❌ JWT_SECRET not properly configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Generate JWT token
    const userId = result.rows[0].id;
    const token = jwt.sign(
      { 
        id: userId, 
        email: email, 
        role: 'user' 
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: result.rows[0].id,
        email: email,
        name: name,
        role: 'user'
      }
    });
  } catch (error) {
    // console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user session
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Middleware to authenticate JWT token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  // For demo purposes, accept mock tokens
  if (token.startsWith('mock-jwt-token-')) {
    req.user = { id: 1, email: 'demo@example.com', role: 'admin', tenant_id: 1 };
    req.tenant_id = 1; // Set tenant context
    return next();
  }

  // Validate JWT_SECRET is properly set
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'fallback-secret') {
    console.error('❌ JWT_SECRET not properly configured for token verification');
    return res.status(500).json({ 
      success: false,
      error: 'Server configuration error',
      code: 'CONFIG_ERROR'
    });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      // Provide more specific error messages
      let errorMessage = 'Invalid or expired token';
      let errorCode = 'TOKEN_INVALID';
      
      if (err.name === 'TokenExpiredError') {
        errorMessage = 'Token has expired';
        errorCode = 'TOKEN_EXPIRED';
      } else if (err.name === 'JsonWebTokenError') {
        errorMessage = 'Invalid token format';
        errorCode = 'TOKEN_MALFORMED';
      } else if (err.name === 'NotBeforeError') {
        errorMessage = 'Token not yet valid';
        errorCode = 'TOKEN_NOT_ACTIVE';
      }
      
      console.log(`🔐 Authentication failed: ${errorCode} - ${errorMessage}`);
      
      return res.status(401).json({ 
        success: false,
        error: errorMessage,
        code: errorCode
      });
    }
    
    // Validate user data from token
    if (!user.id || !user.email) {
      console.log('🔐 Invalid user data in token');
      return res.status(401).json({
        success: false,
        error: 'Invalid token payload',
        code: 'TOKEN_PAYLOAD_INVALID'
      });
    }
    
    // Set tenant context from JWT token
    req.user = user;
    req.tenant_id = user.tenant_id || user.tenantId || 1; // Default to tenant 1 if not specified
    
    // Log tenant context for debugging
    console.log(`🔐 User authenticated: ${user.email} (Tenant: ${req.tenant_id})`);
    
    next();
  });
}

export default router;

