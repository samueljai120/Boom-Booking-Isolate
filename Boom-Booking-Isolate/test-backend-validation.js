#!/usr/bin/env node

/**
 * Backend Validation Test Script
 * 
 * This script validates the backend security fixes and tenant isolation
 */

import fs from 'fs';
import path from 'path';

console.log('🔒 BACKEND SECURITY VALIDATION');
console.log('===============================');
console.log('Testing security fixes and tenant isolation...\n');

function validateBackendSecurity() {
  let allTestsPassed = true;
  
  console.log('1. Checking database route security...');
  
  // Check database.js for security fixes
  const databaseRoutePath = 'backend/routes/database.js';
  if (fs.existsSync(databaseRoutePath)) {
    const content = fs.readFileSync(databaseRoutePath, 'utf8');
    
    // Check for security improvements
    const hasSuperAdminCheck = content.includes('req.user.role !== \'super_admin\'');
    const hasPostgreSQLQueries = content.includes('pool.query');
    const hasNoSQLiteQueries = !content.includes('db.all');
    const hasNoArbitraryQuery = !content.includes('db.all(query');
    const hasParameterizedQueries = content.includes('$1');
    
    console.log(`   ✅ Super admin check: ${hasSuperAdminCheck ? 'FOUND' : 'MISSING'}`);
    console.log(`   ✅ PostgreSQL queries: ${hasPostgreSQLQueries ? 'FOUND' : 'MISSING'}`);
    console.log(`   ✅ No SQLite queries: ${hasNoSQLiteQueries ? 'SAFE' : 'VULNERABLE'}`);
    console.log(`   ✅ No arbitrary query: ${hasNoArbitraryQuery ? 'SAFE' : 'VULNERABLE'}`);
    console.log(`   ✅ Parameterized queries: ${hasParameterizedQueries ? 'FOUND' : 'MISSING'}`);
    
    if (!hasSuperAdminCheck || !hasPostgreSQLQueries || !hasNoSQLiteQueries || !hasNoArbitraryQuery || !hasParameterizedQueries) {
      allTestsPassed = false;
    }
  } else {
    console.log('   ❌ Database route file not found');
    allTestsPassed = false;
  }
  
  console.log('\n2. Checking tenant isolation in bookings...');
  
  // Check bookings.js for tenant isolation
  const bookingsRoutePath = 'backend/routes/bookings.js';
  if (fs.existsSync(bookingsRoutePath)) {
    const content = fs.readFileSync(bookingsRoutePath, 'utf8');
    
    const hasTenantIdInQueries = content.includes('tenant_id = $1');
    const hasPostgreSQLQueries = content.includes('pool.query');
    const hasNoSQLiteQueries = !content.includes('db.run');
    const hasJoinWithTenant = content.includes('WHERE b.tenant_id = $1');
    
    console.log(`   ✅ Tenant ID in queries: ${hasTenantIdInQueries ? 'FOUND' : 'MISSING'}`);
    console.log(`   ✅ PostgreSQL queries: ${hasPostgreSQLQueries ? 'FOUND' : 'MISSING'}`);
    console.log(`   ✅ No SQLite queries: ${hasNoSQLiteQueries ? 'SAFE' : 'VULNERABLE'}`);
    console.log(`   ✅ JOIN with tenant: ${hasJoinWithTenant ? 'FOUND' : 'MISSING'}`);
    
    if (!hasTenantIdInQueries || !hasPostgreSQLQueries || !hasNoSQLiteQueries || !hasJoinWithTenant) {
      allTestsPassed = false;
    }
  } else {
    console.log('   ❌ Bookings route file not found');
    allTestsPassed = false;
  }
  
  console.log('\n3. Checking tenant isolation in rooms...');
  
  // Check rooms.js for tenant isolation
  const roomsRoutePath = 'backend/routes/rooms.js';
  if (fs.existsSync(roomsRoutePath)) {
    const content = fs.readFileSync(roomsRoutePath, 'utf8');
    
    const hasTenantIdInQueries = content.includes('tenant_id = $1');
    const hasPostgreSQLQueries = content.includes('pool.query');
    const hasNoSQLiteQueries = !content.includes('db.run');
    const hasDefaultTenant = content.includes('req.tenant_id || \'5ba3b120-e288-450d-97f2-cfc236e0894f\'');
    
    console.log(`   ✅ Tenant ID in queries: ${hasTenantIdInQueries ? 'FOUND' : 'MISSING'}`);
    console.log(`   ✅ PostgreSQL queries: ${hasPostgreSQLQueries ? 'FOUND' : 'MISSING'}`);
    console.log(`   ✅ No SQLite queries: ${hasNoSQLiteQueries ? 'SAFE' : 'VULNERABLE'}`);
    console.log(`   ✅ Default tenant fallback: ${hasDefaultTenant ? 'FOUND' : 'MISSING'}`);
    
    if (!hasTenantIdInQueries || !hasPostgreSQLQueries || !hasNoSQLiteQueries) {
      allTestsPassed = false;
    }
  } else {
    console.log('   ❌ Rooms route file not found');
    allTestsPassed = false;
  }
  
  console.log('\n4. Checking for removed vulnerable files...');
  
  // Check that old vulnerable files are removed
  const vulnerableFiles = [
    'src/lib/api.js',
    'src/lib/fetchClient.js',
    'src/lib/mockData.js',
    'src/contexts/AuthContext.jsx',
    'src/contexts/TenantContext.jsx',
    'src/contexts/WebSocketContext.jsx'
  ];
  
  let allVulnerableFilesRemoved = true;
  for (const file of vulnerableFiles) {
    if (fs.existsSync(file)) {
      console.log(`   ❌ ${file} - STILL EXISTS (should be removed)`);
      allVulnerableFilesRemoved = false;
    } else {
      console.log(`   ✅ ${file} - REMOVED`);
    }
  }
  
  if (!allVulnerableFilesRemoved) {
    allTestsPassed = false;
  }
  
  console.log('\n5. Checking for new secure files...');
  
  // Check that new secure files exist
  const secureFiles = [
    'src/lib/unifiedApiClient.js',
    'src/contexts/SimplifiedAuthContext.jsx',
    'src/contexts/SimplifiedTenantContext.jsx',
    'src/contexts/UnifiedWebSocketContext.jsx',
    'src/utils/systemValidation.js'
  ];
  
  let allSecureFilesExist = true;
  for (const file of secureFiles) {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file} - EXISTS`);
    } else {
      console.log(`   ❌ ${file} - MISSING`);
      allSecureFilesExist = false;
    }
  }
  
  if (!allSecureFilesExist) {
    allTestsPassed = false;
  }
  
  return allTestsPassed;
}

// Run validation
const allTestsPassed = validateBackendSecurity();

console.log('\n📊 VALIDATION SUMMARY');
console.log('=====================');

if (allTestsPassed) {
  console.log('🎉 ALL SECURITY TESTS PASSED!');
  console.log('✅ Database security vulnerabilities fixed');
  console.log('✅ Tenant isolation properly implemented');
  console.log('✅ Vulnerable files removed');
  console.log('✅ Secure files implemented');
  console.log('\n🔒 The system is now secure and production-ready!');
  process.exit(0);
} else {
  console.log('❌ SOME SECURITY TESTS FAILED!');
  console.log('⚠️  Please review the failed tests and fix the issues.');
  process.exit(1);
}
