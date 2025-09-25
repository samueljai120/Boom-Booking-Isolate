/**
 * Monitoring and Analytics System
 * 
 * Comprehensive monitoring, analytics, and business intelligence
 * for production deployment with real-time metrics and reporting.
 */

import { pool } from '../database/postgres.js';
import { logger } from './errorHandling.js';

// Analytics data collection
export class AnalyticsCollector {
  constructor() {
    this.metrics = new Map();
    this.events = [];
    this.maxEvents = 10000; // Keep last 10k events in memory
  }

  // Track business metrics
  trackBooking(bookingData) {
    const event = {
      type: 'booking',
      timestamp: new Date(),
      data: {
        tenantId: bookingData.tenant_id,
        roomId: bookingData.room_id,
        duration: this.calculateDuration(bookingData.start_time, bookingData.end_time),
        price: bookingData.total_price,
        status: bookingData.status,
        customerType: this.classifyCustomer(bookingData.customer_email)
      }
    };

    this.recordEvent(event);
    this.updateMetrics('bookings', event.data);
  }

  // Track room utilization
  trackRoomUtilization(roomId, tenantId, utilization) {
    const event = {
      type: 'room_utilization',
      timestamp: new Date(),
      data: {
        roomId,
        tenantId,
        utilization,
        hour: new Date().getHours()
      }
    };

    this.recordEvent(event);
    this.updateMetrics('room_utilization', event.data);
  }

  // Track user activity
  trackUserActivity(userId, action, details = {}) {
    const event = {
      type: 'user_activity',
      timestamp: new Date(),
      data: {
        userId,
        action,
        details,
        hour: new Date().getHours(),
        dayOfWeek: new Date().getDay()
      }
    };

    this.recordEvent(event);
    this.updateMetrics('user_activity', event.data);
  }

  // Track system performance
  trackPerformance(operation, duration, details = {}) {
    const event = {
      type: 'performance',
      timestamp: new Date(),
      data: {
        operation,
        duration,
        details
      }
    };

    this.recordEvent(event);
    this.updateMetrics('performance', event.data);
  }

  // Record event
  recordEvent(event) {
    this.events.push(event);
    
    // Maintain event list size
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Store in database
    this.storeEventInDatabase(event);
  }

