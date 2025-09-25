// Vercel API Route: /api/business-hours
import { sql, initDatabase } from '../Boom-Booking-Isolate/lib/neon-db.js';
import { withTenantAuth } from './middleware/tenant-auth.js';

// Main handler with tenant authentication
async function businessHoursHandler(req, res) {
  try {
    // Initialize database
    await initDatabase();
    
    // tenantId is now available from req.tenantId (set by middleware)
    const tenantId = req.tenantId;

    switch (req.method) {
      case 'GET':
        return await handleGetBusinessHours(req, res, tenantId);
      
      case 'PUT':
        return await handleUpdateBusinessHours(req, res, tenantId);
      
      default:
        res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Business hours API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process business hours request',
      error: error.message
    });
  }
}

// Export with tenant authentication middleware
export default withTenantAuth(businessHoursHandler);

// GET /api/business-hours
async function handleGetBusinessHours(req, res, tenantId) {
  try {
    const businessHours = await sql`
      SELECT * FROM business_hours 
      WHERE tenant_id = ${tenantId}
      ORDER BY day_of_week
    `;
    
    res.status(200).json({
      success: true,
      data: businessHours
    });
  } catch (error) {
    console.error('Error fetching business hours:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business hours',
      error: error.message
    });
  }
}

// PUT /api/business-hours
async function handleUpdateBusinessHours(req, res, tenantId) {
  try {
    const { hours } = req.body;
    
    if (!hours || !Array.isArray(hours)) {
      return res.status(400).json({
        success: false,
        message: 'Hours array is required'
      });
    }
    
    // Validate hours data
    for (const hour of hours) {
      if (typeof hour.day_of_week !== 'number' || hour.day_of_week < 0 || hour.day_of_week > 6) {
        return res.status(400).json({
          success: false,
          message: 'Invalid day_of_week. Must be 0-6 (0 = Sunday)'
        });
      }
      
      if (hour.is_closed === false && (!hour.open_time || !hour.close_time)) {
        return res.status(400).json({
          success: false,
          message: 'open_time and close_time are required when is_closed is false'
        });
      }
    }
    
    // Clear existing business hours for this tenant
    await sql`
      DELETE FROM business_hours WHERE tenant_id = ${tenantId}
    `;
    
    // Insert new business hours
    for (const hour of hours) {
      await sql`
        INSERT INTO business_hours (
          tenant_id, day_of_week, open_time, close_time, is_closed
        ) VALUES (
          ${tenantId}, ${hour.day_of_week}, ${hour.is_closed ? null : hour.open_time}, 
          ${hour.is_closed ? null : hour.close_time}, ${hour.is_closed}
        )
      `;
    }
    
    // Fetch updated business hours
    const updatedHours = await sql`
      SELECT * FROM business_hours 
      WHERE tenant_id = ${tenantId}
      ORDER BY day_of_week
    `;
    
    res.status(200).json({
      success: true,
      data: updatedHours,
      message: 'Business hours updated successfully'
    });
  } catch (error) {
    console.error('Error updating business hours:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update business hours',
      error: error.message
    });
  }
}
