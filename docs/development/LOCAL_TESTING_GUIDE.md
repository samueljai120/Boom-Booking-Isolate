# 🧪 Local Testing Guide

## 🚀 **Test Everything Locally Before Deploying!**

Since you've hit the Vercel rate limit, we can test everything locally using Vercel CLI to simulate the production environment.

## 📋 **Prerequisites**

1. **Node.js** (already installed)
2. **Vercel CLI** (already installed)
3. **Neon Database** (credentials provided)

## 🛠️ **Setup Local Testing**

### **Step 1: Install Dependencies**
```bash
npm install
```

### **Step 2: Set Environment Variables**
Create a `.env.local` file:
```env
DATABASE_URL=postgresql://neondb_owner:npg_gPcJ0YO9QZzN@ep-patient-surf-ad9p9gn0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-super-secure-jwt-secret-change-this-now
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### **Step 3: Start Local Development Server**
```bash
# Start Vercel dev server (simulates production)
vercel dev

# OR start regular dev server
npm run dev
```

## 🧪 **Test API Endpoints**

### **Test Health Check**
```bash
curl http://localhost:3000/api/health
```

### **Test Business Hours**
```bash
curl http://localhost:3000/api/business-hours
```

### **Test Rooms**
```bash
curl http://localhost:3000/api/rooms
```

### **Test Authentication**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}'

# Get user info
curl http://localhost:3000/api/auth/me
```

## 🌐 **Test Frontend**

1. **Open browser**: http://localhost:3000
2. **Test login**: demo@example.com / demo123
3. **Test booking flow**
4. **Test calendar functionality**

## 🔍 **What to Test**

### **✅ API Functionality**
- [ ] Health check returns success
- [ ] Business hours API works
- [ ] Rooms API works
- [ ] Login API works
- [ ] User info API works

### **✅ Frontend Functionality**
- [ ] Page loads without errors
- [ ] Login form works
- [ ] Calendar displays correctly
- [ ] Booking flow works
- [ ] No CORS errors in console

### **✅ Database Integration** (when added)
- [ ] Database connection works
- [ ] Data persists between requests
- [ ] Authentication uses database
- [ ] Business hours from database
- [ ] Rooms from database

## 🚨 **Troubleshooting**

### **Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
vercel dev --port 3001
```

### **Environment Variables Not Loading**
```bash
# Check if .env.local exists
ls -la .env.local

# Restart dev server
vercel dev
```

### **API Routes Not Working**
```bash
# Check if API directory exists
ls -la api/

# Check Vercel dev server logs
vercel dev --debug
```

## 🎯 **Expected Results**

After successful setup:
- ✅ **No CORS errors** in browser console
- ✅ **API endpoints** return proper JSON responses
- ✅ **Frontend** loads and functions correctly
- ✅ **Login** works with demo credentials
- ✅ **Database** connects (when integrated)

## 🚀 **Next Steps**

1. **Test locally** using this guide
2. **Fix any issues** found during testing
3. **Wait for Vercel rate limit** to reset (59 minutes)
4. **Deploy to Vercel** when ready

## 📞 **Need Help?**

If you encounter issues:
1. Check the console logs
2. Verify environment variables
3. Test API endpoints individually
4. Check network tab in browser dev tools
