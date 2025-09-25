// Vercel API Route: /api/rooms
import { sql, initDatabase } from '../lib/neon-db-simplified.js';
import { setSecureCORSHeaders, handlePreflightRequest } from '../utils/cors.js';

export default async function handler(req, res) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return handlePreflightRequest(res);
  }

  // Set secure CORS headers
  setSecureCORSHeaders(res);

  try {
    // Initialize database if needed
    await initDatabase();
    
    // Get rooms from database
    const result = await sql`
      SELECT id, name, capacity, category, description, price_per_hour, is_active, amenities
      FROM rooms
      WHERE is_active = true
      ORDER BY id
    `;

    const rooms = result.map(row => ({
      id: row.id,
      name: row.name,
      capacity: row.capacity,
      category: row.category,
      description: row.description,
      pricePerHour: parseFloat(row.price_per_hour),
      hourlyRate: parseFloat(row.price_per_hour),
      isActive: row.is_active,
      is_active: row.is_active,
      status: row.is_active ? 'active' : 'inactive',
      isBookable: row.is_active,
      amenities: row.amenities || []
    }));

    res.status(200).json({
      success: true,
      data: rooms,
      count: rooms.length
    });
  } catch (error) {
    console.error('Database error:', error);
    
    // Fallback to static data
    const rooms = [
      { 
        id: 1, 
        name: 'Room A', 
        capacity: 4, 
        category: 'Standard', 
        isActive: true,
        is_active: true,
        status: 'active',
        isBookable: true,
        hourlyRate: 25,
        pricePerHour: 25
      },
      { 
        id: 2, 
        name: 'Room B', 
        capacity: 6, 
        category: 'Premium', 
        isActive: true,
        is_active: true,
        status: 'active',
        isBookable: true,
        hourlyRate: 35,
        pricePerHour: 35
      },
      { 
        id: 3, 
        name: 'Room C', 
        capacity: 8, 
        category: 'VIP', 
        isActive: true,
        is_active: true,
        status: 'active',
        isBookable: true,
        hourlyRate: 50,
        pricePerHour: 50
      }
    ];

    res.status(200).json({
      success: true,
      data: rooms
    });
  }
}
