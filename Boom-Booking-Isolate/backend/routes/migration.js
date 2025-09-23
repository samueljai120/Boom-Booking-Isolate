import express from 'express';
import { pool } from '../database/postgres.js';

const router = express.Router();

// Migration endpoint to fix database schema
router.post('/fix-schema', async (req, res) => {
  const client = await pool.connect();
  try {
    console.log('🔧 Running database schema migration...');
    
    // Check if role column exists in users table
    const roleColumnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    `);
    
    if (roleColumnExists.rows.length === 0) {
      console.log('➕ Adding missing role column to users table...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(50) DEFAULT 'user'
      `);
      console.log('✅ Role column added successfully');
      
      // Update existing users to have 'user' role
      const updateResult = await client.query(`
        UPDATE users 
        SET role = 'user' 
        WHERE role IS NULL OR role = ''
      `);
      console.log(`✅ Updated ${updateResult.rowCount} users with default role`);
    } else {
      console.log('✅ Role column already exists');
    }
    
    // Check current data
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    const tenantCount = await client.query('SELECT COUNT(*) as count FROM tenants');
    const roomCount = await client.query('SELECT COUNT(*) as count FROM rooms');
    
    res.json({
      success: true,
      message: 'Database schema migration completed successfully',
      data: {
        users: userCount.rows[0].count,
        tenants: tenantCount.rows[0].count,
        rooms: roomCount.rows[0].count,
        roleColumnAdded: roleColumnExists.rows.length === 0
      }
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message
    });
  } finally {
    client.release();
  }
});

export default router;
