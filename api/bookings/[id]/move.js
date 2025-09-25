// Vercel API Route: /api/bookings/[id]/move
import { sql, initDatabase } from '../../../Boom-Booking-Isolate/lib/neon-db.js';
import { withTenantAuth } from '../../middleware/tenant-auth.js';

// Check for booking conflicts
async function checkBookingConflict(roomId, startTime, endTime, excludeId = null) {
  try {
    let query = sql`
      SELECT COUNT(*) as count 
      FROM bookings 
      WHERE room_id = ${roomId} 
      AND status IN ('confirmed', 'pending')
      AND (
        (start_time <= ${startTime} AND end_time > ${startTime}) OR
        (start_time < ${endTime} AND end_time >= ${endTime}) OR
        (start_time >= ${startTime} AND end_time <= ${startTime})
      )
    `;
    
    if (excludeId) {
      query = sql`
        SELECT COUNT(*) as count 
        FROM bookings 
        WHERE room_id = ${roomId} 
        AND id != ${excludeId}
        AND status IN ('confirmed', 'pending')
        AND (
          (start_time <= ${startTime} AND end_time > ${startTime}) OR
          (start_time < ${endTime} AND end_time >= ${endTime}) OR
          (start_time >= ${startTime} AND end_time <= ${endTime})
        )
      `;
    }
    
    const result = await query;
    return parseInt(result[0].count) > 0;
  } catch (error) {
    console.error('Error checking booking conflict:', error);
    return true; // Assume conflict if error
  }
}

// Calculate booking price
async function calculateBookingPrice(roomId, startTime, endTime) {
  try {
    const room = await sql`
      SELECT price_per_hour 
      FROM rooms 
      WHERE id = ${roomId}
    `;
    
    if (room.length === 0) {
      return 0;
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end - start) / (1000 * 60 * 60);
    
    return room[0].price_per_hour * durationHours;
  } catch (error) {
    console.error('Error calculating booking price:', error);
    return 0;
  }
}

// Main handler with tenant authentication
async function moveHandler(req, res) {
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
    const { new_room_id, new_start_time, new_end_time } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }
    
    if (!new_room_id || !new_start_time || !new_end_time) {
      return res.status(400).json({
        success: false,
        message: 'new_room_id, new_start_time, and new_end_time are required'
      });
    }
    
    // Validate time
    const startTime = new Date(new_start_time);
    const endTime = new Date(new_end_time);
    
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }
    
    if (startTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Start time cannot be in the past'
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
    
    // Check for conflicts in new time slot
    const hasConflict = await checkBookingConflict(new_room_id, new_start_time, new_end_time, id);
    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'Time slot conflicts with existing booking'
      });
    }
    
    // Calculate new price
    const newTotalPrice = await calculateBookingPrice(new_room_id, new_start_time, new_end_time);
    
    // Update booking
    const updatedBooking = await sql`
      UPDATE bookings 
      SET 
        room_id = ${new_room_id},
        start_time = ${new_start_time},
        end_time = ${new_end_time},
        total_price = ${newTotalPrice},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND tenant_id = ${tenantId}
      RETURNING *
    `;
    
    // Fetch updated booking with room details
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
      message: 'Booking moved successfully'
    });
    
  } catch (error) {
    console.error('Move booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move booking',
      error: error.message
    });
  }
}

// Export with tenant authentication middleware
export default withTenantAuth(moveHandler);
