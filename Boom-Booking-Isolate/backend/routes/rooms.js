import express from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../database/postgres.js';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createValidationErrorResponse,
  createNotFoundResponse
} from '../../src/utils/apiResponse.js';

const router = express.Router();

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const { category, is_active } = req.query;
    
    let query = 'SELECT * FROM rooms WHERE tenant_id = $1';
    const params = [req.tenant_id || 1]; // Use tenant_id from authentication or default to 1
    let paramIndex = 2;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    
    // Normalize room data for frontend compatibility
    const rooms = result.rows.map(row => ({
      ...row,
      // Ensure tenant_id is included for validation
      tenant_id: row.tenant_id,
      // Ensure both ID formats are available
      _id: row.id,
      // Map pricing fields
      pricePerHour: parseFloat(row.price_per_hour || 0),
      hourlyRate: parseFloat(row.price_per_hour || 0),
      // Map status fields
      isActive: row.is_active,
      status: row.is_active ? 'active' : 'inactive',
      isBookable: row.is_active
    }));
    
    res.json(createSuccessResponse(rooms));
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json(createErrorResponse('Failed to fetch rooms', 'FETCH_ROOMS_ERROR'));
  }
});

// Get room by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM rooms WHERE id = $1 AND tenant_id = $2',
      [id, req.tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createNotFoundResponse('Room'));
    }

    const room = result.rows[0];
    
    // Normalize room data for frontend compatibility
    const normalizedRoom = {
      ...room,
      tenant_id: room.tenant_id,
      _id: room.id,
      pricePerHour: parseFloat(room.price_per_hour || 0),
      hourlyRate: parseFloat(room.price_per_hour || 0),
      isActive: room.is_active,
      status: room.is_active ? 'active' : 'inactive',
      isBookable: room.is_active
    };

    res.json(createSuccessResponse(normalizedRoom));
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json(createErrorResponse('Failed to fetch room', 'FETCH_ROOM_ERROR'));
  }
});

// Create new room
router.post('/', [
  body('name').isLength({ min: 1 }).trim(),
  body('capacity').isInt({ min: 1 }),
  body('category').isLength({ min: 1 }).trim(),
  body('price_per_hour').isFloat({ min: 0 }).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, capacity, category, description, price_per_hour } = req.body;

    const result = await pool.query(
      `INSERT INTO rooms (tenant_id, name, capacity, category, description, price_per_hour) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [req.tenant_id, name, capacity, category, description || null, price_per_hour || 0]
    );

    const room = result.rows[0];
    
    // Normalize room data for frontend compatibility
    const normalizedRoom = {
      ...room,
      _id: room.id,
      pricePerHour: parseFloat(room.price_per_hour || 0),
      hourlyRate: parseFloat(room.price_per_hour || 0),
      isActive: room.is_active,
      status: room.is_active ? 'active' : 'inactive',
      isBookable: room.is_active
    };

    res.status(201).json({
      success: true,
      data: normalizedRoom
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Update room
router.put('/:id', [
  body('name').isLength({ min: 1 }).trim().optional(),
  body('capacity').isInt({ min: 1 }).optional(),
  body('category').isLength({ min: 1 }).trim().optional(),
  body('price_per_hour').isFloat({ min: 0 }).optional()
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

    const query = `UPDATE rooms SET ${updateFields.join(', ')} WHERE tenant_id = $${paramIndex} AND id = $${paramIndex + 1} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = result.rows[0];
    
    // Normalize room data for frontend compatibility
    const normalizedRoom = {
      ...room,
      _id: room.id,
      pricePerHour: parseFloat(room.price_per_hour || 0),
      hourlyRate: parseFloat(room.price_per_hour || 0),
      isActive: room.is_active,
      status: room.is_active ? 'active' : 'inactive',
      isBookable: room.is_active
    };

    res.json({ success: true, data: normalizedRoom });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete room
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if room has active bookings with tenant isolation
    const bookingCheck = await pool.query(
      'SELECT COUNT(*) as count FROM bookings WHERE room_id = $1 AND tenant_id = $2 AND status != $3',
      [id, req.tenant_id, 'cancelled']
    );

    if (parseInt(bookingCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete room with active bookings' 
      });
    }

    // Soft delete (set is_active to false) with tenant isolation
    const result = await pool.query(
      'UPDATE rooms SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *',
      [id, req.tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Get room categories
router.get('/categories/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM rooms WHERE is_active = true AND tenant_id = $1 ORDER BY category',
      [req.tenant_id]
    );

    const categories = result.rows.map(row => row.category);
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;

