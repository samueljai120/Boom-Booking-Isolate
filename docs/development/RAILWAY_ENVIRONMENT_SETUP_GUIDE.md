# 🚀 Railway Environment Variables Setup Guide

## 🚨 **CRITICAL: Railway Service Down - Environment Variables Not Set**

The Railway service is returning 404 because the environment variables are not properly configured. Follow these steps to fix it.

## ✅ **Step 1: Set Environment Variables in Railway Dashboard**

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your project**: `advanced-calender-production-02f3`
3. **Click on your backend service**
4. **Go to Variables tab**
5. **Add these environment variables**:

```env
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://boom-booking-frontend.vercel.app
JWT_SECRET=your-super-secure-jwt-secret-change-this-now
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

## ✅ **Step 2: Verify Service is Running**

After setting the environment variables, test these endpoints:

```bash
# Health check
curl https://advanced-calender-production-02f3.up.railway.app/health

# API health check
curl https://advanced-calender-production-02f3.up.railway.app/api/health

# Root endpoint
curl https://advanced-calender-production-02f3.up.railway.app/

# Business hours (should work with CORS)
curl -H "Origin: https://boom-booking-frontend.vercel.app" \
     https://advanced-calender-production-02f3.up.railway.app/api/business-hours
```

## ✅ **Step 3: Test CORS Headers**

Test that CORS headers are properly set:

```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://boom-booking-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v https://advanced-calender-production-02f3.up.railway.app/api/business-hours

# Should return:
# Access-Control-Allow-Origin: https://boom-booking-frontend.vercel.app
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin
# Access-Control-Allow-Credentials: true
```

## 🔍 **Troubleshooting**

### **If service still returns 404:**

1. **Check Railway Logs**:
   - Go to Railway dashboard → Your service → Logs
   - Look for error messages
   - Check if the service is starting properly

2. **Verify Environment Variables**:
   - Make sure all variables are set correctly
   - Check for typos in variable names
   - Ensure values don't have extra spaces

3. **Check Service Status**:
   - Go to Railway dashboard → Your service
   - Check if the service is running
   - Look for any error indicators

### **If CORS still doesn't work:**

1. **Check CORS_ORIGIN variable**:
   - Make sure it's set to exactly: `https://boom-booking-frontend.vercel.app`
   - No trailing slashes or extra characters

2. **Test with different origins**:
   - Try with `http://localhost:3000` for testing
   - Check if the allowed origins are being logged

3. **Check browser network tab**:
   - Look for preflight OPTIONS requests
   - Verify response headers include CORS headers

## 📊 **Expected Results**

After setting the environment variables correctly:

✅ **Service Health**: `/health` should return 200 OK  
✅ **API Health**: `/api/health` should return 200 OK  
✅ **CORS Headers**: All responses should include proper CORS headers  
✅ **Frontend**: Vercel frontend should work without CORS errors  
✅ **API Calls**: Business hours and auth endpoints should work  

## 🎯 **Next Steps**

1. **Set the environment variables** in Railway dashboard
2. **Wait 2-3 minutes** for the service to restart
3. **Test the endpoints** using the curl commands above
4. **Check your Vercel frontend** - CORS errors should be gone
5. **Verify all API calls work** from the frontend

---

**Last Updated**: January 23, 2025  
**Status**: 🚨 **CRITICAL** - Service down due to missing environment variables