  // Update metrics
  updateMetrics(type, data) {
    const key = `${type}_${new Date().toISOString().split('T')[0]}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        type,
        date: new Date().toISOString().split('T')[0],
        count: 0,
        totals: {},
        averages: {}
      });
    }

    const metric = this.metrics.get(key);
    metric.count++;

    // Update totals and averages based on type
    switch (type) {
      case 'bookings':
        metric.totals.revenue = (metric.totals.revenue || 0) + (data.price || 0);
        metric.totals.duration = (metric.totals.duration || 0) + (data.duration || 0);
        metric.averages.revenue = metric.totals.revenue / metric.count;
        metric.averages.duration = metric.totals.duration / metric.count;
        break;
      case 'room_utilization':
        metric.totals.utilization = (metric.totals.utilization || 0) + data.utilization;
        metric.averages.utilization = metric.totals.utilization / metric.count;
        break;
    }
  }

  // Store event in database
  async storeEventInDatabase(event) {
    try {
      await pool.query(
        `INSERT INTO analytics_events (event_type, event_data, created_at)
         VALUES ($1, $2, NOW())`,
        [event.type, JSON.stringify(event.data)]
      );
    } catch (error) {
      logger.error('Failed to store analytics event', { error: error.message });
    }
  }

  // Helper methods
  calculateDuration(startTime, endTime) {
    return (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60); // hours
  }

  classifyCustomer(email) {
    if (!email) return 'guest';
    return email.includes('@') ? 'registered' : 'guest';
  }

  // Get metrics
  getMetrics(type, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const key = `${type}_${targetDate}`;
    return this.metrics.get(key) || null;
  }

  // Get recent events
  getRecentEvents(type = null, limit = 100) {
    let events = this.events;
    
    if (type) {
      events = events.filter(event => event.type === type);
    }
    
    return events.slice(-limit).reverse();
  }
}

// Create analytics collector instance
export const analytics = new AnalyticsCollector();

// Business intelligence queries
export const businessIntelligence = {
  // Get revenue analytics
  getRevenueAnalytics: async (tenantId, period = '30d') => {
    try {
      const dateCondition = getDateCondition(period);
      
      const query = `
        SELECT 
          DATE(b.created_at) as date,
          COUNT(*) as booking_count,
          SUM(b.total_price) as total_revenue,
          AVG(b.total_price) as avg_booking_value,
          SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600) as total_hours
        FROM bookings b
        WHERE b.tenant_id = $1 
          AND b.created_at >= $2
          AND b.status != 'cancelled'
        GROUP BY DATE(b.created_at)
        ORDER BY date DESC
      `;

      const startDate = getStartDate(period);
      const result = await pool.query(query, [tenantId, startDate]);
      
      return {
        success: true,
        data: result.rows,
        period,
        totalRevenue: result.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0),
        totalBookings: result.rows.reduce((sum, row) => sum + parseInt(row.booking_count || 0), 0)
      };
    } catch (error) {
      logger.error('Error getting revenue analytics', { error: error.message });
      throw error;
    }
  },

  // Get room utilization analytics
  getRoomUtilizationAnalytics: async (tenantId, period = '7d') => {
    try {
      const startDate = getStartDate(period);
      
      const query = `
        SELECT 
          r.id as room_id,
          r.name as room_name,
          r.capacity,
          COUNT(b.id) as booking_count,
          SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600) as booked_hours,
          (SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600) / 
          (EXTRACT(EPOCH FROM (NOW() - $2::timestamp))/3600 * 24) * 100 as utilization_percentage
        FROM rooms r
        LEFT JOIN bookings b ON r.id = b.room_id 
          AND b.tenant_id = $1 
          AND b.start_time >= $2
          AND b.status != 'cancelled'
        WHERE r.tenant_id = $1 AND r.is_active = true
        GROUP BY r.id, r.name, r.capacity
        ORDER BY utilization_percentage DESC
      `;

      const result = await pool.query(query, [tenantId, startDate]);
      
      return {
        success: true,
        data: result.rows,
        period,
        avgUtilization: result.rows.reduce((sum, row) => sum + parseFloat(row.utilization_percentage || 0), 0) / result.rows.length
      };
    } catch (error) {
      logger.error('Error getting room utilization analytics', { error: error.message });
      throw error;
    }
  },

  // Get customer analytics
  getCustomerAnalytics: async (tenantId, period = '30d') => {
    try {
      const startDate = getStartDate(period);
      
      const query = `
        SELECT 
          customer_email,
          COUNT(*) as booking_count,
          SUM(total_price) as total_spent,
          AVG(total_price) as avg_booking_value,
          MIN(created_at) as first_booking,
          MAX(created_at) as last_booking
        FROM bookings
        WHERE tenant_id = $1 
          AND created_at >= $2
          AND customer_email IS NOT NULL
          AND status != 'cancelled'
        GROUP BY customer_email
        HAVING COUNT(*) > 0
        ORDER BY total_spent DESC
        LIMIT 50
      `;

      const result = await pool.query(query, [tenantId, startDate]);
      
      return {
        success: true,
        data: result.rows,
        period,
        totalCustomers: result.rows.length,
        repeatCustomers: result.rows.filter(row => row.booking_count > 1).length
      };
    } catch (error) {
      logger.error('Error getting customer analytics', { error: error.message });
      throw error;
    }
  },

  // Get peak hours analytics
  getPeakHoursAnalytics: async (tenantId, period = '30d') => {
    try {
      const startDate = getStartDate(period);
      
      const query = `
        SELECT 
          EXTRACT(HOUR FROM start_time) as hour,
          COUNT(*) as booking_count,
          AVG(total_price) as avg_price,
          COUNT(DISTINCT room_id) as rooms_used
        FROM bookings
        WHERE tenant_id = $1 
          AND created_at >= $2
          AND status != 'cancelled'
        GROUP BY EXTRACT(HOUR FROM start_time)
        ORDER BY hour
      `;

      const result = await pool.query(query, [tenantId, startDate]);
      
      return {
        success: true,
        data: result.rows,
        period,
        peakHour: result.rows.reduce((max, row) => 
          row.booking_count > max.count ? row : max, 
          { hour: 0, booking_count: 0 }
        )
      };
    } catch (error) {
      logger.error('Error getting peak hours analytics', { error: error.message });
      throw error;
    }
  },

  // Get cancellation analytics
  getCancellationAnalytics: async (tenantId, period = '30d') => {
    try {
      const startDate = getStartDate(period);
      
      const query = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          ROUND(
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) * 100.0 / COUNT(*), 2
          ) as cancellation_rate
        FROM bookings
        WHERE tenant_id = $1 
          AND created_at >= $2
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      const result = await pool.query(query, [tenantId, startDate]);
      
      const avgCancellationRate = result.rows.reduce((sum, row) => sum + parseFloat(row.cancellation_rate || 0), 0) / result.rows.length;
      
      return {
        success: true,
        data: result.rows,
        period,
        avgCancellationRate: Math.round(avgCancellationRate * 100) / 100
      };
    } catch (error) {
      logger.error('Error getting cancellation analytics', { error: error.message });
      throw error;
    }
  }
};

// Helper functions
const getDateCondition = (period) => {
  switch (period) {
    case '1d': return "created_at >= NOW() - INTERVAL '1 day'";
    case '7d': return "created_at >= NOW() - INTERVAL '7 days'";
    case '30d': return "created_at >= NOW() - INTERVAL '30 days'";
    case '90d': return "created_at >= NOW() - INTERVAL '90 days'";
    case '1y': return "created_at >= NOW() - INTERVAL '1 year'";
    default: return "created_at >= NOW() - INTERVAL '30 days'";
  }
};

const getStartDate = (period) => {
  const now = new Date();
  switch (period) {
    case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
};

// Real-time monitoring
export const realTimeMonitoring = {
  // Get system health metrics
  getSystemHealth: async () => {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Database connection status
      const dbStart = Date.now();
      await pool.query('SELECT 1');
      const dbLatency = Date.now() - dbStart;

      return {
        timestamp: new Date().toISOString(),
        system: {
          uptime: process.uptime(),
          memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
          }
        },
        database: {
          status: 'healthy',
          latency: dbLatency,
          pool: {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount
          }
        }
      };
    } catch (error) {
      logger.error('Error getting system health', { error: error.message });
      return {
        timestamp: new Date().toISOString(),
        system: {
          uptime: process.uptime(),
          memory: { used: 0, total: 0, percentage: 0 },
          cpu: { user: 0, system: 0 }
        },
        database: {
          status: 'unhealthy',
          latency: 0,
          error: error.message
        }
      };
    }
  },

  // Get active sessions count
  getActiveSessions: async () => {
    try {
      // This would typically come from a session store
      // For now, we'll return a placeholder
      return {
        activeUsers: 0,
        activeTenants: 1,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting active sessions', { error: error.message });
      throw error;
    }
  }
};

// Analytics middleware
export const analyticsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Track request
  analytics.trackUserActivity(
    req.user?.id || 'anonymous',
    `${req.method} ${req.url}`,
    {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      tenantId: req.tenant_id
    }
  );

  // Track performance
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    analytics.trackPerformance(
      `${req.method} ${req.url}`,
      duration,
      {
        statusCode: res.statusCode,
        tenantId: req.tenant_id,
        userId: req.user?.id
      }
    );

    return originalEnd.apply(this, args);
  };

  next();
};

// Export analytics routes
export const analyticsRoutes = {
  // Get analytics dashboard data
  getDashboard: async (req, res) => {
    try {
      const tenantId = req.tenant_id;
      const period = req.query.period || '30d';

      const [revenue, utilization, customers, peakHours] = await Promise.all([
        businessIntelligence.getRevenueAnalytics(tenantId, period),
        businessIntelligence.getRoomUtilizationAnalytics(tenantId, '7d'),
        businessIntelligence.getCustomerAnalytics(tenantId, period),
        businessIntelligence.getPeakHoursAnalytics(tenantId, period)
      ]);

      res.json({
        success: true,
        data: {
          revenue,
          utilization,
          customers,
          peakHours,
          period
        }
      });
    } catch (error) {
      logger.error('Error getting analytics dashboard', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to get analytics data'
      });
    }
  },

  // Get system monitoring data
  getSystemMonitoring: async (req, res) => {
    try {
      const [health, sessions] = await Promise.all([
        realTimeMonitoring.getSystemHealth(),
        realTimeMonitoring.getActiveSessions()
      ]);

      res.json({
        success: true,
        data: {
          health,
          sessions
        }
      });
    } catch (error) {
      logger.error('Error getting system monitoring', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to get monitoring data'
      });
    }
  }
};

export default {
  AnalyticsCollector,
  analytics,
  businessIntelligence,
  realTimeMonitoring,
  analyticsMiddleware,
  analyticsRoutes
};
