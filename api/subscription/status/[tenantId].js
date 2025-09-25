// Vercel API Route: /api/subscription/status/[tenantId]
import { sql, initDatabase } from '../../../Boom-Booking-Isolate/lib/neon-db.js';

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
    
    const { tenantId } = req.query;

    switch (req.method) {
      case 'GET':
        return await handleGetSubscriptionStatus(req, res, tenantId);
      
      default:
        res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Subscription Status API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// GET /api/subscription/status/[tenantId]
async function handleGetSubscriptionStatus(req, res, tenantId) {
  try {
    // Get current month's usage
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Get booking count for current month
    const monthlyBookings = await sql`
      SELECT COUNT(*) as count
      FROM bookings 
      WHERE tenant_id = ${tenantId || 1}
      AND start_time >= ${startOfMonth}
      AND status = 'confirmed'
    `;
    
    // Mock subscription data for demo
    const subscriptionData = {
      plan: {
        name: 'Professional',
        tier: 'professional',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        features: [
          'Unlimited Bookings',
          'Advanced Analytics',
          'Custom Branding',
          'Email Notifications',
          'API Access'
        ]
      },
      status: 'active',
      currentPeriod: {
        start: startOfMonth.toISOString(),
        end: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()
      },
      usage: {
        bookings: {
          used: parseInt(monthlyBookings[0]?.count || 0),
          limit: -1, // Unlimited for Professional plan
          percentage: 0
        },
        rooms: {
          used: 3, // Based on current rooms in database
          limit: 10,
          percentage: 30
        },
        users: {
          used: 1,
          limit: 5,
          percentage: 20
        },
        storage: {
          used: 150, // MB
          limit: 1000, // MB
          percentage: 15
        }
      },
      nextBilling: {
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString(),
        amount: 29.99
      },
      paymentMethod: {
        type: 'card',
        last4: '4242',
        brand: 'visa',
        expMonth: 12,
        expYear: 2025
      }
    };
    
    res.status(200).json({
      success: true,
      data: subscriptionData
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription status',
      error: error.message
    });
  }
}
