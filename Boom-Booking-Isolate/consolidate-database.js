#!/usr/bin/env node

/**
 * Database Consolidation Script
 * 
 * This script consolidates all database implementations
 * into a single, clean PostgreSQL implementation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗄️ DATABASE CONSOLIDATION SCRIPT');
console.log('=================================');

// Database files to analyze
const databaseFiles = [
  'lib/db.js',                    // PlanetScale (unused)
  'lib/neon-db.js',              // Neon serverless
  'backend/database/postgres.js', // PostgreSQL with connection pooling
  'backend/database/init.js',     // SQLite initialization (legacy)
  'database-schema.sql',          // SQL schema
  'multi-tenant-schema.sql'       // Multi-tenant schema
];

// Files to keep (main production database)
const keepFiles = [
  'backend/database/postgres.js', // Main PostgreSQL implementation
  'multi-tenant-schema.sql'       // Multi-tenant schema
];

// Files to remove (legacy/unused implementations)
const removeFiles = [
  'lib/db.js',                    // PlanetScale (unused)
  'backend/database/init.js'      // SQLite (legacy)
];

console.log('\n📋 CONSOLIDATION PLAN');
console.log('=====================');

console.log('\n✅ KEEP (Main Production Database):');
keepFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n❌ REMOVE (Legacy/Unused Database):');
removeFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n🔍 ANALYSIS:');
console.log('============');

// Analyze main database file
const mainDbPath = path.join(__dirname, 'backend/database/postgres.js');
if (fs.existsSync(mainDbPath)) {
  const content = fs.readFileSync(mainDbPath, 'utf8');
  
  console.log('\n📊 Main Database Analysis (backend/database/postgres.js):');
  console.log(`   Lines of code: ${content.split('\n').length}`);
  console.log(`   Connection pooling: ${content.includes('Pool') ? '✅' : '❌'}`);
  console.log(`   Railway support: ${content.includes('DATABASE_URL') ? '✅' : '❌'}`);
  console.log(`   SSL support: ${content.includes('ssl') ? '✅' : '❌'}`);
  console.log(`   Error handling: ${content.includes('try') ? '✅' : '❌'}`);
  
  // Check for key features
  const features = {
    'PostgreSQL': content.includes('pg') || content.includes('postgres'),
    'Connection Pooling': content.includes('Pool'),
    'Railway Support': content.includes('DATABASE_URL'),
    'SSL Support': content.includes('ssl'),
    'Error Handling': content.includes('try') && content.includes('catch'),
    'Environment Detection': content.includes('process.env'),
    'Multi-tenant Ready': content.includes('tenant') || content.includes('multi-tenant')
  };
  
  console.log('\n🎯 Features Detected:');
  Object.entries(features).forEach(([feature, present]) => {
    console.log(`   ${present ? '✅' : '❌'} ${feature}`);
  });
}

// Check for SQLite references
console.log('\n🔍 SQLite References Check:');
const sqliteFiles = [
  'backend/server.js',
  'server-local.js',
  'package.json'
];

sqliteFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasSqlite = content.toLowerCase().includes('sqlite');
    console.log(`   ${hasSqlite ? '⚠️' : '✅'} ${file} ${hasSqlite ? '(has SQLite references)' : '(clean)'}`);
  }
});

console.log('\n🚀 CONSOLIDATION RECOMMENDATIONS:');
console.log('==================================');

console.log('\n1. MAIN PRODUCTION DATABASE: backend/database/postgres.js');
console.log('   - PostgreSQL with connection pooling');
console.log('   - Railway and local development support');
console.log('   - Multi-tenant architecture ready');
console.log('   - SSL and error handling included');

console.log('\n2. KEEP NEON SUPPORT: lib/neon-db.js');
console.log('   - Serverless PostgreSQL option');
console.log('   - Good for Vercel deployment');
console.log('   - Keep as alternative implementation');

console.log('\n3. REMOVE LEGACY DATABASES:');
removeFiles.forEach(file => {
  console.log(`   - ${file} (legacy/unused)`);
});

console.log('\n4. UPDATE DATABASE REFERENCES:');
console.log('   - Remove SQLite imports from server files');
console.log('   - Update package.json dependencies');
console.log('   - Update environment variable documentation');

console.log('\n5. MIGRATION STRATEGY:');
console.log('   - SQLite → PostgreSQL migration script');
console.log('   - Data validation and integrity checks');
console.log('   - Rollback plan for production');

console.log('\n🎯 NEXT STEPS:');
console.log('==============');
console.log('1. Remove legacy database files');
console.log('2. Update server files to use PostgreSQL only');
console.log('3. Create migration script for existing data');
console.log('4. Update documentation');
console.log('5. Test database consolidation');

console.log('\n✨ Database consolidation analysis complete!');
