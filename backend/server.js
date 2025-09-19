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
import roomsRoutes from './routes/rooms.js';
import bookingsRoutes from './routes/bookings.js';
import businessHoursRoutes from './routes/businessHours.js';
import settingsRoutes from './routes/settings.js';
import healthRoutes from './routes/health.js';

// Import database initialization
import { initDatabase } from './database/init.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/business-hours', businessHoursRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/health', healthRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  // console.log (removed for clean version)('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    // console.log (removed for clean version)('Client disconnected:', socket.id);
  });
  
  // Join room for booking updates
  socket.on('join-room', (roomId) => {
    socket.join(`room-${roomId}`);
  });
  
  // Leave room
  socket.on('leave-room', (roomId) => {
    socket.leave(`room-${roomId}`);
  });
});

// Make io available to routes
app.set('io', io);

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    // console.log (removed for clean version)('✅ Database initialized successfully');
    
    server.listen(PORT, () => {
      // console.log (removed for clean version)(`🚀 Server running on port ${PORT}`);
      // console.log (removed for clean version)(`📱 Frontend: http://localhost:${PORT}`);
      // console.log (removed for clean version)(`🔌 API: http://localhost:${PORT}/api`);
      // console.log (removed for clean version)(`🌐 Socket.IO: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

