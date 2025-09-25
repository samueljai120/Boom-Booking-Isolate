// Tenant-aware authentication middleware
import jwt from 'jsonwebtoken';
import { sql, initDatabase } from '../../Boom-Booking-Isolate/lib/neon-db.js';

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

// Authentication middleware that extracts tenant context
export async function authenticateTenant(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return { error: 'No token provided', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Validate that user exists and is active
    await initDatabase();
    const users = await sql`
      SELECT u.*, t.name as tenant_name, t.slug as tenant_slug, t.is_active as tenant_active
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = ${decoded.userId} 
      AND u.tenant_id = ${decoded.tenantId}
      AND u.is_active = true
      AND t.is_active = true
    `;

    if (users.length === 0) {
      return { error: 'User not found or tenant inactive', status: 401 };
    }

    const user = users[0];
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
        tenantSlug: user.tenant_slug
      }
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { error: 'Invalid token', status: 401 };
  }
}

// Middleware wrapper for API endpoints
export function withTenantAuth(handler) {
  return async (req, res) => {
    // Set CORS headers
    setCorsHeaders(res);

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    try {
      // Authenticate and get tenant context
      const authResult = await authenticateTenant(req);
      
      if (!authResult.success) {
        return res.status(authResult.status).json({
          success: false,
          message: authResult.error
        });
      }

      // Add user context to request
      req.user = authResult.user;
      req.tenantId = authResult.user.tenantId;

      // Call the actual handler
      return await handler(req, res);
    } catch (error) {
      console.error('Tenant auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };
}

// Alternative: Extract tenant from subdomain or domain
export function extractTenantFromRequest(req) {
  const host = req.headers.host;
  
  if (!host) {
    return null;
  }

  // Check for subdomain (e.g., demo.boomkaraoke.com)
  const subdomain = host.split('.')[0];
  
  // Skip 'www' and 'api' subdomains
  if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
    return subdomain;
  }

  // Check for custom domain or default
  return 'demo'; // Default tenant
}

// Get tenant context from subdomain/domain
export async function getTenantContext(req) {
  try {
    const tenantSlug = extractTenantFromRequest(req);
    
    if (!tenantSlug) {
      return { error: 'No tenant identified', status: 400 };
    }

    await initDatabase();
    const tenant = await sql`
      SELECT id, name, slug, domain, email, timezone, currency, 
             is_active, subscription_plan, max_rooms, max_bookings_per_month
      FROM tenants 
      WHERE slug = ${tenantSlug} AND is_active = true
    `;

    if (tenant.length === 0) {
      return { error: 'Tenant not found', status: 404 };
    }

    return {
      success: true,
      tenant: tenant[0]
    };
  } catch (error) {
    console.error('Get tenant context error:', error);
    return { error: 'Failed to get tenant context', status: 500 };
  }
}

// Combined authentication with tenant context
export function withTenantContext(handler) {
  return async (req, res) => {
    // Set CORS headers
    setCorsHeaders(res);

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    try {
      // Get tenant context from request
      const tenantResult = await getTenantContext(req);
      
      if (!tenantResult.success) {
        return res.status(tenantResult.status).json({
          success: false,
          message: tenantResult.error
        });
      }

      // Add tenant context to request
      req.tenant = tenantResult.tenant;
      req.tenantId = tenantResult.tenant.id;

      // Call the actual handler
      return await handler(req, res);
    } catch (error) {
      console.error('Tenant context middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };
}


