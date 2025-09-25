// Vercel API Route: /api/auth/me
import { sql, initDatabase } from '../../Boom-Booking-Isolate/lib/neon-db.js';
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

// Authentication middleware
async function authenticateToken(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    // Authenticate user
    const user = await authenticateToken(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Handle demo user with special logic
    if (user.email === 'demo@example.com') {
      console.log('🎯 Demo user session check');
      
      // Initialize database
      await initDatabase();

      // Try to fetch demo user from database
      const users = await sql`
        SELECT u.*, t.name as tenant_name, t.slug as tenant_slug
        FROM users u
        JOIN tenants t ON u.tenant_id = t.id
        WHERE u.email = ${user.email}
      `;

      let userData;
      if (users.length > 0) {
        userData = users[0];
      } else {
        // Demo user not found in database, create fallback user object
        console.log('⚠️ Demo user not found in database, using fallback');
        userData = {
          id: user.userId || 1,
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'admin',
          tenant_id: user.tenantId || 1,
          tenant_name: 'Demo Karaoke',
          tenant_slug: 'demo',
          is_active: true
        };
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = userData;

      res.status(200).json({
        success: true,
        data: {
          user: userWithoutPassword
        }
      });
      return;
    }

    // Initialize database
    await initDatabase();

    // Fetch user details from database for regular users
    const users = await sql`
      SELECT u.*, t.name as tenant_name, t.slug as tenant_slug
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = ${user.userId} AND u.is_active = true
    `;

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = users[0];

    // Remove password from response
    const { password: _, ...userWithoutPassword } = userData;

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('Auth me error:', error);
    
    // Fallback for demo user in case of database errors
    const user = await authenticateToken(req);
    if (user && user.email === 'demo@example.com') {
      console.log('🆘 Database error, using emergency demo fallback for session');
      
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.userId || 1,
            email: 'demo@example.com',
            name: 'Demo User',
            role: 'admin',
            tenant_id: user.tenantId || 1,
            tenant_name: 'Demo Karaoke',
            tenant_slug: 'demo',
            is_active: true
          }
        }
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to get user info',
      error: error.message
    });
  }
}
