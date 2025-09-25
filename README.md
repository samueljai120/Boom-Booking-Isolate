# Boom Karaoke Booking System

A modern, serverless booking system for karaoke venues built with Vercel Functions and Neon PostgreSQL.

## 🚀 Features

- **Serverless Architecture**: Built with Vercel Functions for scalability
- **PostgreSQL Database**: Powered by Neon for reliable data storage
- **JWT Authentication**: Secure user authentication and authorization
- **Real-time Updates**: Live booking updates with polling mechanism
- **Responsive UI**: Modern, mobile-friendly interface
- **Multi-tenant Ready**: Designed for multiple venues

## 🏗️ Architecture

- **Frontend**: HTML, CSS (Tailwind), Vanilla JavaScript
- **Backend**: Vercel Serverless Functions
- **Database**: Neon PostgreSQL
- **Authentication**: JWT tokens
- **Deployment**: Vercel Platform

## 📋 Prerequisites

- Node.js 18+ 
- Vercel CLI
- Neon PostgreSQL database
- Git

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd boom-karaoke-booking-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

1. Create a Neon PostgreSQL database
2. Copy the connection string
3. Run the database schema:

```bash
# Connect to your Neon database and run:
psql "your-neon-connection-string" -f Boom-Booking-Isolate/database-schema.sql
```

### 4. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:port/database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Environment
NODE_ENV=development
```

### 5. Local Development

```bash
# Install Vercel CLI if you haven't already
npm install -g vercel

# Start local development server
vercel dev
```

The application will be available at `http://localhost:3000`

### 6. Deploy to Vercel

```bash
# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Rooms
- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking
- `PUT /api/bookings/:id/move` - Move booking to different time/room
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/updates` - Get real-time booking updates

### Business Hours
- `GET /api/business-hours` - Get business hours
- `PUT /api/business-hours` - Update business hours

### Health
- `GET /api/health` - Health check

## 🔐 Default Credentials

For testing purposes, use these demo credentials:

- **Email**: `demo@example.com`
- **Password**: `demo123`

## 📊 Database Schema

The system uses a multi-tenant PostgreSQL schema with the following main tables:

- `tenants` - Venue information
- `users` - User accounts
- `rooms` - Karaoke rooms
- `bookings` - Booking records
- `business_hours` - Operating hours
- `settings` - System settings

## 🚀 Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
3. Deploy automatically on push to main branch

### Environment Variables

Required environment variables:

- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing

## 🧪 Testing

### Manual Testing

1. Start the development server: `vercel dev`
2. Open `http://localhost:3000`
3. Login with demo credentials
4. Test booking creation and management

### API Testing

Use tools like Postman or curl to test API endpoints:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}'
```

## 🔧 Development

### Project Structure

```
├── api/                    # Vercel Functions
│   ├── auth/              # Authentication endpoints
│   ├── bookings/          # Booking endpoints
│   ├── business-hours.js  # Business hours endpoint
│   ├── health.js          # Health check
│   └── rooms.js           # Rooms endpoint
├── Boom-Booking-Isolate/  # Legacy system (reference)
├── docs/                  # Documentation
├── index.html             # Frontend application
├── package.json           # Dependencies
└── vercel.json           # Vercel configuration
```

### Adding New Features

1. Create new API endpoints in the `api/` directory
2. Update the frontend in `index.html`
3. Test locally with `vercel dev`
4. Deploy to Vercel

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check if Neon database is accessible
   - Ensure database schema is properly set up

2. **Authentication Issues**
   - Verify `JWT_SECRET` is set
   - Check token expiration
   - Ensure user exists in database

3. **CORS Issues**
   - CORS is configured for all origins in development
   - For production, update CORS settings as needed

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📈 Performance

- **Serverless Functions**: Auto-scaling based on demand
- **Database Connection Pooling**: Managed by Neon
- **Caching**: Implemented at function level
- **CDN**: Automatic with Vercel deployment

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password security
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Proper cross-origin settings

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the troubleshooting guide

## 🎉 Success!

Your Boom Karaoke Booking System is now ready for production use!

---

**Built with ❤️ for karaoke venues worldwide**