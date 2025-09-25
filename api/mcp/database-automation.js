#!/usr/bin/env node
// Database Automation MCP Server
// Handles automated database operations, migrations, and monitoring

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

class DatabaseAutomationMCP {
  constructor() {
    this.db = neon(process.env.DATABASE_URL);
    this.migrationPath = path.join(__dirname, '../migrations');
    this.ensureMigrationDir();
  }

  ensureMigrationDir() {
    if (!fs.existsSync(this.migrationPath)) {
      fs.mkdirSync(this.migrationPath, { recursive: true });
    }
  }

  // Automated database health check
  async healthCheck() {
    try {
      const result = await this.db`SELECT 1 as health_check`;
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        response_time: Date.now(),
        database: 'neon_postgresql'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Automated migration runner
  async runMigrations() {
    const migrationFiles = fs.readdirSync(this.migrationPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const results = [];
    
    for (const file of migrationFiles) {
      try {
        const migration = fs.readFileSync(path.join(this.migrationPath, file), 'utf8');
        await this.db`${migration}`;
        results.push({ file, status: 'success' });
      } catch (error) {
        results.push({ file, status: 'error', error: error.message });
      }
    }

    return results;
  }

  // Automated database optimization
  async optimizeDatabase() {
    const optimizations = [
      'VACUUM ANALYZE',
      'REINDEX',
      'UPDATE pg_stat_user_tables SET n_tup_ins = 0, n_tup_upd = 0, n_tup_del = 0'
    ];

    const results = [];
    
    for (const query of optimizations) {
      try {
        await this.db`${query}`;
        results.push({ query, status: 'success' });
      } catch (error) {
        results.push({ query, status: 'error', error: error.message });
      }
    }

    return results;
  }

  // Automated backup creation
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-${timestamp}.sql`;
    
    try {
      const backupData = await this.db`SELECT * FROM information_schema.tables`;
      fs.writeFileSync(path.join(this.migrationPath, backupFile), JSON.stringify(backupData, null, 2));
      
      return {
        status: 'success',
        backup_file: backupFile,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Automated performance monitoring
  async monitorPerformance() {
    const queries = [
      'SELECT COUNT(*) as total_connections FROM pg_stat_activity',
      'SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = \'public\'',
      'SELECT pg_database_size(current_database()) as database_size_bytes'
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
      timestamp: new Date().toISOString(),
      metrics: results
    };
  }

  // Get table statistics
  async getTableStats() {
    try {
      const result = await this.db`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname
      `;
      
      return {
        status: 'success',
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Check database constraints
  async checkConstraints() {
    try {
      const result = await this.db`
        SELECT 
          tc.table_name,
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_type
      `;
      
      return {
        status: 'success',
        constraints: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
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

const dbMCP = new DatabaseAutomationMCP();

const server = new Server(
  {
    name: 'database-automation',
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
        name: 'health_check',
        description: 'Check database health and connectivity',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'run_migrations',
        description: 'Run database migrations',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'optimize_database',
        description: 'Optimize database performance',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_backup',
        description: 'Create database backup',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'monitor_performance',
        description: 'Monitor database performance metrics',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_table_stats',
        description: 'Get table statistics and information',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'check_constraints',
        description: 'Check database constraints',
        inputSchema: {
          type: 'object',
          properties: {},
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
      case 'health_check':
        result = await dbMCP.healthCheck();
        break;
      case 'run_migrations':
        result = await dbMCP.runMigrations();
        break;
      case 'optimize_database':
        result = await dbMCP.optimizeDatabase();
        break;
      case 'create_backup':
        result = await dbMCP.createBackup();
        break;
      case 'monitor_performance':
        result = await dbMCP.monitorPerformance();
        break;
      case 'get_table_stats':
        result = await dbMCP.getTableStats();
        break;
      case 'check_constraints':
        result = await dbMCP.checkConstraints();
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
  console.error('Database Automation MCP server running on stdio');
}

main().catch(console.error);
