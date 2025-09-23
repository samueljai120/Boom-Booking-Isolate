import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import businessHoursRoutes from './routes/businessHours.js';
import roomsRoutes from './routes/rooms.js';
import bookingsRoutes from './routes/bookings.js';
import settingsRoutes from './routes/settings.js';

// Import database initialization
import { pool, testConnection } from './database/postgres.js';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5001;

// Railway-specific logging
console.log('🚀 Starting Boom Booking Backend on Railway');
console.log('📍 Port:', PORT);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔗 CORS Origin:', process.env.CORS_ORIGIN || '*');

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/business-hours', businessHoursRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/settings', settingsRoutes);

// Basic business hours endpoint (fallback)
app.get('/api/business-hours', (req, res) => {
  res.json({
    success: true,
    data: {
      businessHours: [
        { day: 'monday', open: '09:00', close: '22:00', isOpen: true },
        { day: 'tuesday', open: '09:00', close: '22:00', isOpen: true },
        { day: 'wednesday', open: '09:00', close: '22:00', isOpen: true },
        { day: 'thursday', open: '09:00', close: '22:00', isOpen: true },
        { day: 'friday', open: '09:00', close: '23:00', isOpen: true },
        { day: 'saturday', open: '10:00', close: '23:00', isOpen: true },
        { day: 'sunday', open: '10:00', close: '21:00', isOpen: true }
      ]
    }
  });
});

// Basic rooms endpoint (fallback)
app.get('/api/rooms', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Room A', capacity: 4, category: 'Standard', isActive: true },
      { id: 2, name: 'Room B', capacity: 6, category: 'Premium', isActive: true },
      { id: 3, name: 'Room C', capacity: 8, category: 'VIP', isActive: true }
    ]
  });
});

// Basic bookings endpoint (fallback)
app.get('/api/bookings', (req, res) => {
  res.json({
    success: true,
    data: {
      bookings: []
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Boom Karaoke Booking API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    railway: {
      buildId: process.env.RAILWAY_BUILD_ID || 'Not set',
      deploymentId: process.env.RAILWAY_DEPLOYMENT_ID || 'Not set'
    },
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      login: '/api/auth/login',
      register: '/api/auth/register'
    }
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Backend API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'Connected' : 'Not connected'
  });
});

// Catch-all for non-API routes
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'This is a backend API. Frontend is deployed separately.',
    requestedPath: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Simple database initialization with better error handling
async function initDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection with timeout
    const connectionPromise = testConnection();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 10000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
    
    // Create basic tables if they don't exist
    console.log('📋 Creating database tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert demo user if not exists
    console.log('👤 Setting up demo user...');
    const demoUserExists = await pool.query('SELECT id FROM users WHERE email = $1', ['demo@example.com']);
    if (demoUserExists.rows.length === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('demo123', 10);
      
      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        ['demo@example.com', hashedPassword, 'Demo User', 'admin']
      );
      console.log('✅ Demo user created successfully');
    } else {
      console.log('✅ Demo user already exists');
    }
    
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('🔄 Continuing without database - using fallback mode');
    return false;
  }
}

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting Boom Karaoke Backend API...');
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Port: ${PORT}`);
    console.log(`📊 Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
    console.log(`🏗️ Railway Build: ${process.env.RAILWAY_BUILD_ID ? 'Yes' : 'No'}`);
    console.log(`🚀 Railway Deployment: ${process.env.RAILWAY_DEPLOYMENT_ID ? 'Yes' : 'No'}`);
    
    // Initialize database (non-blocking)
    const dbInitialized = await initDatabase();
    
    if (dbInitialized) {
      console.log('✅ Database connection established');
    } else {
      console.log('⚠️ Database connection failed - API will work with limited functionality');
    }
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Boom Karaoke Backend API running on port ${PORT}`);
      console.log(`🔌 API Base URL: http://0.0.0.0:${PORT}/api`);
      console.log(`🏥 Health Check: http://0.0.0.0:${PORT}/api/health`);
      console.log(`🌐 Socket.IO: http://0.0.0.0:${PORT}`);
      console.log(`✅ Ready to accept requests`);
      console.log(`🎯 This is a BACKEND API server, not a frontend!`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('🔍 Error details:', error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

startServer();
