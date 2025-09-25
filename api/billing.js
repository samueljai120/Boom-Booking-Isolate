// Vercel API Route: /api/billing
import { sql, initDatabase } from '../Boom-Booking-Isolate/lib/neon-db.js';

// Set CORS headers helper
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Initialize database
    await initDatabase();
    
    const tenantId = 1; // Default tenant ID for demo

    switch (req.method) {
      case 'GET':
        return await handleGetBilling(req, res, tenantId);
      
      default:
        res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Billing API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// GET /api/billing
async function handleGetBilling(req, res, tenantId) {
  try {
    // Get current month's billing data
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Get total bookings for current month
    const monthlyBookings = await sql`
      SELECT COUNT(*) as count, SUM(total_price::numeric) as total_revenue
      FROM bookings 
      WHERE tenant_id = ${tenantId}
      AND start_time >= ${startOfMonth}
      AND start_time <= ${endOfMonth}
      AND status = 'confirmed'
    `;
    
    // Get total bookings all time
    const totalBookings = await sql`
      SELECT COUNT(*) as count, SUM(total_price::numeric) as total_revenue
      FROM bookings 
      WHERE tenant_id = ${tenantId}
      AND status = 'confirmed'
    `;
    
    // Get room utilization
    const roomUtilization = await sql`
      SELECT 
        r.name,
        r.price_per_hour,
        COUNT(b.id) as booking_count,
        SUM(b.total_price::numeric) as revenue
      FROM rooms r
      LEFT JOIN bookings b ON r.id = b.room_id 
        AND b.tenant_id = ${tenantId}
        AND b.start_time >= ${startOfMonth}
        AND b.start_time <= ${endOfMonth}
        AND b.status = 'confirmed'
      WHERE r.tenant_id = ${tenantId} AND r.is_active = true
      GROUP BY r.id, r.name, r.price_per_hour
      ORDER BY revenue DESC
    `;
    
    const billingData = {
      currentMonth: {
        bookings: parseInt(monthlyBookings[0]?.count || 0),
        revenue: parseFloat(monthlyBookings[0]?.total_revenue || 0),
        period: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString()
        }
      },
      total: {
        bookings: parseInt(totalBookings[0]?.count || 0),
        revenue: parseFloat(totalBookings[0]?.total_revenue || 0)
      },
      roomUtilization: roomUtilization.map(room => ({
        roomName: room.name,
        pricePerHour: parseFloat(room.price_per_hour),
        bookingCount: parseInt(room.booking_count),
        revenue: parseFloat(room.revenue || 0)
      })),
      usage: {
        bookings: {
          current: parseInt(monthlyBookings[0]?.count || 0),
          limit: -1, // Unlimited for demo
          percentage: 0
        },
        revenue: {
          current: parseFloat(monthlyBookings[0]?.total_revenue || 0),
          limit: 10000, // $10k monthly limit for demo
          percentage: Math.min((parseFloat(monthlyBookings[0]?.total_revenue || 0) / 10000) * 100, 100)
        }
      }
    };
    
    res.status(200).json({
      success: true,
      data: billingData
    });
  } catch (error) {
    console.error('Error fetching billing data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing data',
      error: error.message
    });
  }
}
