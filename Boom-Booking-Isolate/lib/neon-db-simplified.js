// Simplified Neon PostgreSQL connection for single-tenant Vercel Functions
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
    console.log('🗄️ Initializing simplified Neon database...');
    
    // Create simplified single-tenant tables
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        capacity INTEGER NOT NULL,
        category VARCHAR(255) NOT NULL,
        description TEXT,
        price_per_hour DECIMAL(10,2) DEFAULT 0,
        amenities JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS business_hours (
        id SERIAL PRIMARY KEY,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        open_time TIME,
        close_time TIME,
        is_closed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(day_of_week)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
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
        FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        type VARCHAR(50) DEFAULT 'string',
        category VARCHAR(100) DEFAULT 'general',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better performance
    await createIndexes();
    
    // Insert default data
    await insertDefaultData();
    
    console.log('✅ Simplified Neon database initialized successfully');
    global.databaseInitialized = true;
    return true;
  } catch (error) {
    console.error('❌ Neon database initialization failed:', error);
    return false;
  }
}

// Create performance indexes
async function createIndexes() {
  try {
    console.log('🔄 Creating performance indexes...');
    
    // Indexes for frequently queried columns
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_end_time ON bookings(end_time)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)`;
    
    console.log('✅ Performance indexes created successfully');
  } catch (error) {
    console.error('❌ Failed to create indexes:', error);
  }
}

// Insert default data
async function insertDefaultData() {
  try {
    // Check if default data already exists
    const userCount = await sql`SELECT COUNT(*) as count FROM users WHERE email = 'demo@example.com'`;
    if (userCount[0].count > 0) {
      console.log('✅ Default data already exists');
      return;
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    await sql`
      INSERT INTO users (email, password, name, role)
      VALUES ('demo@example.com', ${hashedPassword}, 'Demo User', 'admin')
    `;

    // Insert default rooms
    const rooms = [
      { name: 'Room A', capacity: 4, category: 'Standard', description: 'Standard karaoke room for small groups', price: 25 },
      { name: 'Room B', capacity: 6, category: 'Premium', description: 'Premium room with better sound system', price: 35 },
      { name: 'Room C', capacity: 8, category: 'VIP', description: 'VIP room with luxury amenities', price: 50 }
    ];

    for (const room of rooms) {
      await sql`
        INSERT INTO rooms (name, capacity, category, description, price_per_hour)
        VALUES (${room.name}, ${room.capacity}, ${room.category}, ${room.description}, ${room.price})
      `;
    }

    // Insert default business hours
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
        INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed)
        VALUES (${hour.day}, ${hour.open}, ${hour.close}, ${hour.closed})
      `;
    }

    // Insert default settings
    const settings = [
      { key: 'app_name', value: 'Boom Karaoke Booking', type: 'string', category: 'general' },
      { key: 'timezone', value: 'America/New_York', type: 'string', category: 'general' },
      { key: 'currency', value: 'USD', type: 'string', category: 'general' },
      { key: 'booking_advance_days', value: '30', type: 'number', category: 'booking' },
      { key: 'booking_min_duration', value: '60', type: 'number', category: 'booking' },
      { key: 'booking_max_duration', value: '480', type: 'number', category: 'booking' }
    ];

    for (const setting of settings) {
      await sql`
        INSERT INTO settings (key, value, type, category)
        VALUES (${setting.key}, ${setting.value}, ${setting.type}, ${setting.category})
      `;
    }

    console.log('✅ Default data inserted successfully');
  } catch (error) {
    console.error('❌ Failed to insert default data:', error);
  }
}

// Export sql for use in API routes
export { sql };
