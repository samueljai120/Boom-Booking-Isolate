// Vercel API Route: /api/ai/insights
import { sql, initDatabase } from '../../Boom-Booking-Isolate/lib/neon-db.js';

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
        return await handleGetInsights(req, res, tenantId);
      
      default:
        res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('AI Insights API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// GET /api/ai/insights
async function handleGetInsights(req, res, tenantId) {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }
    
    // Get booking trends
    const bookingTrends = await sql`
      SELECT 
        DATE(start_time) as date,
        COUNT(*) as bookings,
        SUM(total_price::numeric) as revenue
      FROM bookings 
      WHERE tenant_id = ${tenantId}
      AND start_time >= ${startDate}
      AND start_time <= ${endDate}
      AND status = 'confirmed'
      GROUP BY DATE(start_time)
      ORDER BY date ASC
    `;
    
    // Get room performance
    const roomPerformance = await sql`
      SELECT 
        r.name,
        r.category,
        COUNT(b.id) as bookings,
        SUM(b.total_price::numeric) as revenue,
        AVG(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600) as avg_duration
      FROM rooms r
      LEFT JOIN bookings b ON r.id = b.room_id 
        AND b.tenant_id = ${tenantId}
        AND b.start_time >= ${startDate}
        AND b.start_time <= ${endDate}
        AND b.status = 'confirmed'
      WHERE r.tenant_id = ${tenantId} AND r.is_active = true
      GROUP BY r.id, r.name, r.category
      ORDER BY revenue DESC
    `;
    
    // Get peak hours analysis
    const peakHours = await sql`
      SELECT 
        EXTRACT(HOUR FROM start_time) as hour,
        COUNT(*) as bookings
      FROM bookings 
      WHERE tenant_id = ${tenantId}
      AND start_time >= ${startDate}
      AND start_time <= ${endDate}
      AND status = 'confirmed'
      GROUP BY EXTRACT(HOUR FROM start_time)
      ORDER BY bookings DESC
      LIMIT 5
    `;
    
    // Calculate insights
    const totalBookings = bookingTrends.reduce((sum, day) => sum + parseInt(day.bookings), 0);
    const totalRevenue = bookingTrends.reduce((sum, day) => sum + parseFloat(day.revenue || 0), 0);
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    
    // Generate forecast (simple linear projection)
    const recentDays = bookingTrends.slice(-3);
    const avgDailyBookings = recentDays.length > 0 
      ? recentDays.reduce((sum, day) => sum + parseInt(day.bookings), 0) / recentDays.length 
      : 0;
    
    const insights = {
      summary: {
        totalBookings,
        totalRevenue,
        avgBookingValue,
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      },
      forecast: {
        nextWeekBookings: Math.round(avgDailyBookings * 7),
        nextWeekRevenue: Math.round(avgDailyBookings * 7 * avgBookingValue),
        confidence: recentDays.length >= 3 ? 85 : 60
      },
      trends: {
        bookingTrend: bookingTrends.map(day => ({
          date: day.date,
          bookings: parseInt(day.bookings),
          revenue: parseFloat(day.revenue || 0)
        })),
        roomPerformance: roomPerformance.map(room => ({
          roomName: room.name,
          category: room.category,
          bookings: parseInt(room.bookings),
          revenue: parseFloat(room.revenue || 0),
          avgDuration: parseFloat(room.avg_duration || 0)
        })),
        peakHours: peakHours.map(hour => ({
          hour: parseInt(hour.hour),
          bookings: parseInt(hour.bookings)
        }))
      },
      recommendations: [
        {
          type: 'optimization',
          title: 'Peak Hour Optimization',
          description: `Consider offering promotions during off-peak hours (${peakHours.length > 0 ? 'except ' + peakHours.slice(0, 2).map(h => h.hour + ':00').join(' and ') : 'all hours'}) to maximize utilization.`,
          impact: 'medium',
          effort: 'low'
        },
        {
          type: 'revenue',
          title: 'Room Category Analysis',
          description: `Your ${roomPerformance[0]?.category || 'premium'} rooms are performing best. Consider expanding this category.`,
          impact: 'high',
          effort: 'medium'
        },
        {
          type: 'efficiency',
          title: 'Booking Duration Optimization',
          description: `Average booking duration is ${roomPerformance[0]?.avg_duration ? Math.round(roomPerformance[0].avg_duration * 10) / 10 : 2} hours. Consider offering shorter time slots for better turnover.`,
          impact: 'medium',
          effort: 'low'
        }
      ]
    };
    
    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI insights',
      error: error.message
    });
  }
}
