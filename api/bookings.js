// Vercel API Route: /api/bookings
import { sql, initDatabase } from '../Boom-Booking-Isolate/lib/neon-db.js';
import { withTenantAuth } from './middleware/tenant-auth.js';

// Validate booking data
function validateBookingData(data) {
  const errors = [];
  
  console.log('🔍 Backend API - Validating data:', data);
  console.log('🔍 Backend API - Field types:', {
    room_id: typeof data.room_id,
    customer_name: typeof data.customer_name,
    start_time: typeof data.start_time,
    end_time: typeof data.end_time
  });
  
  if (!data.room_id || !Number.isInteger(parseInt(data.room_id))) {
    errors.push('Room ID is required and must be a valid integer');
  }
  
  if (!data.customer_name || data.customer_name.trim().length < 1) {
    errors.push('Customer name is required');
  }
  
  if (!data.start_time) {
    errors.push('Start time is required');
  }
  
  if (!data.end_time) {
    errors.push('End time is required');
  }
  
  if (data.start_time && data.end_time) {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    
    if (start >= end) {
      errors.push('End time must be after start time');
    }
    
    if (start < new Date()) {
      errors.push('Start time cannot be in the past');
    }
  }
  
  console.log('🔍 Backend API - Validation errors:', errors);
  return errors;
}

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
        (start_time >= ${startTime} AND end_time <= ${endTime})
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
async function bookingsHandler(req, res) {
  try {
    // Initialize database
    await initDatabase();
    
    // tenantId is now available from req.tenantId (set by middleware)
    const tenantId = req.tenantId;

    switch (req.method) {
      case 'GET':
        return await handleGetBookings(req, res, tenantId);
      
      case 'POST':
        return await handleCreateBooking(req, res, tenantId);
      
      case 'PUT':
        return await handleUpdateBooking(req, res, tenantId);
      
      case 'DELETE':
        return await handleDeleteBooking(req, res, tenantId);
      
      default:
        res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Bookings API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// Export with tenant authentication middleware
export default withTenantAuth(bookingsHandler);

// GET /api/bookings
async function handleGetBookings(req, res, tenantId) {
  try {
    const { room_id, status, start_date, end_date } = req.query;
    
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
    
    const params = [];
    
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
      `;
    }
    
    const bookings = await query;
    
    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
}

// POST /api/bookings
async function handleCreateBooking(req, res, tenantId) {
  try {
    console.log('🔍 Backend API - Received request body:', req.body);
    console.log('🔍 Backend API - Required fields check:', {
      room_id: req.body.room_id,
      customer_name: req.body.customer_name,
      start_time: req.body.start_time,
      end_time: req.body.end_time
    });
    
    const { room_id, customer_name, customer_email, customer_phone, start_time, end_time, notes } = req.body;
    
    // Validate input
    const validationErrors = validateBookingData(req.body);
    if (validationErrors.length > 0) {
      console.log('🔍 Backend API - Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Check for conflicts
    const hasConflict = await checkBookingConflict(room_id, start_time, end_time);
    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'Time slot conflicts with existing booking'
      });
    }
    
    // Calculate price
    const totalPrice = await calculateBookingPrice(room_id, start_time, end_time);
    
    // Create booking
    const booking = await sql`
      INSERT INTO bookings (
        tenant_id, room_id, customer_name, customer_email, customer_phone,
        start_time, end_time, status, notes, total_price
      ) VALUES (
        ${tenantId}, ${room_id}, ${customer_name}, ${customer_email || null}, 
        ${customer_phone || null}, ${start_time}, ${end_time}, 'confirmed', 
        ${notes || null}, ${totalPrice}
      ) RETURNING *
    `;
    
    // Fetch created booking with room details
    const createdBooking = await sql`
      SELECT 
        b.*,
        r.name as room_name,
        r.capacity as room_capacity,
        r.category as room_category,
        r.price_per_hour
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ${booking[0].id}
    `;
    
    res.status(201).json({
      success: true,
      data: createdBooking[0]
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
}

// PUT /api/bookings/:id
async function handleUpdateBooking(req, res, tenantId) {
  try {
    const { id } = req.query;
    const updates = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }
    
    // Validate updates if time is being changed
    if (updates.start_time || updates.end_time) {
      const booking = await sql`
        SELECT * FROM bookings WHERE id = ${id} AND tenant_id = ${tenantId}
      `;
      
      if (booking.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      const startTime = updates.start_time || booking[0].start_time;
      const endTime = updates.end_time || booking[0].end_time;
      const roomId = updates.room_id || booking[0].room_id;
      
      // Check for conflicts
      const hasConflict = await checkBookingConflict(roomId, startTime, endTime, id);
      if (hasConflict) {
        return res.status(409).json({
          success: false,
          message: 'Time slot conflicts with existing booking'
        });
      }
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(updates).forEach((key, index) => {
      if (key !== 'id' && updates[key] !== undefined) {
        updateFields.push(`${key} = $${index + 1}`);
        updateValues.push(updates[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid updates provided'
      });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    // For now, we'll use a simpler approach with known fields
    const updatedBooking = await sql`
      UPDATE bookings 
      SET 
        customer_name = COALESCE(${updates.customer_name || null}, customer_name),
        customer_email = COALESCE(${updates.customer_email || null}, customer_email),
        customer_phone = COALESCE(${updates.customer_phone || null}, customer_phone),
        start_time = COALESCE(${updates.start_time || null}, start_time),
        end_time = COALESCE(${updates.end_time || null}, end_time),
        status = COALESCE(${updates.status || null}, status),
        notes = COALESCE(${updates.notes || null}, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND tenant_id = ${tenantId}
      RETURNING *
    `;
    
    if (updatedBooking.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedBooking[0]
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message
    });
  }
}

// DELETE /api/bookings/:id
async function handleDeleteBooking(req, res, tenantId) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }
    
    const deletedBooking = await sql`
      DELETE FROM bookings 
      WHERE id = ${id} AND tenant_id = ${tenantId}
      RETURNING *
    `;
    
    if (deletedBooking.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully',
      data: deletedBooking[0]
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete booking',
      error: error.message
    });
  }
}
