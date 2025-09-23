import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5001;

console.log('🚀 Starting Minimal Boom Booking Backend on Railway');
console.log('📍 Port:', PORT);

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use(express.json());

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Minimal Railway server is running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Minimal Railway API server is running'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Boom Booking Backend is running (Minimal Mode)',
    timestamp: new Date().toISOString()
  });
});

// Mock API endpoints
app.get('/api/business-hours', (req, res) => {
  res.json({
    success: true,
    data: [
      { day_of_week: 1, open_time: "09:00", close_time: "22:00", is_closed: false },
      { day_of_week: 2, open_time: "09:00", close_time: "22:00", is_closed: false },
      { day_of_week: 3, open_time: "09:00", close_time: "22:00", is_closed: false },
      { day_of_week: 4, open_time: "09:00", close_time: "22:00", is_closed: false },
      { day_of_week: 5, open_time: "09:00", close_time: "22:00", is_closed: false },
      { day_of_week: 6, open_time: "09:00", close_time: "23:00", is_closed: false },
      { day_of_week: 0, open_time: "10:00", close_time: "22:00", is_closed: false }
    ]
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User',
      role: 'admin'
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal Boom Booking Backend running on port ${PORT}`);
  console.log(`✅ Ready to accept requests`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
