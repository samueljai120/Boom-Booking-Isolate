import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../database/postgres.js';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createValidationErrorResponse,
  createNotFoundResponse,
  createConflictResponse
} from '../../src/utils/apiResponse.js';

const router = express.Router();

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const { room_id, status, start_date, end_date } = req.query;
    
    let query = `
      SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.category as room_category
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.tenant_id = $1
    `;
    const params = [req.tenant_id];
    let paramIndex = 2;

    if (room_id) {
      query += ` AND b.room_id = $${paramIndex}`;
      params.push(room_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND b.start_time >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND b.end_time <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ' ORDER BY b.start_time';

    const result = await pool.query(query, params);
    res.json(createSuccessResponse(result.rows));
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json(createErrorResponse('Failed to fetch bookings', 'FETCH_BOOKINGS_ERROR'));
  }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.category as room_category
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = $1 AND b.tenant_id = $2
    `;

    const result = await pool.query(query, [id, req.tenant_id]);

    if (result.rows.length === 0) {
      return res.status(404).json(createNotFoundResponse('Booking'));
    }

    res.json(createSuccessResponse(result.rows[0]));
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json(createErrorResponse('Failed to fetch booking', 'FETCH_BOOKING_ERROR'));
  }
});

// Create new booking
router.post('/', [
  body('room_id').notEmpty().withMessage('Room ID is required'),
  body('customer_name').notEmpty().withMessage('Customer name is required'),
  body('customer_email').isEmail().normalizeEmail().optional(),
  body('customer_phone').trim().optional(),
  body('start_time').isISO8601().withMessage('Start time must be a valid ISO8601 date'),
  body('end_time').isISO8601().withMessage('End time must be a valid ISO8601 date'),
  body('notes').trim().optional()
], async (req, res) => {
  console.log('📥 Received booking data:', req.body);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    return res.status(400).json(createValidationErrorResponse(errors.array()));
  }

  try {
    const { room_id, customer_name, customer_email, customer_phone, start_time, end_time, notes } = req.body;

    // Check for time conflicts
    const conflictQuery = `
      SELECT COUNT(*) as count FROM bookings 
      WHERE room_id = $1 AND tenant_id = $2 AND status != 'cancelled' 
      AND ((start_time < $3 AND end_time > $4) OR (start_time < $5 AND end_time > $6))
    `;

    const conflictResult = await pool.query(conflictQuery, [room_id, req.tenant_id, end_time, start_time, start_time, end_time]);

    if (parseInt(conflictResult.rows[0].count) > 0) {
      return res.status(400).json(createConflictResponse('Time slot conflicts with existing booking'));
    }

    // Get room price
    const roomResult = await pool.query('SELECT price_per_hour FROM rooms WHERE id = $1 AND tenant_id = $2', [room_id, req.tenant_id]);

    if (roomResult.rows.length === 0) {
      return res.status(404).json(createNotFoundResponse('Room'));
    }

    const room = roomResult.rows[0];

    // Calculate total price
    const start = new Date(start_time);
    const end = new Date(end_time);
    const durationHours = (end - start) / (1000 * 60 * 60);
    const totalPrice = durationHours * parseFloat(room.price_per_hour);

    // Create booking
    const insertResult = await pool.query(
      `INSERT INTO bookings (tenant_id, room_id, customer_name, customer_email, customer_phone, 
       start_time, end_time, notes, total_price) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.tenant_id, room_id, customer_name, customer_email, customer_phone, start_time, end_time, notes, totalPrice]
    );

    const booking = insertResult.rows[0];

    // Fetch created booking with room details
    const fetchQuery = `
      SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.category as room_category
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = $1 AND b.tenant_id = $2
    `;

    const fetchResult = await pool.query(fetchQuery, [booking.id, req.tenant_id]);

    res.status(201).json(createSuccessResponse(fetchResult.rows[0], 'Booking created successfully'));
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json(createErrorResponse('Failed to create booking', 'CREATE_BOOKING_ERROR'));
  }
});

// Update booking
router.put('/:id', [
  body('customer_name').isLength({ min: 1 }).trim().optional(),
  body('customer_email').isEmail().normalizeEmail().optional(),
  body('customer_phone').isLength({ min: 1 }).trim().optional(),
  body('start_time').isISO8601().optional(),
  body('end_time').isISO8601().optional(),
  body('status').isIn(['confirmed', 'cancelled', 'completed']).optional(),
  body('notes').trim().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query with tenant isolation
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(req.tenant_id, id); // Add tenant_id and id as last parameters

    const query = `UPDATE bookings SET ${updateFields.join(', ')} WHERE tenant_id = $${paramIndex} AND id = $${paramIndex + 1} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Fetch updated booking with room details
    const fetchQuery = `
      SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.category as room_category
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = $1 AND b.tenant_id = $2
    `;

    const fetchResult = await pool.query(fetchQuery, [id, req.tenant_id]);

    res.json({ success: true, data: fetchResult.rows[0] });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Cancel booking
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *',
      ['cancelled', id, req.tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Delete booking
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM bookings WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, req.tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Move booking (change room and/or time)
router.put('/:id/move', [
  body('new_room_id').isUUID().withMessage('Room ID must be a valid UUID'),
  body('new_start_time').isISO8601().withMessage('Start time must be a valid ISO8601 date'),
  body('new_end_time').isISO8601().withMessage('End time must be a valid ISO8601 date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { new_room_id, new_start_time, new_end_time } = req.body;

    // Check for conflicts in new time slot with tenant isolation
    const conflictQuery = `
      SELECT COUNT(*) as count FROM bookings 
      WHERE room_id = $1 AND tenant_id = $2 AND status != 'cancelled' AND id != $3
      AND ((start_time < $4 AND end_time > $5) OR (start_time < $6 AND end_time > $7))
    `;

    const conflictResult = await pool.query(conflictQuery, [
      new_room_id, req.tenant_id, id, new_end_time, new_start_time, new_start_time, new_end_time
    ]);

    if (parseInt(conflictResult.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Time slot conflicts with existing booking' });
    }

    // Update booking with tenant isolation
    const updateResult = await pool.query(
      'UPDATE bookings SET room_id = $1, start_time = $2, end_time = $3, updated_at = NOW() WHERE id = $4 AND tenant_id = $5 RETURNING *',
      [new_room_id, new_start_time, new_end_time, id, req.tenant_id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Fetch updated booking with room details
    const fetchQuery = `
      SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.category as room_category
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = $1 AND b.tenant_id = $2
    `;

    const fetchResult = await pool.query(fetchQuery, [id, req.tenant_id]);

    res.json({ success: true, data: fetchResult.rows[0] });
  } catch (error) {
    console.error('Error moving booking:', error);
    res.status(500).json({ error: 'Failed to move booking' });
  }
});

export default router;

