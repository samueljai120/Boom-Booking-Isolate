#!/usr/bin/env node

/**
 * Migration Script: Single-Tenant to Multi-Tenant
 * This script migrates the existing single-tenant database to multi-tenant
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function migrateToMultiTenant() {
  console.log('🚀 Starting migration to multi-tenant database...');
  console.log('================================================');

  try {
    // Step 1: Create tenants table
    console.log('📋 Creating tenants table...');
    await sql`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        domain VARCHAR(255) UNIQUE,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        country VARCHAR(50) DEFAULT 'US',
        timezone VARCHAR(50) DEFAULT 'America/New_York',
        currency VARCHAR(3) DEFAULT 'USD',
        logo_url VARCHAR(500),
        website VARCHAR(255),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        subscription_plan VARCHAR(50) DEFAULT 'free',
        max_rooms INTEGER DEFAULT 1,
        max_bookings_per_month INTEGER DEFAULT 50,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Step 2: Add tenant_id columns to existing tables
    console.log('🔧 Adding tenant_id columns...');
    
    // Add tenant_id to users table
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS tenant_id INTEGER,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
    `;

    // Add tenant_id to rooms table
    await sql`
      ALTER TABLE rooms 
      ADD COLUMN IF NOT EXISTS tenant_id INTEGER
    `;

    // Add tenant_id to business_hours table
    await sql`
      ALTER TABLE business_hours 
      ADD COLUMN IF NOT EXISTS tenant_id INTEGER
    `;

    // Add tenant_id to bookings table
    await sql`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS tenant_id INTEGER
    `;

    // Step 3: Create or get default tenant
    console.log('🏢 Creating or getting default tenant...');
    let defaultTenant = await sql`
      SELECT id FROM tenants WHERE slug = 'demo'
    `;

    let tenantId;
    if (defaultTenant.length === 0) {
      const newTenant = await sql`
        INSERT INTO tenants (
          name, slug, email, phone, address, city, state, zip_code, 
          country, timezone, currency, description, subscription_plan, 
          max_rooms, max_bookings_per_month
        ) VALUES (
          'Boom Karaoke Demo', 
          'demo', 
          'demo@boomkaraoke.com', 
          '+1-555-0123', 
          '123 Music Street', 
          'New York', 
          'NY', 
          '10001', 
          'US', 
          'America/New_York', 
          'USD', 
          'Demo karaoke venue for testing', 
          'free', 
          3, 
          50
        ) RETURNING id
      `;
      tenantId = newTenant[0].id;
      console.log(`✅ Default tenant created with ID: ${tenantId}`);
    } else {
      tenantId = defaultTenant[0].id;
      console.log(`✅ Default tenant already exists with ID: ${tenantId}`);
    }

    // Step 4: Update existing data to belong to default tenant
    console.log('📊 Migrating existing data...');
    
    // Update users
    await sql`
      UPDATE users 
      SET tenant_id = ${tenantId} 
      WHERE tenant_id IS NULL
    `;

    // Update rooms
    await sql`
      UPDATE rooms 
      SET tenant_id = ${tenantId} 
      WHERE tenant_id IS NULL
    `;

    // Update business_hours
    await sql`
      UPDATE business_hours 
      SET tenant_id = ${tenantId} 
      WHERE tenant_id IS NULL
    `;

    // Update bookings
    await sql`
      UPDATE bookings 
      SET tenant_id = ${tenantId} 
      WHERE tenant_id IS NULL
    `;

    // Step 5: Add foreign key constraints
    console.log('🔗 Adding foreign key constraints...');
    
    await sql`
      ALTER TABLE users 
      ADD CONSTRAINT fk_users_tenant 
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    `;

    await sql`
      ALTER TABLE rooms 
      ADD CONSTRAINT fk_rooms_tenant 
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    `;

    await sql`
      ALTER TABLE business_hours 
      ADD CONSTRAINT fk_business_hours_tenant 
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    `;

    await sql`
      ALTER TABLE bookings 
      ADD CONSTRAINT fk_bookings_tenant 
      FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
    `;

    // Step 6: Add unique constraints
    console.log('🔒 Adding unique constraints...');
    
    await sql`
      ALTER TABLE users 
      ADD CONSTRAINT unique_user_per_tenant 
      UNIQUE (tenant_id, email)
    `;

    await sql`
      ALTER TABLE rooms 
      ADD CONSTRAINT unique_room_per_tenant 
      UNIQUE (tenant_id, name)
    `;

    // Drop old unique constraint first
    await sql`
      ALTER TABLE business_hours 
      DROP CONSTRAINT IF EXISTS business_hours_day_of_week_key
    `;
    
    await sql`
      ALTER TABLE business_hours 
      ADD CONSTRAINT unique_business_hours_per_tenant 
      UNIQUE (tenant_id, day_of_week)
    `;

    // Step 7: Create indexes for performance
    console.log('📈 Creating performance indexes...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_rooms_tenant_id ON rooms(tenant_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_business_hours_tenant_id ON business_hours(tenant_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON bookings(tenant_id)`;

    // Step 8: Verify migration
    console.log('✅ Verifying migration...');
    
    const tenantCount = await sql`SELECT COUNT(*) as count FROM tenants`;
    const userCount = await sql`SELECT COUNT(*) as count FROM users WHERE tenant_id IS NOT NULL`;
    const roomCount = await sql`SELECT COUNT(*) as count FROM rooms WHERE tenant_id IS NOT NULL`;
    const hoursCount = await sql`SELECT COUNT(*) as count FROM business_hours WHERE tenant_id IS NOT NULL`;

    console.log('📊 Migration Results:');
    console.log(`   - Tenants: ${tenantCount[0].count}`);
    console.log(`   - Users with tenant: ${userCount[0].count}`);
    console.log(`   - Rooms with tenant: ${roomCount[0].count}`);
    console.log(`   - Business hours with tenant: ${hoursCount[0].count}`);

    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('🔗 Your database is now ready for multi-tenant use!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your server to use the new multi-tenant features');
    console.log('2. Test tenant registration: POST /api/tenants/register');
    console.log('3. Test tenant-specific data: GET /api/rooms?tenant=demo');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateToMultiTenant();
