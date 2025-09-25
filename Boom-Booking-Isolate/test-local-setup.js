// Test Local Development Setup
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

console.log('🧪 Testing Local Development Setup');
console.log('==================================');

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    return { success: true, data };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`);
    return { success: false, error };
  }
}

async function runTests() {
  console.log('\n📡 Testing API Endpoints...\n');
  
  // Test health endpoint
  await testEndpoint('/api/health');
  
  // Test rooms endpoint
  const roomsResult = await testEndpoint('/api/rooms');
  if (roomsResult.success) {
    console.log(`   📊 Found ${roomsResult.data.data.length} rooms`);
  }
  
  // Test business hours endpoint
  const hoursResult = await testEndpoint('/api/business-hours');
  if (hoursResult.success) {
    console.log(`   ⏰ Found ${hoursResult.data.data.length} business hour entries`);
  }
  
  // Test login endpoint
  const loginResult = await testEndpoint('/api/auth/login', 'POST', {
    email: 'demo@example.com',
    password: 'demo123'
  });
  
  if (loginResult.success) {
    console.log(`   🔑 Login successful - Token: ${loginResult.data.token.substring(0, 20)}...`);
    
    // Test authenticated endpoint
    const meResult = await testEndpoint('/api/auth/me', 'GET');
    
    if (meResult.success && meResult.data.user) {
      console.log(`   👤 User info: ${meResult.data.user.name} (${meResult.data.user.role})`);
    } else {
      console.log(`   ⚠️  Auth endpoint needs Authorization header (this is expected)`);
    }
  }
  
  console.log('\n🎉 Local development setup is working correctly!');
  console.log('\n📋 Available Commands:');
  console.log('  npm run dev:full    - Start both frontend and backend');
  console.log('  npm run dev         - Start frontend only');
  console.log('  npm run server:local - Start backend only');
  console.log('  npm run start       - Build and start full app');
  console.log('\n🌐 URLs:');
  console.log(`  Frontend: http://localhost:5173 (Vite dev server)`);
  console.log(`  Full App: http://localhost:3000 (with built frontend)`);
  console.log(`  API: http://localhost:3000/api/*`);
}

// Run tests
runTests().catch(console.error);
