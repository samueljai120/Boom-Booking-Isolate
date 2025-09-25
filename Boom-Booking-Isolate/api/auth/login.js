// Vercel API Route: /api/auth/login
import { sql, initDatabase } from '../lib/neon-db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { setSecureCORSHeaders, handlePreflightRequest } from '../utils/cors.js';

export default async function handler(req, res) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return handlePreflightRequest(res);
  }

  // Set secure CORS headers
  setSecureCORSHeaders(res);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Initialize database if needed
    await initDatabase();
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user in database
    const result = await sql`
      SELECT id, email, password, name, role
      FROM users
      WHERE email = ${email}
    `;

    if (result.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = result[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        tenant_id: user.tenant_id || 1
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Fallback to demo login for development
    const { email, password } = req.body;
    
    if (email === 'demo@example.com' && password === 'demo123') {
      res.status(200).json({
        success: true,
        token: 'demo-token-123',
        user: {
          id: 1,
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  }
}
