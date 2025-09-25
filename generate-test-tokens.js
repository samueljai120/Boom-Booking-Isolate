#!/usr/bin/env node

import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-local-jwt-secret-key-here';

// Generate JWT tokens for different tenants
function generateToken(userId, email, tenantId, role = 'admin') {
  return jwt.sign(
    { 
      id: userId, 
      email: email, 
      role: role,
      tenant_id: tenantId
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

console.log('🔐 Generated Test JWT Tokens');
console.log('============================');

// Token for Demo tenant (tenant ID 1)
const demoToken = generateToken(1, 'demo@example.com', 1, 'admin');
console.log('\n📋 Demo Tenant (ID: 1)');
console.log('Token:', demoToken);

// Token for Test Venue 2 (tenant ID 6)
const testVenue2Token = generateToken(10, 'testvenue2@example.com', 6, 'admin');
console.log('\n📋 Test Venue 2 (ID: 6)');
console.log('Token:', testVenue2Token);

// Token for New Venue (tenant ID 5)
const newVenueToken = generateToken(9, 'newvenue@example.com', 5, 'admin');
console.log('\n📋 New Venue (ID: 5)');
console.log('Token:', newVenueToken);

console.log('\n🧪 Test Commands:');
console.log('curl -H "Authorization: Bearer ' + demoToken + '" http://localhost:3000/api/rooms');
console.log('curl -H "Authorization: Bearer ' + testVenue2Token + '" http://localhost:3000/api/rooms');
console.log('curl -H "Authorization: Bearer ' + newVenueToken + '" http://localhost:3000/api/rooms');

