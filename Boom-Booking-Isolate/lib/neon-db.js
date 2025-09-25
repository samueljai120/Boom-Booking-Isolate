// Neon PostgreSQL connection for Vercel Functions
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables if not already loaded
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env.local' });
}

// Neon configuration
const sql = neon(process.env.DATABASE_URL);

// Database initialization flag - use global to persist across imports
if (!global.databaseInitialized) {
  global.databaseInitialized = false;
}

// Database initialization
export async function initDatabase() {
  if (global.databaseInitialized) {
    return;
  }
  
  try {
    console.log('🗄️ Initializing Neon database...');
    
    // Create multi-tenant tables
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

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
        UNIQUE(tenant_id, email)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        capacity INTEGER NOT NULL,
        category VARCHAR(255) NOT NULL,
        description TEXT,
        price_per_hour DECIMAL(10,2) DEFAULT 0,
        amenities JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
        UNIQUE(tenant_id, name)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS business_hours (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        open_time TIME,
        close_time TIME,
        is_closed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
        UNIQUE(tenant_id, day_of_week)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'confirmed',
        notes TEXT,
        total_price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        key VARCHAR(255) NOT NULL,
        value TEXT,
        type VARCHAR(50) DEFAULT 'string',
        category VARCHAR(100) DEFAULT 'general',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
        UNIQUE(tenant_id, key)
      )
    `;

    // Add missing columns to existing tables
    await addMissingColumns();
    
    // Insert default data
    await insertDefaultData();
    
    console.log('✅ Neon database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Neon database initialization failed:', error);
    return false;
  }
}

// Add missing columns to existing tables
async function addMissingColumns() {
  try {
    console.log('🔄 Adding missing columns to existing tables...');
    
    // Add amenities column to rooms table if it doesn't exist
    await sql`
      ALTER TABLE rooms 
      ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'
    `;
    
    console.log('✅ Missing columns added successfully');
  } catch (error) {
    console.error('❌ Failed to add missing columns:', error);
  }
}

// Insert default data
async function insertDefaultData() {
  try {
    // Check if default tenant already exists
    const tenantCount = await sql`SELECT COUNT(*) as count FROM tenants WHERE slug = 'demo'`;
    if (tenantCount[0].count > 0) {
      console.log('✅ Default data already exists');
      return;
    }

    // Create default tenant
    const defaultTenant = await sql`
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

    const tenantId = defaultTenant[0].id;

    // Insert default rooms for the tenant
    const rooms = [
      { name: 'Room A', capacity: 4, category: 'Standard', description: 'Standard karaoke room for small groups', price: 25 },
      { name: 'Room B', capacity: 6, category: 'Premium', description: 'Premium room with better sound system', price: 35 },
      { name: 'Room C', capacity: 8, category: 'VIP', description: 'VIP room with luxury amenities', price: 50 }
    ];

    for (const room of rooms) {
      await sql`
        INSERT INTO rooms (tenant_id, name, capacity, category, description, price_per_hour)
        VALUES (${tenantId}, ${room.name}, ${room.capacity}, ${room.category}, ${room.description}, ${room.price})
      `;
    }

    // Insert default business hours for the tenant
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

    // Create demo user for the tenant
    const hashedPassword = await bcrypt.hash('demo123', 10);
    await sql`
      INSERT INTO users (tenant_id, email, password, name, role)
      VALUES (${tenantId}, 'demo@example.com', ${hashedPassword}, 'Demo User', 'admin')
    `;

    console.log('✅ Default data inserted successfully');
  } catch (error) {
    console.error('❌ Failed to insert default data:', error);
  }
  
  // Mark database as initialized
  global.databaseInitialized = true;
  console.log('✅ Neon database initialized successfully');
}

// Export sql for use in API routes
export { sql };
