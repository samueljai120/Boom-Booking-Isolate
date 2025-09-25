#!/usr/bin/env node

/**
 * Fix Constraints Script
 * This script fixes the unique constraint issue for multi-tenant support
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function fixConstraints() {
  console.log('🔧 Fixing database constraints for multi-tenancy...');
  console.log('==================================================');

  try {
    // Drop old unique constraint on business_hours
    console.log('🗑️ Dropping old business_hours constraint...');
    await sql`
      ALTER TABLE business_hours 
      DROP CONSTRAINT IF EXISTS business_hours_day_of_week_key
    `;

    // Add new multi-tenant unique constraint
    console.log('✅ Adding new multi-tenant constraint...');
    await sql`
      ALTER TABLE business_hours 
      ADD CONSTRAINT unique_business_hours_per_tenant 
      UNIQUE (tenant_id, day_of_week)
    `;

    console.log('🎉 Constraints fixed successfully!');
    console.log('🔗 Your database is now ready for multi-tenant use!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run fix
fixConstraints();
