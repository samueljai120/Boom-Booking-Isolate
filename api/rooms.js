// Vercel API Route: /api/rooms
import { sql, initDatabase } from '../Boom-Booking-Isolate/lib/neon-db.js';
import { withTenantAuth } from './middleware/tenant-auth.js';

// Main handler with tenant authentication
async function roomsHandler(req, res) {
  try {
    // Initialize database
    await initDatabase();
    
    // tenantId is now available from req.tenantId (set by middleware)
    const tenantId = req.tenantId;

    switch (req.method) {
      case 'GET':
        return await handleGetRooms(req, res, tenantId);
      
      case 'POST':
        return await handleCreateRoom(req, res, tenantId);
      
      case 'PUT':
        return await handleUpdateRoom(req, res, tenantId);
      
      case 'DELETE':
        return await handleDeleteRoom(req, res, tenantId);
      
      default:
        res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Rooms API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process rooms request',
      error: error.message
    });
  }
}

// Export with tenant authentication middleware
export default withTenantAuth(roomsHandler);

// GET /api/rooms
async function handleGetRooms(req, res, tenantId) {
  try {
    const { active_only, category } = req.query;
    
    let query = sql`
      SELECT * FROM rooms 
      WHERE tenant_id = ${tenantId}
    `;
    
    if (active_only === 'true') {
      query = sql`
        SELECT * FROM rooms 
        WHERE tenant_id = ${tenantId} AND is_active = true
      `;
    }
    
    if (category) {
      query = sql`
        SELECT * FROM rooms 
        WHERE tenant_id = ${tenantId} AND category = ${category}
        ${active_only === 'true' ? sql`AND is_active = true` : sql``}
      `;
    }
    
    const rooms = await query;
    
    res.status(200).json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms',
      error: error.message
    });
  }
}

// POST /api/rooms
async function handleCreateRoom(req, res, tenantId) {
  try {
    const { name, capacity, category, description, price_per_hour, amenities } = req.body;
    
    // Validate input
    if (!name || !capacity || !category || !price_per_hour) {
      return res.status(400).json({
        success: false,
        message: 'Name, capacity, category, and price_per_hour are required'
      });
    }
    
    if (capacity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be at least 1'
      });
    }
    
    if (price_per_hour < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price per hour cannot be negative'
      });
    }
    
    // Check if room name already exists for this tenant
    const existingRoom = await sql`
      SELECT id FROM rooms 
      WHERE tenant_id = ${tenantId} AND name = ${name}
    `;
    
    if (existingRoom.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Room name already exists'
      });
    }
    
    // Create room
    const newRoom = await sql`
      INSERT INTO rooms (
        tenant_id, name, capacity, category, description, 
        price_per_hour, amenities, is_active
      ) VALUES (
        ${tenantId}, ${name}, ${capacity}, ${category}, ${description || null}, 
        ${price_per_hour}, ${JSON.stringify(amenities || [])}, true
      ) RETURNING *
    `;
    
    res.status(201).json({
      success: true,
      data: newRoom[0]
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create room',
      error: error.message
    });
  }
}

// PUT /api/rooms/:id
async function handleUpdateRoom(req, res, tenantId) {
  try {
    const { id } = req.query;
    const updates = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }
    
    // Check if room exists
    const existingRoom = await sql`
      SELECT * FROM rooms 
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `;
    
    if (existingRoom.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Check name uniqueness if name is being updated
    if (updates.name && updates.name !== existingRoom[0].name) {
      const nameConflict = await sql`
        SELECT id FROM rooms 
        WHERE tenant_id = ${tenantId} AND name = ${updates.name} AND id != ${id}
      `;
      
      if (nameConflict.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Room name already exists'
        });
      }
    }
    
    // Update room
    const updatedRoom = await sql`
      UPDATE rooms 
      SET 
        name = COALESCE(${updates.name || null}, name),
        capacity = COALESCE(${updates.capacity || null}, capacity),
        category = COALESCE(${updates.category || null}, category),
        description = COALESCE(${updates.description || null}, description),
        price_per_hour = COALESCE(${updates.price_per_hour || null}, price_per_hour),
        amenities = COALESCE(${updates.amenities ? JSON.stringify(updates.amenities) : null}, amenities),
        is_active = COALESCE(${updates.is_active !== undefined ? updates.is_active : null}, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND tenant_id = ${tenantId}
      RETURNING *
    `;
    
    res.status(200).json({
      success: true,
      data: updatedRoom[0]
    });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update room',
      error: error.message
    });
  }
}

// DELETE /api/rooms/:id
async function handleDeleteRoom(req, res, tenantId) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }
    
    // Check if room has active bookings
    const activeBookings = await sql`
      SELECT COUNT(*) as count FROM bookings 
      WHERE room_id = ${id} AND tenant_id = ${tenantId} 
      AND status IN ('confirmed', 'pending')
      AND end_time > NOW()
    `;
    
    if (parseInt(activeBookings[0].count) > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete room with active bookings'
      });
    }
    
    // Soft delete (deactivate) the room
    const deletedRoom = await sql`
      UPDATE rooms 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND tenant_id = ${tenantId}
      RETURNING *
    `;
    
    if (deletedRoom.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: deletedRoom[0],
      message: 'Room deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room',
      error: error.message
    });
  }
}
