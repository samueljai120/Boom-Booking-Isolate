// Vercel Postgres Database Connection
import { sql } from '@vercel/postgres';

// Database initialization
export async function initDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create rooms table
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        capacity INTEGER NOT NULL,
        category VARCHAR(255) NOT NULL,
        description TEXT,
        price_per_hour DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create bookings table
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
        FOREIGN KEY (room_id) REFERENCES rooms (id)
      )
    `;

    // Create business_hours table
    await sql`
      CREATE TABLE IF NOT EXISTS business_hours (
        id SERIAL PRIMARY KEY,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        open_time TIME,
        close_time TIME,
        is_closed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Insert default data
    await insertDefaultData();

    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// Insert default data
async function insertDefaultData() {
  try {
    // Check if data already exists
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    if (userCount.rows[0].count > 0) {
      console.log('✅ Default data already exists');
      return;
    }

    // Insert default rooms
    await sql`
      INSERT INTO rooms (name, capacity, category, description, price_per_hour)
      VALUES 
        ('Room A', 4, 'Standard', 'Standard karaoke room for small groups', 25.00),
        ('Room B', 6, 'Premium', 'Premium room with better sound system', 35.00),
        ('Room C', 8, 'VIP', 'VIP room with luxury amenities', 50.00)
    `;

    // Insert default business hours
    await sql`
      INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed)
      VALUES 
        (0, '10:00', '21:00', false),
        (1, '09:00', '22:00', false),
        (2, '09:00', '22:00', false),
        (3, '09:00', '22:00', false),
        (4, '09:00', '23:00', false),
        (5, '10:00', '23:00', false),
        (6, '10:00', '21:00', false)
    `;

    // Insert demo user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    await sql`
      INSERT INTO users (email, password, name, role)
      VALUES ('demo@example.com', ${hashedPassword}, 'Demo User', 'admin')
    `;

    console.log('✅ Default data inserted successfully');
  } catch (error) {
    console.error('❌ Failed to insert default data:', error);
  }
}

// Export database functions
export { sql };
