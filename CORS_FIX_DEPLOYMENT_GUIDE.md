# 🚀 CORS Fix Deployment Guide

## 🎯 **Problem Identified**

The CORS error occurs because:
1. **Configuration Mismatch**: Railway was using `server-railway-fixed.js` but package.json pointed to `server-railway.js`
2. **Incorrect CORS Headers**: The backend wasn't properly configured to allow requests from Vercel frontend
3. **Missing Environment Variables**: CORS_ORIGIN wasn't set in Railway environment

## ✅ **Solution Implemented**

### **1. Fixed Railway Configuration Mismatch**
- ✅ Updated `railway.json` to use `npm start` instead of direct file execution
- ✅ Ensures consistency between Railway and package.json configurations

### **2. Updated CORS Configuration**
- ✅ Replaced permissive `origin: '*'` with specific allowed origins
- ✅ Added proper Vercel frontend URL to allowed origins
- ✅ Implemented proper CORS middleware with origin validation
- ✅ Added CORS_ORIGIN environment variable support
- ✅ Fixed Socket.IO CORS configuration

### **3. Enhanced Security**
- ✅ Removed overly permissive CORS settings
- ✅ Added proper origin validation
- ✅ Configured Helmet for better security
- ✅ Added CORS preflight caching (24 hours)

---

## 🚀 **Deployment Steps**

### **Step 1: Deploy Backend to Railway**

1. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Fix CORS configuration for Vercel frontend"
   git push origin main
   ```

2. **Railway will automatically redeploy** with the new configuration

### **Step 2: Set Railway Environment Variables**

In your Railway backend service dashboard, add these environment variables:

```env
# Server Configuration
NODE_ENV=production
PORT=5001

# CORS Configuration (IMPORTANT!)
CORS_ORIGIN=https://boom-booking-frontend.vercel.app

# Database (Railway provides DATABASE_URL automatically)
# No need to set individual POSTGRES_* variables

# Security
JWT_SECRET=your-super-secure-jwt-secret-change-this-now
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

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

### **Step 3: Verify Backend Deployment**

Check that your Railway backend is running correctly:

1. **Visit your Railway backend URL**: `https://advanced-calender-production-02f3.up.railway.app/health`
2. **Should return**:
   ```json
   {
     "success": true,
     "status": "healthy",
     "timestamp": "2025-01-23T23:33:57.000Z",
     "uptime": 123.456,
     "version": "1.0.0",
     "message": "Railway health check - server is running"
   }
   ```

### **Step 4: Test CORS Headers**

Test that CORS headers are properly set:

```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://boom-booking-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v https://advanced-calender-production-02f3.up.railway.app/api/health

# Should return:
# Access-Control-Allow-Origin: https://boom-booking-frontend.vercel.app
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin
# Access-Control-Allow-Credentials: true
```

### **Step 5: Redeploy Frontend (if needed)**

If you need to update the frontend:

1. **Push to main branch** (Vercel auto-deploys)
2. **Or manually redeploy** in Vercel dashboard

---

## 🔍 **Troubleshooting**

### **If CORS errors persist:**

1. **Check Railway Logs**:
   - Go to Railway dashboard → Your backend service → Logs
   - Look for: `🌐 Allowed CORS Origins: [...]`
   - Verify your Vercel URL is in the list

2. **Verify Environment Variables**:
   - Ensure `CORS_ORIGIN` is set in Railway
   - Check that `NODE_ENV=production`

3. **Test API Directly**:
   ```bash
   curl -H "Origin: https://boom-booking-frontend.vercel.app" \
        https://advanced-calender-production-02f3.up.railway.app/api/health
   ```

4. **Check Browser Network Tab**:
   - Look for preflight OPTIONS requests
   - Verify response headers include CORS headers

### **Common Issues & Solutions:**

| Issue | Solution |
|-------|----------|
| CORS error persists | Check Railway environment variables |
| 404 on API calls | Verify Railway service is running |
| Preflight fails | Check OPTIONS method handling |
| Headers missing | Verify CORS middleware order |

---

## 📊 **CORS Configuration Details**

### **Allowed Origins:**
- `https://boom-booking-frontend.vercel.app` (Production Vercel)
- `https://boom-booking.vercel.app` (Alternative Vercel)
- `http://localhost:3000` (Development)
- `http://localhost:5173` (Vite dev server)
- Custom origin from `CORS_ORIGIN` environment variable

### **Allowed Methods:**
- GET, POST, PUT, DELETE, PATCH, OPTIONS

### **Allowed Headers:**
- Content-Type, Authorization, X-Requested-With, Accept, Origin

### **Security Features:**
- ✅ Origin validation (no wildcards in production)
- ✅ Credentials support for authenticated requests
- ✅ Preflight caching (24 hours)
- ✅ Proper error handling for invalid origins

---

## 🎉 **Success Indicators**

Your CORS fix is successful when:

1. ✅ **No CORS errors** in browser console
2. ✅ **API calls work** from Vercel frontend
3. ✅ **Preflight requests** return 200 status
4. ✅ **CORS headers** present in response
5. ✅ **Authentication** works properly

---

## 📞 **Next Steps**

1. **Monitor Railway logs** for any CORS-related errors
2. **Test all API endpoints** from the frontend
3. **Set up monitoring** for production issues
4. **Consider adding more security headers** if needed

---

**Last Updated**: January 23, 2025  
**Status**: ✅ **READY FOR DEPLOYMENT** - CORS configuration fixed
