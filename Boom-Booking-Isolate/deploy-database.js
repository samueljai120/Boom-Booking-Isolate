#!/usr/bin/env node

/**
 * Database Deployment Script for Boom Booking
 * This script deploys the database schema to Neon PostgreSQL
 * 
 * Usage:
 *   node deploy-database.js [--env production|development]
 * 
 * Environment Variables Required:
 *   - DATABASE_URL: Neon PostgreSQL connection string
 *   - NODE_ENV: Environment (development|production)
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envFile = process.argv.includes('--env') && process.argv[process.argv.indexOf('--env') + 1] === 'production' 
  ? '.env.production' 
  : '.env.local';

dotenv.config({ path: envFile });

const sql = neon(process.env.DATABASE_URL);

async function deployDatabase() {
  console.log('🚀 Starting Boom Booking Database Deployment');
  console.log('============================================');
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not Connected'}`);
  console.log('');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    // Read and execute schema file
    console.log('📖 Reading database schema...');
    const schemaPath = join(__dirname, 'database-schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    console.log('🔧 Executing database schema...');
    await sql(schema);
    
    console.log('✅ Database schema deployed successfully!');
    
    // Verify deployment
    console.log('🔍 Verifying deployment...');
    
    // Check tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 Created tables:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // Check data
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const roomCount = await sql`SELECT COUNT(*) as count FROM rooms`;
    const hoursCount = await sql`SELECT COUNT(*) as count FROM business_hours`;
    
    console.log('📊 Data verification:');
    console.log(`   - Users: ${userCount[0].count}`);
    console.log(`   - Rooms: ${roomCount[0].count}`);
    console.log(`   - Business Hours: ${hoursCount[0].count}`);
    
    console.log('');
    console.log('🎉 Database deployment completed successfully!');
    console.log('🔗 Your Boom Booking system is ready to use!');
    
  } catch (error) {
    console.error('❌ Database deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
deployDatabase();
