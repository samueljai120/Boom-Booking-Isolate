import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.DATABASE_URL);

// Create a new tenant (venue registration)
export async function createTenant(tenantData) {
  try {
    const {
      name,
      slug,
      email,
      password,
      phone,
      address,
      city,
      state,
      zipCode,
      country = 'US',
      timezone = 'America/New_York',
      currency = 'USD'
    } = tenantData;

    // Validate required fields
    if (!name || !slug || !email || !password) {
      throw new Error('Name, slug, email, and password are required');
    }

    // Check if slug already exists
    const existingTenant = await sql`
      SELECT id FROM tenants WHERE slug = ${slug}
    `;
    
    if (existingTenant.length > 0) {
      throw new Error('Tenant slug already exists');
    }

    // Check if email already exists
    const existingEmail = await sql`
      SELECT id FROM tenants WHERE email = ${email}
    `;
    
    if (existingEmail.length > 0) {
      throw new Error('Email already registered');
    }

    // Create tenant
    const newTenant = await sql`
      INSERT INTO tenants (
        name, slug, email, phone, address, city, state, zip_code,
        country, timezone, currency, subscription_plan, max_rooms, max_bookings_per_month
      ) VALUES (
        ${name}, ${slug}, ${email}, ${phone || null}, ${address || null}, 
        ${city || null}, ${state || null}, ${zipCode || null},
        ${country}, ${timezone}, ${currency}, 'free', 1, 50
      ) RETURNING id, name, slug, email, created_at
    `;

    const tenantId = newTenant[0].id;

    // Create default business hours for the tenant
    const businessHours = [
      { day: 1, open: '09:00', close: '22:00', closed: false },
      { day: 2, open: '09:00', close: '22:00', closed: false },
      { day: 3, open: '09:00', close: '22:00', closed: false },
      { day: 4, open: '09:00', close: '22:00', closed: false },
      { day: 5, open: '09:00', close: '23:00', closed: false },
      { day: 6, open: '10:00', close: '23:00', closed: false },
      { day: 0, open: '10:00', close: '21:00', closed: false }
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
      VALUES (${tenantId}, ${email}, ${hashedPassword}, ${name}, 'admin')
      RETURNING id, email, name, role
    `;

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: adminUser[0].id, 
        email: adminUser[0].email, 
        role: adminUser[0].role,
        tenantId: tenantId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return {
      success: true,
      tenant: newTenant[0],
      user: adminUser[0],
      token
    };

  } catch (error) {
    console.error('Tenant creation error:', error);
    throw error;
  }
}

// Get tenant by slug
export async function getTenantBySlug(slug) {
  try {
    const tenant = await sql`
      SELECT id, name, slug, domain, email, phone, address, city, state, 
             zip_code, country, timezone, currency, logo_url, website, 
             description, is_active, subscription_plan, max_rooms, 
             max_bookings_per_month, created_at
      FROM tenants 
      WHERE slug = ${slug} AND is_active = true
    `;

    if (tenant.length === 0) {
      throw new Error('Tenant not found');
    }

    return tenant[0];
  } catch (error) {
    console.error('Get tenant error:', error);
    throw error;
  }
}

// Get tenant by domain
export async function getTenantByDomain(domain) {
  try {
    const tenant = await sql`
      SELECT id, name, slug, domain, email, phone, address, city, state, 
             zip_code, country, timezone, currency, logo_url, website, 
             description, is_active, subscription_plan, max_rooms, 
             max_bookings_per_month, created_at
      FROM tenants 
      WHERE domain = ${domain} AND is_active = true
    `;

    if (tenant.length === 0) {
      throw new Error('Tenant not found');
    }

    return tenant[0];
  } catch (error) {
    console.error('Get tenant by domain error:', error);
    throw error;
  }
}

// Update tenant
export async function updateTenant(tenantId, updateData) {
  try {
    const allowedFields = [
      'name', 'phone', 'address', 'city', 'state', 'zip_code', 
      'country', 'timezone', 'currency', 'logo_url', 'website', 'description'
    ];

    const updateFields = Object.keys(updateData).filter(key => 
      allowedFields.includes(key) && updateData[key] !== undefined
    );

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = updateFields.map(field => `${field} = $${updateFields.indexOf(field) + 1}`).join(', ');
    const values = updateFields.map(field => updateData[field]);

    const query = `
      UPDATE tenants 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${updateFields.length + 1}
      RETURNING id, name, slug, email, updated_at
    `;

    const result = await sql(query, [...values, tenantId]);

    if (result.length === 0) {
      throw new Error('Tenant not found');
    }

    return result[0];
  } catch (error) {
    console.error('Update tenant error:', error);
    throw error;
  }
}

// Get tenant statistics
export async function getTenantStats(tenantId) {
  try {
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE tenant_id = ${tenantId}) as total_users,
        (SELECT COUNT(*) FROM rooms WHERE tenant_id = ${tenantId}) as total_rooms,
        (SELECT COUNT(*) FROM bookings WHERE tenant_id = ${tenantId}) as total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE tenant_id = ${tenantId} AND status = 'confirmed') as confirmed_bookings,
        (SELECT COUNT(*) FROM bookings WHERE tenant_id = ${tenantId} AND created_at >= CURRENT_DATE) as today_bookings
    `;

    return stats[0];
  } catch (error) {
    console.error('Get tenant stats error:', error);
    throw error;
  }
}
