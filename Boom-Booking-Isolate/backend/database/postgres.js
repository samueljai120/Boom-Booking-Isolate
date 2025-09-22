import pkg, { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

// Database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'boom_booking',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Create client for migrations and admin operations
export const client = new Client(dbConfig);

// Test database connection
export async function testConnection() {
  try {
    await client.connect();
    console.log('✅ PostgreSQL connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
}

// Initialize multi-tenant database schema
export async function initMultiTenantDatabase() {
  const initClient = new Client(dbConfig);
  try {
    await initClient.connect();
    
    // Create extensions
    await initClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await initClient.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    
    // Create tenants table
    await initClient.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(100) UNIQUE NOT NULL,
        domain VARCHAR(255),
        plan_type VARCHAR(50) DEFAULT 'basic',
        status VARCHAR(20) DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create tenant users table
    await initClient.query(`
      CREATE TABLE IF NOT EXISTS tenant_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, user_id)
      )
    `);
    
    // Create global users table
    await initClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500),
        email_verified BOOLEAN DEFAULT FALSE,
        mfa_enabled BOOLEAN DEFAULT FALSE,
        mfa_secret VARCHAR(255),
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create rooms table with tenant isolation
    await initClient.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        capacity INTEGER NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        price_per_hour DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create bookings table with tenant isolation
    await initClient.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20),
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) DEFAULT 'confirmed',
        notes TEXT,
        total_price DECIMAL(10,2),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Create business hours table with tenant isolation
    await initClient.query(`
      CREATE TABLE IF NOT EXISTS business_hours (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        open_time TIME NOT NULL,
        close_time TIME NOT NULL,
        is_closed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, day_of_week)
      )
    `);
    
    // Create settings table with tenant isolation
    await initClient.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        key VARCHAR(255) NOT NULL,
        value TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'string',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, key)
      )
    `);
    
    // Create audit log table
    await initClient.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Enable Row Level Security on all tenant-specific tables
    await enableRowLevelSecurity(initClient);
    
    // Create indexes for performance
    await createIndexes(initClient);
    
    console.log('✅ Multi-tenant database schema created successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await initClient.end();
  }
}

// Enable Row Level Security (RLS) for tenant isolation
async function enableRowLevelSecurity(client) {
  const tables = ['rooms', 'bookings', 'business_hours', 'settings', 'audit_logs'];
  
  for (const table of tables) {
    // Enable RLS
    await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    
    // Create policy for tenant isolation (drop first if exists)
    try {
      await client.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON ${table};`);
    } catch (err) {
      // Policy might not exist, ignore error
    }
    
    await client.query(`
      CREATE POLICY tenant_isolation_policy ON ${table}
      FOR ALL TO PUBLIC
      USING (tenant_id = current_setting('app.current_tenant_id')::UUID)
    `);
  }
  
  console.log('✅ Row Level Security enabled for tenant isolation');
}

// Create indexes for performance
async function createIndexes(client) {
  const indexes = [
    // Tenant-based indexes
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_tenant_id ON rooms(tenant_id);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_tenant_id ON bookings(tenant_id);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_business_hours_tenant_id ON business_hours(tenant_id);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_settings_tenant_id ON settings(tenant_id);',
    
    // Booking performance indexes
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_room_time ON bookings(room_id, start_time, end_time);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_tenant_date ON bookings(tenant_id, start_time);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_conflict_check ON bookings(room_id, start_time, end_time) WHERE status != \'cancelled\';',
    
    // User indexes
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_users_tenant_user ON tenant_users(tenant_id, user_id);',
    
    // Audit log indexes
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);',
    
    // Tenant subdomain index
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);'
  ];
  
  for (const indexQuery of indexes) {
    try {
      await client.query(indexQuery);
    } catch (error) {
      console.warn(`Warning: Could not create index: ${error.message}`);
    }
  }
  
  console.log('✅ Database indexes created successfully');
}

// Set current tenant context for RLS
export function setTenantContext(tenantId) {
  return `SET app.current_tenant_id = '${tenantId}'`;
}

// Create default tenant and admin user
export async function createDefaultTenant() {
  const tenantClient = new Client(dbConfig);
  try {
    await tenantClient.connect();
    
    // Check if default tenant exists
    const tenantExists = await tenantClient.query(
      'SELECT id FROM tenants WHERE subdomain = $1',
      ['demo']
    );
    
    if (tenantExists.rows.length > 0) {
      console.log('📊 Default tenant already exists');
      return tenantExists.rows[0].id;
    }
    
    // Create default tenant
    const tenantResult = await tenantClient.query(`
      INSERT INTO tenants (name, subdomain, plan_type, status, settings)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      'Demo Karaoke',
      'demo',
      'professional',
      'active',
      JSON.stringify({
        timezone: 'America/New_York',
        currency: 'USD',
        booking_advance_days: 30,
        booking_min_duration: 60,
        booking_max_duration: 480
      })
    ]);
    
    const tenantId = tenantResult.rows[0].id;
    
    // Create default admin user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = bcrypt.hashSync('demo123', 10);
    
    const userResult = await client.query(`
      INSERT INTO users (email, password, name, email_verified)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['demo@example.com', hashedPassword, 'Demo Admin', true]);
    
    const userId = userResult.rows[0].id;
    
    // Link user to tenant
    await tenantClient.query(`
      INSERT INTO tenant_users (tenant_id, user_id, role, permissions)
      VALUES ($1, $2, $3, $4)
    `, [
      tenantId,
      userId,
      'admin',
      JSON.stringify({ all: true })
    ]);
    
    // Create default rooms
    const rooms = [
      ['Room A', 4, 'Standard', 'Standard karaoke room for small groups', 25.00],
      ['Room B', 6, 'Premium', 'Premium room with better sound system', 35.00],
      ['Room C', 8, 'VIP', 'VIP room with luxury amenities', 50.00]
    ];
    
    for (const room of rooms) {
      await tenantClient.query(`
        INSERT INTO rooms (tenant_id, name, capacity, category, description, price_per_hour)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [tenantId, ...room]);
    }
    
    // Create default business hours
    for (let day = 0; day < 7; day++) {
      await tenantClient.query(`
        INSERT INTO business_hours (tenant_id, day_of_week, open_time, close_time)
        VALUES ($1, $2, $3, $4)
      `, [tenantId, day, '10:00', '22:00']);
    }
    
    // Create default settings
    const settings = [
      ['app_name', 'Boom Karaoke', 'string'],
      ['timezone', 'America/New_York', 'string'],
      ['currency', 'USD', 'string'],
      ['booking_advance_days', '30', 'number'],
      ['booking_min_duration', '60', 'number'],
      ['booking_max_duration', '480', 'number']
    ];
    
    for (const [key, value, type] of settings) {
      await tenantClient.query(`
        INSERT INTO settings (tenant_id, key, value, type)
        VALUES ($1, $2, $3, $4)
      `, [tenantId, key, value, type]);
    }
    
    console.log('✅ Default tenant and data created successfully');
    return tenantId;
    
  } catch (error) {
    console.error('❌ Failed to create default tenant:', error);
    throw error;
  } finally {
    await tenantClient.end();
  }
}

// Database query helper with tenant context
export async function queryWithTenant(tenantId, query, params = []) {
  const client = await pool.connect();
  try {
    await client.query(setTenantContext(tenantId));
    const result = await client.query(query, params);
    return result;
  } finally {
    client.release();
  }
}

// Close all connections
export async function closeConnections() {
  await pool.end();
  console.log('✅ Database connections closed');
}

export default pool;

