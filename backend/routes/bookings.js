import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../database/init.js';

const router = express.Router();

// Get all bookings
router.get('/', (req, res) => {
  const { room_id, status, start_date, end_date } = req.query;
  
  let query = `
    SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.category as room_category
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
  `;
  const params = [];
  const conditions = [];

  if (room_id) {
    conditions.push('b.room_id = ?');
    params.push(room_id);
  }

  if (status) {
    conditions.push('b.status = ?');
    params.push(status);
  }

  if (start_date) {
    conditions.push('b.start_time >= ?');
    params.push(start_date);
  }

  if (end_date) {
    conditions.push('b.end_time <= ?');
    params.push(end_date);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY b.start_time';

  db.all(query, params, (err, rows) => {
    if (err) {
      // console.error('Error fetching bookings:', err);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
    res.json({ success: true, data: rows });
  });
});

// Get booking by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.category as room_category
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    WHERE b.id = ?
  `;

  db.get(query, [id], (err, row) => {
    if (err) {
      // console.error('Error fetching booking:', err);
      return res.status(500).json({ error: 'Failed to fetch booking' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ success: true, data: row });
  });
});

// Create new booking
router.post('/', [
  body('room_id').isInt({ min: 1 }),
  body('customer_name').isLength({ min: 1 }).trim(),
  body('customer_email').isEmail().normalizeEmail().optional(),
  body('customer_phone').isLength({ min: 1 }).trim().optional(),
  body('start_time').isISO8601(),
  body('end_time').isISO8601(),
  body('notes').trim().optional()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { room_id, customer_name, customer_email, customer_phone, start_time, end_time, notes } = req.body;

  // Check for time conflicts
  const conflictQuery = `
    SELECT COUNT(*) as count FROM bookings 
    WHERE room_id = ? AND status != 'cancelled' 
    AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))
  `;

  db.get(conflictQuery, [room_id, end_time, start_time, start_time, end_time], (err, row) => {
    if (err) {
      // console.error('Error checking conflicts:', err);
      return res.status(500).json({ error: 'Failed to check booking conflicts' });
    }

    if (row.count > 0) {
      return res.status(400).json({ error: 'Time slot conflicts with existing booking' });
    }

    // Get room price
    db.get('SELECT price_per_hour FROM rooms WHERE id = ?', [room_id], (err, room) => {
      if (err) {
        // console.error('Error fetching room price:', err);
        return res.status(500).json({ error: 'Failed to fetch room information' });
      }

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Calculate total price
      const start = new Date(start_time);
      const end = new Date(end_time);
      const durationHours = (end - start) / (1000 * 60 * 60);
      const totalPrice = durationHours * room.price_per_hour;

      // Create booking
      db.run(
        `INSERT INTO bookings (room_id, customer_name, customer_email, customer_phone, 
         start_time, end_time, notes, total_price) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [room_id, customer_name, customer_email, customer_phone, start_time, end_time, notes, totalPrice],
        function(err) {
          if (err) {
            // console.error('Error creating booking:', err);
            return res.status(500).json({ error: 'Failed to create booking' });
          }

          // Fetch created booking with room details
          const fetchQuery = `
            SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.category as room_category
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE b.id = ?
          `;

          db.get(fetchQuery, [this.lastID], (err, booking) => {
            if (err) {
              // console.error('Error fetching created booking:', err);
              return res.status(500).json({ error: 'Failed to fetch created booking' });
            }

            res.status(201).json({ success: true, data: booking });
          });
        }
      );
    });
  });
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
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const updates = req.body;

  // Build dynamic update query
  const updateFields = [];
  const values = [];

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const query = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`;

  db.run(query, values, function(err) {
    if (err) {
      // console.error('Error updating booking:', err);
      return res.status(500).json({ error: 'Failed to update booking' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Fetch updated booking
    const fetchQuery = `
      SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.category as room_category
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ?
    `;

    db.get(fetchQuery, [id], (err, row) => {
      if (err) {
        // console.error('Error fetching updated booking:', err);
        return res.status(500).json({ error: 'Failed to fetch updated booking' });
      }

      res.json({ success: true, data: row });
    });
  });
});

// Cancel booking
router.put('/:id/cancel', (req, res) => {
  const { id } = req.params;

  db.run(
    'UPDATE bookings SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        // console.error('Error cancelling booking:', err);
        return res.status(500).json({ error: 'Failed to cancel booking' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json({ success: true, message: 'Booking cancelled successfully' });
    }
  );
});

// Delete booking
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM bookings WHERE id = ?', [id], function(err) {
    if (err) {
      // console.error('Error deleting booking:', err);
      return res.status(500).json({ error: 'Failed to delete booking' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ success: true, message: 'Booking deleted successfully' });
  });
});

// Move booking (change room and/or time)
router.put('/:id/move', [
  body('new_room_id').isInt({ min: 1 }),
  body('new_start_time').isISO8601(),
  body('new_end_time').isISO8601()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { new_room_id, new_start_time, new_end_time } = req.body;

  // Check for conflicts in new time slot
  const conflictQuery = `
    SELECT COUNT(*) as count FROM bookings 
    WHERE room_id = ? AND status != 'cancelled' AND id != ?
    AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))
  `;

  db.get(conflictQuery, [new_room_id, id, new_end_time, new_start_time, new_start_time, new_end_time], (err, row) => {
    if (err) {
      // console.error('Error checking conflicts:', err);
      return res.status(500).json({ error: 'Failed to check booking conflicts' });
    }

    if (row.count > 0) {
      return res.status(400).json({ error: 'Time slot conflicts with existing booking' });
    }

    // Update booking
    db.run(
      'UPDATE bookings SET room_id = ?, start_time = ?, end_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [new_room_id, new_start_time, new_end_time, id],
      function(err) {
        if (err) {
          // console.error('Error moving booking:', err);
          return res.status(500).json({ error: 'Failed to move booking' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Booking not found' });
        }

        // Fetch updated booking
        const fetchQuery = `
          SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.category as room_category
          FROM bookings b
          JOIN rooms r ON b.room_id = r.id
          WHERE b.id = ?
        `;

        db.get(fetchQuery, [id], (err, row) => {
          if (err) {
            // console.error('Error fetching moved booking:', err);
            return res.status(500).json({ error: 'Failed to fetch moved booking' });
          }

          res.json({ success: true, data: row });
        });
      }
    );
  });
});

export default router;

