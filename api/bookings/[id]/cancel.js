// Vercel API Route: /api/bookings/[id]/cancel
import { sql, initDatabase } from '../../../Boom-Booking-Isolate/lib/neon-db.js';
import { withTenantAuth } from '../../middleware/tenant-auth.js';

// Main handler with tenant authentication
async function cancelHandler(req, res) {
  try {
    // Initialize database
    await initDatabase();
    
    // Only allow PUT method
    if (req.method !== 'PUT') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
    
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }
    
    // tenantId is now available from req.tenantId (set by middleware)
    const tenantId = req.tenantId;
    
    // Check if booking exists
    const existingBooking = await sql`
      SELECT * FROM bookings 
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `;
    
    if (existingBooking.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check if booking is already cancelled
    if (existingBooking[0].status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }
    
    // Cancel booking
    const cancelledBooking = await sql`
      UPDATE bookings 
      SET 
        status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND tenant_id = ${tenantId}
      RETURNING *
    `;
    
    // Fetch cancelled booking with room details
    const bookingWithDetails = await sql`
      SELECT 
        b.*,
        r.name as room_name,
        r.capacity as room_capacity,
        r.category as room_category,
        r.price_per_hour
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ${id}
    `;
    
    res.status(200).json({
      success: true,
      data: bookingWithDetails[0],
      message: 'Booking cancelled successfully'
    });
    
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
}

// Export with tenant authentication middleware
export default withTenantAuth(cancelHandler);
