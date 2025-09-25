// Vercel API Route: /api/bookings/updates
import { sql, initDatabase } from '../../Boom-Booking-Isolate/lib/neon-db.js';
import { withTenantAuth } from '../middleware/tenant-auth.js';

// Main handler with tenant authentication
async function updatesHandler(req, res) {
  try {
    // Only allow GET method
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

    // Initialize database
    await initDatabase();
    
    // tenantId is now available from req.tenantId (set by middleware)
    const tenantId = req.tenantId;

    // Get query parameters
    const { 
      since, 
      room_id, 
      status, 
      start_date, 
      end_date,
      limit = '100'
    } = req.query;

    // Build the query
    let query = sql`
      SELECT 
        b.*,
        r.name as room_name,
        r.capacity as room_capacity,
        r.category as room_category,
        r.price_per_hour
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.tenant_id = ${tenantId}
      AND r.tenant_id = ${tenantId}
    `;

    // Add filters
    if (since) {
      query = sql`
        SELECT 
          b.*,
          r.name as room_name,
          r.capacity as room_capacity,
          r.category as room_category,
          r.price_per_hour
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        WHERE b.tenant_id = ${tenantId}
        AND r.tenant_id = ${tenantId}
        AND b.updated_at > ${since}
      `;
    }

    if (room_id) {
      query = sql`
        SELECT 
          b.*,
          r.name as room_name,
          r.capacity as room_capacity,
          r.category as room_category,
          r.price_per_hour
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        WHERE b.tenant_id = ${tenantId}
        AND r.tenant_id = ${tenantId}
        AND b.room_id = ${room_id}
        ${since ? sql`AND b.updated_at > ${since}` : sql``}
      `;
    }

    if (status) {
      query = sql`
        SELECT 
          b.*,
          r.name as room_name,
          r.capacity as room_capacity,
          r.category as room_category,
          r.price_per_hour
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        WHERE b.tenant_id = ${tenantId}
        AND r.tenant_id = ${tenantId}
        AND b.status = ${status}
        ${since ? sql`AND b.updated_at > ${since}` : sql``}
        ${room_id ? sql`AND b.room_id = ${room_id}` : sql``}
      `;
    }

    if (start_date) {
      query = sql`
        SELECT 
          b.*,
          r.name as room_name,
          r.capacity as room_capacity,
          r.category as room_category,
          r.price_per_hour
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        WHERE b.tenant_id = ${tenantId}
        AND r.tenant_id = ${tenantId}
        AND b.start_time >= ${start_date}
        ${since ? sql`AND b.updated_at > ${since}` : sql``}
        ${room_id ? sql`AND b.room_id = ${room_id}` : sql``}
        ${status ? sql`AND b.status = ${status}` : sql``}
      `;
    }

    if (end_date) {
      query = sql`
        SELECT 
          b.*,
          r.name as room_name,
          r.capacity as room_capacity,
          r.category as room_category,
          r.price_per_hour
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        WHERE b.tenant_id = ${tenantId}
        AND r.tenant_id = ${tenantId}
        AND b.end_time <= ${end_date}
        ${since ? sql`AND b.updated_at > ${since}` : sql``}
        ${room_id ? sql`AND b.room_id = ${room_id}` : sql``}
        ${status ? sql`AND b.status = ${status}` : sql``}
        ${start_date ? sql`AND b.start_time >= ${start_date}` : sql``}
      `;
    }

    // Add ordering and limit
    query = sql`
      SELECT 
        b.*,
        r.name as room_name,
        r.capacity as room_capacity,
        r.category as room_category,
        r.price_per_hour
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.tenant_id = ${tenantId}
      AND r.tenant_id = ${tenantId}
      ${since ? sql`AND b.updated_at > ${since}` : sql``}
      ${room_id ? sql`AND b.room_id = ${room_id}` : sql``}
      ${status ? sql`AND b.status = ${status}` : sql``}
      ${start_date ? sql`AND b.start_time >= ${start_date}` : sql``}
      ${end_date ? sql`AND b.end_time <= ${end_date}` : sql``}
      ORDER BY b.updated_at DESC
      LIMIT ${parseInt(limit)}
    `;

    const bookings = await query;

    // Get the latest update timestamp
    const latestUpdate = bookings.length > 0 ? bookings[0].updated_at : new Date().toISOString();

    res.status(200).json({
      success: true,
      data: {
        bookings,
        latest_update: latestUpdate,
        count: bookings.length,
        has_more: bookings.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Booking updates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking updates',
      error: error.message
    });
  }
}

// Export with tenant authentication middleware
export default withTenantAuth(updatesHandler);
