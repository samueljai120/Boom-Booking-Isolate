import express from 'express';
import { pool } from '../database/postgres.js';

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1 as health');
    
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Detailed health check
router.get('/detailed', (req, res) => {
  const health = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: {}
  };

  // Check database
  db.get('SELECT 1 as health', [], (err, row) => {
    health.services.database = {
      status: err ? 'error' : 'healthy',
      error: err ? err.message : null
    };

    if (err) {
      health.success = false;
      health.status = 'unhealthy';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    health.services.memory = {
      status: 'healthy',
      usage: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
      }
    };

    // Check CPU usage
    const cpuUsage = process.cpuUsage();
    health.services.cpu = {
      status: 'healthy',
      usage: {
        user: cpuUsage.user,
        system: cpuUsage.system
      }
    };

    const statusCode = health.success ? 200 : 503;
    res.status(statusCode).json(health);
  });
});

export default router;

