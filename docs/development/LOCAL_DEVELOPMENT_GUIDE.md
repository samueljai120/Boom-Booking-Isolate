# 🛠️ Local Development Guide

## 📋 Overview

This comprehensive guide covers local development setup, testing, and debugging for the Boom Karaoke Booking System.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Access to the Neon database (credentials already configured)

### 1. Install Dependencies
```bash
npm install
```

### 2. Test Database Connection
```bash
node test-neon-connection.js
```
This will verify that your Neon database connection is working correctly.

### 3. Start Development Server

**Option A: Full Stack Development (Recommended)**
```bash
npm run dev:full
```
This starts both the Vite frontend dev server and the local API server.

**Option B: Frontend Only**
```bash
npm run dev
```
This starts only the Vite frontend dev server (uses mock data).

**Option C: Production Build + Server**
```bash
npm run start
```
This builds the frontend and starts the local server.

## 📁 Available Scripts

- `npm run dev` - Start Vite frontend development server
- `npm run dev:full` - Start both frontend and backend servers
- `npm run server:local` - Start only the local API server
- `npm run build` - Build the frontend for production
- `npm run start` - Build and start the full application
- `npm run test:db` - Test database connection

## 🔧 Environment Configuration

The local environment is configured in `.env.local` with:

- **Database**: Neon PostgreSQL (production database)
- **API Base URL**: `http://localhost:3000/api`
- **Frontend URL**: `http://localhost:5173` (Vite dev server)
- **Full App URL**: `http://localhost:3000` (with built frontend)

## 🗄️ Database Information

- **Provider**: Neon PostgreSQL
- **Connection**: Pooled connection for better performance
- **SSL**: Required (configured automatically)
- **Tables**: users, rooms, business_hours, bookings

## 🔌 API Endpoints

When running locally, the following API endpoints are available:

- `GET /api/health` - Health check
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user
- `GET /api/rooms` - Get available rooms
- `GET /api/business-hours` - Get business hours

## 🔑 Demo Credentials

- **Email**: demo@example.com
- **Password**: demo123
- **Role**: admin

## 🚨 Troubleshooting

### Database Connection Issues
1. Check if `.env.local` exists and contains the correct DATABASE_URL
2. Verify your internet connection
3. Run `node test-neon-connection.js` to diagnose issues

### Port Conflicts
If port 3000 is already in use:
1. Change the PORT in `.env.local`
2. Update VITE_API_BASE_URL accordingly
3. Restart the development server

### CORS Issues
The local server is configured to allow CORS from:
- http://localhost:3000
- http://localhost:5173
- http://127.0.0.1:3000
- http://127.0.0.1:5173

## 🔄 Development Workflow

1. **Start the development environment**: `npm run dev:full`
2. **Open your browser**: Navigate to `http://localhost:5173`
3. **Make changes**: Edit files in the `src/` directory
4. **Test API endpoints**: Use `http://localhost:3000/api/*`
5. **View logs**: Check the terminal for server logs

## 🚀 Production Deployment

This setup is designed to work seamlessly with Vercel deployment. The same API routes and database configuration will work in production.

## 🔒 Security Notes

- The local environment uses a development JWT secret
- CORS is configured for local development only
- Database credentials are stored in `.env.local` (not committed to git)
- SSL is required for database connections

## 🧪 Testing

### Manual Testing Checklist
- [ ] Login with demo credentials
- [ ] Logout functionality
- [ ] Session persistence
- [ ] Room creation/updates
- [ ] Booking creation/cancellation
- [ ] Business hours management
- [ ] Data persistence

### API Testing
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}'
```

## 📊 Monitoring

### Health Checks
- **Basic**: `http://localhost:3000/health`
- **API**: `http://localhost:3000/api/health`

### Key Metrics to Monitor
- Response time (<200ms)
- Memory usage
- Database connection status
- Error rates

## 🔧 Debugging

### Enable Debug Mode
```javascript
// In browser console
localStorage.setItem('debug', 'true');
```

### Check Console Logs
Look for:
- Authentication errors
- Database connection errors
- API request failures
- WebSocket connection issues

### Network Analysis
In browser DevTools Network tab:
1. Check API request status codes
2. Verify request/response headers
3. Look for failed requests
4. Check WebSocket connections

## 📞 Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify your database connection with the test script
3. Ensure all dependencies are installed
4. Check that ports 3000 and 5173 are available

---

*This guide provides comprehensive instructions for local development and testing of the Boom Karaoke Booking System.*
