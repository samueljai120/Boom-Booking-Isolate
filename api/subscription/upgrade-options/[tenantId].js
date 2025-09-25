// Vercel API Route: /api/subscription/upgrade-options/[tenantId]
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
        return await handleGetUpgradeOptions(req, res, tenantId);
      
      default:
        res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Subscription Upgrade Options API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

// GET /api/subscription/upgrade-options/[tenantId]
async function handleGetUpgradeOptions(req, res, tenantId) {
  try {
    // Mock upgrade options for demo
    const upgradeOptions = {
      currentPlan: {
        name: 'Professional',
        tier: 'professional',
        price: 29.99
      },
      availablePlans: [
        {
          name: 'Starter',
          tier: 'starter',
          price: 9.99,
          billingCycle: 'monthly',
          features: [
            'Up to 50 Bookings/Month',
            'Basic Analytics',
            'Email Support',
            '3 Rooms'
          ],
          limits: {
            bookings: 50,
            rooms: 3,
            users: 2,
            storage: 500 // MB
          },
          popular: false
        },
        {
          name: 'Professional',
          tier: 'professional',
          price: 29.99,
          billingCycle: 'monthly',
          features: [
            'Unlimited Bookings',
            'Advanced Analytics',
            'Custom Branding',
            'Email Notifications',
            'API Access',
            '10 Rooms',
            'Priority Support'
          ],
          limits: {
            bookings: -1, // Unlimited
            rooms: 10,
            users: 5,
            storage: 1000 // MB
          },
          popular: true,
          current: true
        },
        {
          name: 'Enterprise',
          tier: 'enterprise',
          price: 99.99,
          billingCycle: 'monthly',
          features: [
            'Everything in Professional',
            'Unlimited Rooms',
            'Advanced Integrations',
            'Custom Reporting',
            'Dedicated Support',
            'White-label Options',
            'SLA Guarantee'
          ],
          limits: {
            bookings: -1, // Unlimited
            rooms: -1, // Unlimited
            users: -1, // Unlimited
            storage: 5000 // MB
          },
          popular: false
        }
      ],
      addons: [
        {
          name: 'Additional Rooms',
          description: 'Add 5 more rooms to your plan',
          price: 9.99,
          billingCycle: 'monthly',
          category: 'rooms'
        },
        {
          name: 'Advanced Analytics',
          description: 'Get detailed insights and custom reports',
          price: 19.99,
          billingCycle: 'monthly',
          category: 'analytics'
        },
        {
          name: 'Priority Support',
          description: '24/7 phone and chat support',
          price: 29.99,
          billingCycle: 'monthly',
          category: 'support'
        }
      ],
      savings: {
        annualDiscount: 20, // 20% off for annual billing
        enterpriseDiscount: 15 // 15% off for enterprise
      }
    };
    
    res.status(200).json({
      success: true,
      data: upgradeOptions
    });
  } catch (error) {
    console.error('Error fetching upgrade options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upgrade options',
      error: error.message
    });
  }
}
