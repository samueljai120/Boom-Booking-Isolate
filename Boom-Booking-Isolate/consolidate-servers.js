#!/usr/bin/env node

/**
 * Server Consolidation Script
 * 
 * This script consolidates all the different server implementations
 * into a single, clean production server.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 SERVER CONSOLIDATION SCRIPT');
console.log('==============================');

// Server files to analyze
const serverFiles = [
  'server.js',
  'server-local.js',
  'backend/server.js',
  'backend/server-production.js',
  'backend/server-railway.js',
  'backend/server-railway-fixed.js',
  'backend/server-robust-railway.js',
  'backend/server-simple-railway.js',
  'backend/server-simple.js',
  'backend/server-minimal-railway.js'
];

// Files to keep (main production servers)
const keepFiles = [
  'backend/server.js',  // Main production server
  'server-local.js'     // Local development server
];

// Files to remove (duplicates and old implementations)
const removeFiles = [
  'backend/server-production.js',
  'backend/server-railway.js',
  'backend/server-railway-fixed.js',
  'backend/server-robust-railway.js',
  'backend/server-simple-railway.js',
  'backend/server-simple.js',
  'backend/server-minimal-railway.js'
];

console.log('\n📋 CONSOLIDATION PLAN');
console.log('=====================');

console.log('\n✅ KEEP (Main Production Servers):');
keepFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n❌ REMOVE (Duplicate/Outdated Servers):');
removeFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n🔍 ANALYSIS:');
console.log('============');

// Analyze main server file
const mainServerPath = path.join(__dirname, 'backend/server.js');
if (fs.existsSync(mainServerPath)) {
  const content = fs.readFileSync(mainServerPath, 'utf8');
  
  console.log('\n📊 Main Server Analysis (backend/server.js):');
  console.log(`   Lines of code: ${content.split('\n').length}`);
  console.log(`   Imports: ${(content.match(/import/g) || []).length}`);
  console.log(`   Routes: ${(content.match(/app\.use\(/g) || []).length}`);
  console.log(`   Middleware: ${(content.match(/middleware/g) || []).length}`);
  
  // Check for key features
  const features = {
    'PostgreSQL': content.includes('postgres') || content.includes('DATABASE_URL'),
    'Multi-tenant': content.includes('tenant') || content.includes('multi-tenant'),
    'WebSocket': content.includes('socket.io') || content.includes('io'),
    'Security': content.includes('helmet') || content.includes('cors'),
    'Health Check': content.includes('/api/health'),
    'Error Handling': content.includes('errorHandler') || content.includes('catch')
  };
  
  console.log('\n🎯 Features Detected:');
  Object.entries(features).forEach(([feature, present]) => {
    console.log(`   ${present ? '✅' : '❌'} ${feature}`);
  });
}

console.log('\n🚀 CONSOLIDATION RECOMMENDATIONS:');
console.log('==================================');

console.log('\n1. MAIN PRODUCTION SERVER: backend/server.js');
console.log('   - This is the most complete and up-to-date server');
console.log('   - Includes multi-tenant architecture');
console.log('   - Has proper PostgreSQL integration');
console.log('   - Includes all security middleware');

console.log('\n2. LOCAL DEVELOPMENT SERVER: server-local.js');
console.log('   - Keep for local development');
console.log('   - Simplified version for testing');

console.log('\n3. REMOVE DUPLICATE SERVERS:');
removeFiles.forEach(file => {
  console.log(`   - ${file} (duplicate/outdated)`);
});

console.log('\n4. UPDATE PACKAGE.JSON SCRIPTS:');
console.log('   - "start": "node backend/server.js"');
console.log('   - "dev": "node server-local.js"');
console.log('   - Remove references to old server files');

console.log('\n5. UPDATE DEPLOYMENT CONFIGS:');
console.log('   - Railway: Use backend/server.js');
console.log('   - Docker: Use backend/server.js');
console.log('   - Render: Use backend/server.js');

console.log('\n🎯 NEXT STEPS:');
console.log('==============');
console.log('1. Run this script to remove duplicate servers');
console.log('2. Update package.json scripts');
console.log('3. Update deployment configurations');
console.log('4. Test the consolidated server');
console.log('5. Update documentation');

console.log('\n✨ Server consolidation analysis complete!');
