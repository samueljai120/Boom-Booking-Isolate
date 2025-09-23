# 🗄️ Vercel Database Setup Guide

## 🎯 **Database Solution: Vercel Postgres**

We're using Vercel Postgres for the simplest integration with Vercel Functions. This provides:
- ✅ **Serverless PostgreSQL** - Perfect for Vercel Functions
- ✅ **Native Integration** - Built into Vercel platform
- ✅ **Free Tier** - 1GB storage, 1 billion reads/month
- ✅ **Easy Setup** - No external service configuration
- ✅ **Automatic Scaling** - Scales with your functions

## 🚀 **Setup Steps**

### **Step 1: Add Vercel Postgres to Your Project**

1. **Go to Vercel Dashboard**: https://vercel.com
2. **Select your project**
3. **Go to Storage tab**
4. **Click "Create Database"**
5. **Select "Postgres"**
6. **Name it**: `boom-booking-db`
7. **Click "Create"**

### **Step 2: Install Dependencies**

The dependencies are already added to `package.json`:
```json
{
  "@vercel/postgres": "^0.5.1",
  "bcryptjs": "^2.4.3"
}
```

### **Step 3: Set Environment Variables**

Vercel will automatically set these environment variables:
- `POSTGRES_URL` - Database connection URL
- `POSTGRES_PRISMA_URL` - Prisma-compatible URL
- `POSTGRES_URL_NON_POOLING` - Direct connection URL

**Additional variables to set:**
```env
JWT_SECRET=your-super-secure-jwt-secret-change-this-now
JWT_EXPIRES_IN=24h
```

### **Step 4: Deploy and Test**

1. **Push to GitHub** (already done)
2. **Vercel will automatically deploy**
3. **Test the database endpoints**:

```bash
# Test health check
curl https://your-app.vercel.app/api/health

# Test business hours (from database)
curl https://your-app.vercel.app/api/business-hours

# Test rooms (from database)
curl https://your-app.vercel.app/api/rooms

# Test login (with database)
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}'
```

## 📊 **Database Schema**

### **Users Table**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Rooms Table**
```sql
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  price_per_hour DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Bookings Table**
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  notes TEXT,
  total_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms (id)
);
```

### **Business Hours Table**
```sql
CREATE TABLE business_hours (
  id SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 **Database Features**

### **Automatic Initialization**
- Database tables are created automatically on first API call
- Default data is inserted (rooms, business hours, demo user)
- Fallback to static data if database fails

### **Error Handling**
- Graceful fallback to static data
- Comprehensive error logging
- Database connection retry logic

### **Security**
- Password hashing with bcrypt
- JWT token authentication
- SQL injection protection with parameterized queries

## 📈 **Performance Features**

### **Serverless Scaling**
- Database connections scale with function usage
- No connection pooling needed
- Automatic cold start optimization

### **Caching**
- Vercel Edge caching for static data
- Function-level caching for database queries
- CDN distribution for global performance

## 🔍 **Monitoring and Debugging**

### **Vercel Dashboard**
- Function logs and metrics
- Database query performance
- Error tracking and alerts

### **Database Management**
- Vercel Postgres dashboard
- Query performance monitoring
- Connection pool management

## 🎉 **Expected Results**

After setup:

✅ **Database Connected** - All API endpoints use PostgreSQL  
✅ **Persistent Data** - User accounts, rooms, bookings persist  
✅ **Real Authentication** - JWT tokens with database validation  
✅ **Scalable** - Serverless database scales automatically  
✅ **Reliable** - Fallback to static data if database fails  

## 📞 **Next Steps**

1. **Add Vercel Postgres** to your project
2. **Set JWT_SECRET** environment variable
3. **Deploy and test** the database endpoints
4. **Add more API routes** as needed
5. **Implement booking functionality** with database persistence

---

**Last Updated**: January 23, 2025  
**Status**: ✅ **READY FOR SETUP** - Database integration configured
