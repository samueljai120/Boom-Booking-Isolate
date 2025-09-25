// Test script to verify all fixes are working
import { sql, initDatabase } from './Boom-Booking-Isolate/lib/neon-db-simplified.js';

async function testDatabaseConnection() {
  console.log('🧪 Testing database connection...');
  
  try {
    await initDatabase();
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function testTablesExist() {
  console.log('🧪 Testing table existence...');
  
  try {
    const tables = ['users', 'rooms', 'business_hours', 'bookings', 'settings'];
    
    for (const table of tables) {
      const result = await sql`SELECT COUNT(*) as count FROM ${table}`;
      console.log(`✅ Table ${table} exists with ${result[0].count} records`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Table check failed:', error);
    return false;
  }
}

async function testIndexes() {
  console.log('🧪 Testing database indexes...');
  
  try {
    const indexes = [
      'idx_users_email',
      'idx_rooms_active', 
      'idx_bookings_room_id',
      'idx_bookings_start_time',
      'idx_bookings_end_time',
      'idx_bookings_status',
      'idx_settings_key'
    ];
    
    for (const index of indexes) {
      const result = await sql`
        SELECT indexname 
        FROM pg_indexes 
        WHERE indexname = ${index}
      `;
      
      if (result.length > 0) {
        console.log(`✅ Index ${index} exists`);
      } else {
        console.log(`⚠️ Index ${index} not found`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Index check failed:', error);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('🧪 Testing API endpoints...');
  
  const endpoints = [
    '/api/health',
    '/api/rooms',
    '/api/business-hours',
    '/api/auth/login'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`https://boom-karaoke-booking.vercel.app${endpoint}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
      } else {
        console.log(`⚠️ ${endpoint} - Status: ${response.status}, Success: ${data.success}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive test suite...\n');
  
  const results = {
    databaseConnection: await testDatabaseConnection(),
    tablesExist: await testTablesExist(),
    indexes: await testIndexes(),
    apiEndpoints: await testAPIEndpoints()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${test}: ${status}`);
  });
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! System is ready for production.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the issues above.');
  }
  
  return allPassed;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, testDatabaseConnection, testTablesExist, testIndexes, testAPIEndpoints };
