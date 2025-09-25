// Vercel API Route: /api/auth/login
import { sql, initDatabase } from '../../Boom-Booking-Isolate/lib/neon-db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Set CORS headers helper
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Initialize database
    await initDatabase();
    
    // Handle demo account with special logic
    if (email === 'demo@example.com' && password === 'demo123') {
      console.log('🎯 Demo login detected, using fallback authentication');
      
      // Check if demo user exists in database
      const demoUsers = await sql`
        SELECT u.*, t.name as tenant_name, t.slug as tenant_slug
        FROM users u
        JOIN tenants t ON u.tenant_id = t.id
        WHERE u.email = ${email}
      `;

      let user;
      if (demoUsers.length > 0) {
        // Demo user exists in database, verify password
        user = demoUsers[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }
        
        // Update last login
        await sql`
          UPDATE users 
          SET last_login = CURRENT_TIMESTAMP 
          WHERE id = ${user.id}
        `;
      } else {
        // Demo user doesn't exist, create fallback user object
        console.log('⚠️ Demo user not found in database, using fallback');
        user = {
          id: 1,
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'admin',
          tenant_id: 1,
          tenant_name: 'Demo Karaoke',
          tenant_slug: 'demo',
          is_active: true
        };
      }

      // Create JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          tenantId: user.tenant_id,
          role: user.role
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        data: {
          user: userWithoutPassword,
          token
        }
      });
      return;
    }

    // Regular user login - find user by email
    const users = await sql`
      SELECT u.*, t.name as tenant_name, t.slug as tenant_slug
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.email = ${email} AND u.is_active = true
    `;

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await sql`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ${user.id}
    `;

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        tenantId: user.tenant_id,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Fallback for demo account in case of database errors
    const { email, password } = req.body;
    if (email === 'demo@example.com' && password === 'demo123') {
      console.log('🆘 Database error, using emergency demo fallback');
      
      const token = jwt.sign(
        {
          userId: 1,
          email: 'demo@example.com',
          tenantId: 1,
          role: 'admin'
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: 1,
            email: 'demo@example.com',
            name: 'Demo User',
            role: 'admin',
            tenant_id: 1,
            tenant_name: 'Demo Karaoke',
            tenant_slug: 'demo',
            is_active: true
          },
          token
        }
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
}
