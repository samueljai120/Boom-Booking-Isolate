#!/usr/bin/env node
// Business Intelligence MCP Server
// Handles analytics, revenue tracking, and business insights

const { neon } = require('@neondatabase/serverless');

class BusinessIntelligenceMCP {
  constructor() {
    this.db = neon(process.env.DATABASE_URL);
  }

  // Revenue analytics
  async getRevenueAnalytics(period = 'month') {
    const queries = {
      daily: `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as bookings,
          SUM(price) as revenue
        FROM bookings 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
      weekly: `
        SELECT 
          DATE_TRUNC('week', created_at) as week,
          COUNT(*) as bookings,
          SUM(price) as revenue
        FROM bookings 
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week DESC
      `,
      monthly: `
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as bookings,
          SUM(price) as revenue
        FROM bookings 
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `
    };

    try {
      const result = await this.db`${queries[period]}`;
      return {
        period,
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        period,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // User analytics
  async getUserAnalytics() {
    const queries = [
      'SELECT COUNT(*) as total_users FROM users',
      'SELECT COUNT(*) as active_users FROM users WHERE last_login >= CURRENT_DATE - INTERVAL \'30 days\'',
      'SELECT COUNT(*) as new_users FROM users WHERE created_at >= CURRENT_DATE - INTERVAL \'30 days\''
    ];

    const results = {};
    
    for (const query of queries) {
      try {
        const result = await this.db`${query}`;
        const key = query.split(' as ')[1] || 'unknown';
        results[key] = result[0];
      } catch (error) {
        results[query] = { error: error.message };
      }
    }

    return {
      data: results,
      timestamp: new Date().toISOString()
    };
  }

  // Room utilization analytics
  async getRoomUtilization() {
    try {
      const result = await this.db`
        SELECT 
          r.name as room_name,
          COUNT(b.id) as total_bookings,
          SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600) as total_hours,
          AVG(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600) as avg_duration
        FROM rooms r
        LEFT JOIN bookings b ON r.id = b.room_id
        WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY r.id, r.name
        ORDER BY total_bookings DESC
      `;

      return {
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Peak hours analysis
  async getPeakHoursAnalysis() {
    try {
      const result = await this.db`
        SELECT 
          EXTRACT(HOUR FROM start_time) as hour,
          COUNT(*) as booking_count,
          AVG(price) as avg_price
        FROM bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM start_time)
        ORDER BY booking_count DESC
      `;

      return {
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Customer retention analysis
  async getCustomerRetention() {
    try {
      const result = await this.db`
        WITH customer_bookings AS (
          SELECT 
            customer_email,
            COUNT(*) as total_bookings,
            MIN(created_at) as first_booking,
            MAX(created_at) as last_booking,
            SUM(price) as total_spent
          FROM bookings
          GROUP BY customer_email
        )
        SELECT 
          COUNT(*) as total_customers,
          COUNT(CASE WHEN total_bookings > 1 THEN 1 END) as returning_customers,
          ROUND(
            COUNT(CASE WHEN total_bookings > 1 THEN 1 END)::decimal / COUNT(*) * 100, 2
          ) as retention_rate,
          AVG(total_bookings) as avg_bookings_per_customer,
          AVG(total_spent) as avg_spent_per_customer
        FROM customer_bookings
      `;

      return {
        data: result[0],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Booking trends analysis
  async getBookingTrends() {
    try {
      const result = await this.db`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as daily_bookings,
          SUM(price) as daily_revenue,
          AVG(price) as avg_booking_value
        FROM bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date DESC
      `;

      return {
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Room performance analysis
  async getRoomPerformance() {
    try {
      const result = await this.db`
        SELECT 
          r.name as room_name,
          r.capacity,
          COUNT(b.id) as total_bookings,
          SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600) as total_hours_booked,
          SUM(b.price) as total_revenue,
          AVG(b.price) as avg_booking_value,
          ROUND(
            SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600) / 
            (30 * 24) * 100, 2
          ) as utilization_percentage
        FROM rooms r
        LEFT JOIN bookings b ON r.id = b.room_id
        WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days' OR b.created_at IS NULL
        GROUP BY r.id, r.name, r.capacity
        ORDER BY total_revenue DESC
      `;

      return {
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Generate business report
  async generateBusinessReport() {
    const [revenue, users, utilization, peakHours, retention, trends, performance] = await Promise.all([
      this.getRevenueAnalytics('month'),
      this.getUserAnalytics(),
      this.getRoomUtilization(),
      this.getPeakHoursAnalysis(),
      this.getCustomerRetention(),
      this.getBookingTrends(),
      this.getRoomPerformance()
    ]);

    return {
      report_date: new Date().toISOString(),
      revenue_analytics: revenue,
      user_analytics: users,
      room_utilization: utilization,
      peak_hours: peakHours,
      customer_retention: retention,
      booking_trends: trends,
      room_performance: performance,
      summary: {
        total_revenue: revenue.data?.[0]?.revenue || 0,
        total_users: users.data?.total_users || 0,
        active_users: users.data?.active_users || 0,
        new_users: users.data?.new_users || 0,
        retention_rate: retention.data?.retention_rate || 0,
        avg_booking_value: trends.data?.[0]?.avg_booking_value || 0
      }
    };
  }

  // Get KPIs dashboard
  async getKPIs() {
    try {
      const result = await this.db`
        SELECT 
          'total_bookings' as metric,
          COUNT(*) as value
        FROM bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        UNION ALL
        SELECT 
          'total_revenue' as metric,
          SUM(price) as value
        FROM bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        UNION ALL
        SELECT 
          'avg_booking_value' as metric,
          AVG(price) as value
        FROM bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        UNION ALL
        SELECT 
          'total_customers' as metric,
          COUNT(DISTINCT customer_email) as value
        FROM bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `;

      const kpis = {};
      result.forEach(row => {
        kpis[row.metric] = row.value;
      });

      return {
        data: kpis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// MCP Server Implementation
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const biMCP = new BusinessIntelligenceMCP();

const server = new Server(
  {
    name: 'business-intelligence',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_revenue_analytics',
        description: 'Get revenue analytics for specified period',
        inputSchema: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['daily', 'weekly', 'monthly'], default: 'month' }
          }
        },
      },
      {
        name: 'get_user_analytics',
        description: 'Get user analytics and statistics',
        inputSchema: {
          type: 'object',
          properties: {}
        },
      },
      {
        name: 'get_room_utilization',
        description: 'Get room utilization analytics',
        inputSchema: {
          type: 'object',
          properties: {}
        },
      },
      {
        name: 'get_peak_hours',
        description: 'Get peak hours analysis',
        inputSchema: {
          type: 'object',
          properties: {}
        },
      },
      {
        name: 'get_customer_retention',
        description: 'Get customer retention analysis',
        inputSchema: {
          type: 'object',
          properties: {}
        },
      },
      {
        name: 'get_booking_trends',
        description: 'Get booking trends analysis',
        inputSchema: {
          type: 'object',
          properties: {}
        },
      },
      {
        name: 'get_room_performance',
        description: 'Get room performance analysis',
        inputSchema: {
          type: 'object',
          properties: {}
        },
      },
      {
        name: 'generate_business_report',
        description: 'Generate comprehensive business report',
        inputSchema: {
          type: 'object',
          properties: {}
        },
      },
      {
        name: 'get_kpis',
        description: 'Get key performance indicators',
        inputSchema: {
          type: 'object',
          properties: {}
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;
    
    switch (name) {
      case 'get_revenue_analytics':
        result = await biMCP.getRevenueAnalytics(args.period);
        break;
      case 'get_user_analytics':
        result = await biMCP.getUserAnalytics();
        break;
      case 'get_room_utilization':
        result = await biMCP.getRoomUtilization();
        break;
      case 'get_peak_hours':
        result = await biMCP.getPeakHoursAnalysis();
        break;
      case 'get_customer_retention':
        result = await biMCP.getCustomerRetention();
        break;
      case 'get_booking_trends':
        result = await biMCP.getBookingTrends();
        break;
      case 'get_room_performance':
        result = await biMCP.getRoomPerformance();
        break;
      case 'generate_business_report':
        result = await biMCP.generateBusinessReport();
        break;
      case 'get_kpis':
        result = await biMCP.getKPIs();
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Business Intelligence MCP server running on stdio');
}

main().catch(console.error);
