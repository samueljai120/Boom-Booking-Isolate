import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🎤 Starting Boom Karaoke Booking System');
console.log('=======================================');
console.log(`🚀 Server starting on port ${PORT}`);
console.log(`📍 Server will be available at: http://0.0.0.0:${PORT}`);
console.log('🔑 Demo credentials: demo@example.com / demo123');
console.log('');

// Health check endpoint (must come before the catch-all route)
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ 
    status: 'OK', 
    message: 'Boom Karaoke Booking System is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing by serving index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Application ready!');
  console.log(`🌐 Server listening on http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check available at http://0.0.0.0:${PORT}/health`);
});
