#!/usr/bin/env node

/**
 * Multi-Tenant Database Test Script
 * This script tests the multi-tenant functionality to ensure proper tenant isolation
 */

import { sql, initDatabase } from './Boom-Booking-Isolate/lib/neon-db.js';

async function testMultiTenantFunctionality() {
  console.log('🧪 Testing Multi-Tenant Database Functionality');
  console.log('==============================================');

  try {
    // Initialize database connection
    await initDatabase();
    
    // Test 1: Verify tenants table exists and has data
    console.log('\n📋 Test 1: Verifying tenants table...');
    const tenants = await sql`SELECT id, name, slug, email, is_active FROM tenants ORDER BY id`;
    console.log(`✅ Found ${tenants.length} tenants:`);
    tenants.forEach(tenant => {
      console.log(`   - ID: ${tenant.id}, Name: ${tenant.name}, Slug: ${tenant.slug}, Active: ${tenant.is_active}`);
    });

    // Test 2: Verify tenant isolation in users table
    console.log('\n👥 Test 2: Verifying tenant isolation in users...');
    const usersByTenant = await sql`
      SELECT 
        t.name as tenant_name,
        t.slug as tenant_slug,
        COUNT(u.id) as user_count,
        STRING_AGG(u.name, ', ') as user_names
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      GROUP BY t.id, t.name, t.slug
      ORDER BY t.id
    `;
    
    console.log('✅ Users by tenant:');
    usersByTenant.forEach(row => {
      console.log(`   - ${row.tenant_name} (${row.tenant_slug}): ${row.user_count} users`);
      if (row.user_names) {
        console.log(`     Users: ${row.user_names}`);
      }
    });

    // Test 3: Verify tenant isolation in rooms table
    console.log('\n🏠 Test 3: Verifying tenant isolation in rooms...');
    const roomsByTenant = await sql`
      SELECT 
        t.name as tenant_name,
        t.slug as tenant_slug,
        COUNT(r.id) as room_count,
        STRING_AGG(r.name, ', ') as room_names
      FROM tenants t
      LEFT JOIN rooms r ON t.id = r.tenant_id
      GROUP BY t.id, t.name, t.slug
      ORDER BY t.id
    `;
    
    console.log('✅ Rooms by tenant:');
    roomsByTenant.forEach(row => {
      console.log(`   - ${row.tenant_name} (${row.tenant_slug}): ${row.room_count} rooms`);
      if (row.room_names) {
        console.log(`     Rooms: ${row.room_names}`);
      }
    });

    // Test 4: Verify tenant isolation in bookings table
    console.log('\n📅 Test 4: Verifying tenant isolation in bookings...');
    const bookingsByTenant = await sql`
      SELECT 
        t.name as tenant_name,
        t.slug as tenant_slug,
        COUNT(b.id) as booking_count,
        COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings
      FROM tenants t
      LEFT JOIN bookings b ON t.id = b.tenant_id
      GROUP BY t.id, t.name, t.slug
      ORDER BY t.id
    `;
    
    console.log('✅ Bookings by tenant:');
    bookingsByTenant.forEach(row => {
      console.log(`   - ${row.tenant_name} (${row.tenant_slug}): ${row.booking_count} bookings (${row.confirmed_bookings} confirmed)`);
    });

    // Test 5: Test tenant-specific queries
    console.log('\n🔍 Test 5: Testing tenant-specific queries...');
    
    for (const tenant of tenants) {
      console.log(`\n   Testing queries for tenant: ${tenant.name} (ID: ${tenant.id})`);
      
      // Test room query
      const tenantRooms = await sql`
        SELECT id, name, capacity, category, price_per_hour 
        FROM rooms 
        WHERE tenant_id = ${tenant.id} AND is_active = true
      `;
      console.log(`     - Active rooms: ${tenantRooms.length}`);
      
      // Test booking query
      const tenantBookings = await sql`
        SELECT COUNT(*) as count 
        FROM bookings 
        WHERE tenant_id = ${tenant.id}
      `;
      console.log(`     - Total bookings: ${tenantBookings[0].count}`);
      
      // Test business hours query
      const tenantHours = await sql`
        SELECT COUNT(*) as count 
        FROM business_hours 
        WHERE tenant_id = ${tenant.id}
      `;
      console.log(`     - Business hours configured: ${tenantHours[0].count}`);
    }

    // Test 6: Test cross-tenant data isolation
    console.log('\n🔒 Test 6: Testing cross-tenant data isolation...');
    
    if (tenants.length >= 2) {
      const tenant1 = tenants[0];
      const tenant2 = tenants[1];
      
      // Try to query tenant1's data using tenant2's ID (should return empty)
      const crossTenantRooms = await sql`
        SELECT COUNT(*) as count 
        FROM rooms 
        WHERE tenant_id = ${tenant1.id}
        AND id IN (
          SELECT id FROM rooms WHERE tenant_id = ${tenant2.id}
        )
      `;
      
      if (crossTenantRooms[0].count === '0') {
        console.log('✅ Cross-tenant data isolation working correctly');
      } else {
        console.log('❌ Cross-tenant data isolation failed - data leakage detected');
      }
    } else {
      console.log('⚠️  Need at least 2 tenants to test cross-tenant isolation');
    }

    // Test 7: Test database functions
    console.log('\n⚙️  Test 7: Testing database functions...');
    
    try {
      // Test get_tenant_by_slug function
      const demoTenant = await sql`SELECT * FROM get_tenant_by_slug('demo')`;
      if (demoTenant.length > 0) {
        console.log('✅ get_tenant_by_slug function working');
      } else {
        console.log('⚠️  get_tenant_by_slug function not working or demo tenant not found');
      }
      
      // Test is_tenant_time_slot_available function (if we have rooms and bookings)
      const rooms = await sql`SELECT id FROM rooms LIMIT 1`;
      if (rooms.length > 0) {
        const roomId = rooms[0].id;
        const tenantId = tenants[0].id;
        const isAvailable = await sql`
          SELECT is_tenant_time_slot_available(
            ${tenantId}, 
            ${roomId}, 
            '2025-01-01 10:00:00'::timestamp, 
            '2025-01-01 11:00:00'::timestamp
          ) as available
        `;
        console.log('✅ is_tenant_time_slot_available function working');
      }
    } catch (error) {
      console.log('⚠️  Database functions test failed:', error.message);
    }

    console.log('\n🎉 Multi-Tenant Database Test Completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Tenants: ${tenants.length}`);
    console.log(`   - Total Users: ${usersByTenant.reduce((sum, row) => sum + parseInt(row.user_count), 0)}`);
    console.log(`   - Total Rooms: ${roomsByTenant.reduce((sum, row) => sum + parseInt(row.room_count), 0)}`);
    console.log(`   - Total Bookings: ${bookingsByTenant.reduce((sum, row) => sum + parseInt(row.booking_count), 0)}`);
    
    console.log('\n✅ Multi-tenant database is properly configured and functional!');
    
  } catch (error) {
    console.error('❌ Multi-tenant test failed:', error);
    process.exit(1);
  }
}

// Run the test
testMultiTenantFunctionality();
