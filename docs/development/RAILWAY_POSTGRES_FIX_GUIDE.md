# 🚀 Railway PostgreSQL Connection Fix Guide

## 🎯 **Problem Identified**

The error `port: 5432` indicates a PostgreSQL connection failure on Railway. The issue was that your application was configured to use PostgreSQL in production but the server was still trying to initialize SQLite database.

## ✅ **Solution Implemented**

### **1. Fixed Database Initialization Logic**

Updated `server-production.js` to:
- ✅ Detect PostgreSQL environment (Railway)
- ✅ Use PostgreSQL initialization for production
- ✅ Fallback to SQLite for development
- ✅ Test connection before proceeding

### **2. Fixed PostgreSQL Configuration Bugs**

Fixed several bugs in `database/postgres.js`:
- ✅ Fixed undefined `initClient` references
- ✅ Corrected client variable usage
- ✅ Improved error handling

### **3. Updated Environment Configuration**

Updated `env.production.railway` to:
- ✅ Comment out placeholder values
- ✅ Rely on Railway's automatic `DATABASE_URL`
- ✅ Provide clear instructions

---

## 🚀 **Railway Deployment Steps**

### **Step 1: Add PostgreSQL Service**

1. **Go to your Railway project dashboard**
2. **Click "New Service" → "Database" → "PostgreSQL"**
3. **Railway will automatically provide `DATABASE_URL`**

### **Step 2: Configure Environment Variables**

In your Railway backend service, set these environment variables:

```env
# Server Configuration
NODE_ENV=production
PORT=5001

# Database (Railway provides DATABASE_URL automatically)
# No need to set individual POSTGRES_* variables

# Security
JWT_SECRET=your-super-secure-jwt-secret-change-this-now
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS (Update with your frontend URL)
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=Boom Booking <your-email@gmail.com>

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### **Step 3: Deploy Backend**

1. **Root Directory**: `Boom-Booking-Isolate/backend`
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. **Health Check**: `/api/health`

### **Step 4: Verify Database Connection**

The server will now:
1. ✅ Test PostgreSQL connection on startup
2. ✅ Initialize multi-tenant schema
3. ✅ Create default tenant and data
4. ✅ Start successfully with PostgreSQL

---

## 🔍 **Troubleshooting**

### **If you still get PostgreSQL errors:**

1. **Check Railway PostgreSQL Service Status**
   - Ensure PostgreSQL service is running
   - Check service logs for errors

2. **Verify Environment Variables**
   - `DATABASE_URL` should be automatically set by Railway
   - `NODE_ENV=production` must be set

3. **Check Application Logs**
   ```bash
   # In Railway dashboard, check deployment logs
   # Look for these success messages:
   # ✅ PostgreSQL connection established successfully
   # ✅ Multi-tenant database schema created successfully
   # ✅ Default tenant and data created successfully
   ```

4. **Manual Database Connection Test**
   ```bash
   # Connect to your Railway PostgreSQL from local machine
   psql $DATABASE_URL
   ```

### **Common Issues & Solutions:**

| Issue | Solution |
|-------|----------|
| `port: 5432` error | PostgreSQL service not running or misconfigured |
| `DATABASE_URL` not found | Add PostgreSQL service to Railway project |
| Connection timeout | Check Railway service status and logs |
| SSL errors | Railway handles SSL automatically |

---

## 📊 **Database Schema**

The application now uses a **multi-tenant PostgreSQL schema** with:

- ✅ **Tenant isolation** with Row Level Security
- ✅ **UUID primary keys** for better scaling
- ✅ **Proper indexes** for performance
- ✅ **Audit logging** for compliance
- ✅ **Default data** for immediate use

### **Tables Created:**
- `tenants` - Multi-tenant configuration
- `users` - Global user management
- `tenant_users` - User-tenant relationships
- `rooms` - Tenant-specific rooms
- `bookings` - Tenant-specific bookings
- `business_hours` - Tenant-specific hours
- `settings` - Tenant-specific settings
- `audit_logs` - Security and compliance logging

---

## 🎉 **Success Indicators**

Your Railway deployment is successful when you see:

```bash
🐘 Initializing PostgreSQL database for production...
✅ PostgreSQL connection established successfully
✅ Multi-tenant database schema created successfully
✅ Default tenant and data created successfully
✅ PostgreSQL database initialized successfully
🚀 Production server running on port 5001
🗄️ Database: PostgreSQL (Railway)
```

---

## 📞 **Next Steps**

1. **Deploy Frontend to Vercel** (separate service)
2. **Update CORS_ORIGIN** with your frontend URL
3. **Configure email and payment services**
4. **Set up monitoring and logging**

---

**Last Updated**: September 22, 2025  
**Status**: ✅ **FIXED** - PostgreSQL connection issue resolved
