// Vercel API Route: /api/tenants/register
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

// Validate tenant registration data
function validateTenantData(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Business name is required and must be at least 2 characters');
  }
  
  if (!data.slug || data.slug.trim().length < 2) {
    errors.push('Business slug is required and must be at least 2 characters');
  } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push('Business slug can only contain lowercase letters, numbers, and hyphens');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email address is required');
  }
  
  if (!data.password || data.password.length < 6) {
    errors.push('Password is required and must be at least 6 characters');
  }
  
  if (!data.admin_name || data.admin_name.trim().length < 2) {
    errors.push('Admin name is required and must be at least 2 characters');
  }
  
  return errors;
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
    const { 
      name, 
      slug, 
      email, 
      password, 
      admin_name,
      phone,
      address,
      city,
      state,
      zip_code,
      country = 'US',
      timezone = 'America/New_York',
      currency = 'USD'
    } = req.body;

    // Validate input
    const validationErrors = validateTenantData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Initialize database
    await initDatabase();

    // Check if slug already exists
    const existingTenant = await sql`
      SELECT id FROM tenants WHERE slug = ${slug}
    `;
    
    if (existingTenant.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Business slug already exists. Please choose a different one.'
      });
    }

    // Check if email already exists
    const existingEmail = await sql`
      SELECT id FROM tenants WHERE email = ${email}
    `;
    
    if (existingEmail.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email address already registered'
      });
    }

    // Create tenant
    const newTenant = await sql`
      INSERT INTO tenants (
        name, slug, email, phone, address, city, state, zip_code,
        country, timezone, currency, subscription_plan, max_rooms, max_bookings_per_month
      ) VALUES (
        ${name}, ${slug}, ${email}, ${phone || null}, ${address || null}, 
        ${city || null}, ${state || null}, ${zip_code || null},
        ${country}, ${timezone}, ${currency}, 'free', 1, 50
      ) RETURNING id, name, slug, email, created_at
    `;

    const tenantId = newTenant[0].id;

    // Create default business hours for the tenant
    const businessHours = [
      { day: 1, open: '09:00', close: '22:00', closed: false }, // Monday
      { day: 2, open: '09:00', close: '22:00', closed: false }, // Tuesday
      { day: 3, open: '09:00', close: '22:00', closed: false }, // Wednesday
      { day: 4, open: '09:00', close: '22:00', closed: false }, // Thursday
      { day: 5, open: '09:00', close: '23:00', closed: false }, // Friday
      { day: 6, open: '10:00', close: '23:00', closed: false }, // Saturday
      { day: 0, open: '10:00', close: '21:00', closed: false }  // Sunday
    ];

    for (const hour of businessHours) {
      await sql`
        INSERT INTO business_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
        VALUES (${tenantId}, ${hour.day}, ${hour.open}, ${hour.close}, ${hour.closed})
      `;
    }

    // Create a default room
    await sql`
      INSERT INTO rooms (tenant_id, name, capacity, category, description, price_per_hour)
      VALUES (${tenantId}, 'Main Room', 4, 'Standard', 'Main karaoke room', 25.00)
    `;

    // Create admin user for the tenant
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = await sql`
      INSERT INTO users (tenant_id, email, password, name, role)
      VALUES (${tenantId}, ${email}, ${hashedPassword}, ${admin_name}, 'admin')
      RETURNING id, email, name, role, tenant_id
    `;

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: adminUser[0].id, 
        email: adminUser[0].email, 
        role: adminUser[0].role,
        tenantId: tenantId
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = adminUser[0];

    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenant: {
          id: newTenant[0].id,
          name: newTenant[0].name,
          slug: newTenant[0].slug,
          email: newTenant[0].email,
          created_at: newTenant[0].created_at
        },
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Tenant registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register tenant',
      error: error.message
    });
  }
}


