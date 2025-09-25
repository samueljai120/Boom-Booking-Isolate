// Test Neon Database Connection
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config({ path: '.env.local' });

// Import after loading env vars
import { sql, initDatabase } from './lib/neon-db.js';

console.log('🧪 Testing Neon Database Connection');
console.log('==================================');

async function testConnection() {
  try {
    console.log('📡 Connecting to Neon database...');
    console.log(`🔗 Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
    
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time, version() as postgres_version`;
    console.log('✅ Database connection successful!');
    console.log(`⏰ Current time: ${result[0].current_time}`);
    console.log(`🐘 PostgreSQL version: ${result[0].postgres_version}`);
    
    // Test table existence
    console.log('\n📋 Checking tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📊 Available tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Test users table
    if (tables.some(t => t.table_name === 'users')) {
      console.log('\n👥 Testing users table...');
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      console.log(`👤 Total users: ${userCount[0].count}`);
      
      if (userCount[0].count > 0) {
        const users = await sql`SELECT id, email, name, role FROM users LIMIT 3`;
        console.log('👥 Sample users:');
        users.forEach(user => {
          console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
        });
      }
    }
    
    // Test rooms table
    if (tables.some(t => t.table_name === 'rooms')) {
      console.log('\n🏠 Testing rooms table...');
      const roomCount = await sql`SELECT COUNT(*) as count FROM rooms`;
      console.log(`🏠 Total rooms: ${roomCount[0].count}`);
      
      if (roomCount[0].count > 0) {
        const rooms = await sql`SELECT id, name, capacity, category FROM rooms LIMIT 3`;
        console.log('🏠 Sample rooms:');
        rooms.forEach(room => {
          console.log(`  - ${room.name} (${room.capacity} people) - ${room.category}`);
        });
      }
    }
    
    console.log('\n✅ All tests passed! Database is ready for local development.');
    return true;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Error details:', error);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('\n🚀 Ready to start local development!');
    console.log('Run: npm run dev:full');
  } else {
    console.log('\n❌ Please check your database configuration and try again.');
    process.exit(1);
  }
});
