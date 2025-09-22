# 🚀 Boom Karaoke - Production Deployment Guide

## 📋 **Quick Start Instructions**

### **Option 1: Automated Deployment (Recommended)**

1. **Deploy Backend to Railway:**
   ```bash
   cd Boom-Booking-Isolate/backend
   ./railway-deploy.sh
   ```

2. **Deploy Frontend to Vercel:**
   ```bash
   cd Boom-Booking-Isolate
   npx vercel --prod
   ```

### **Option 2: Manual Deployment**

---

## 🚀 **Step 1: Deploy Backend to Railway**

### **Method A: Using Railway CLI**

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Navigate to backend directory:**
   ```bash
   cd Boom-Booking-Isolate/backend
   ```

4. **Initialize Railway project:**
   ```bash
   railway init
   ```

5. **Set environment variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=5001
   railway variables set JWT_SECRET=your-super-secure-jwt-secret-for-production-change-this-now
   railway variables set CORS_ORIGIN=*
   railway variables set BCRYPT_ROUNDS=12
   railway variables set LOG_LEVEL=info
   ```

6. **Deploy:**
   ```bash
   railway up
   ```

### **Method B: Using Railway Dashboard**

1. **Go to [Railway.app](https://railway.app)**
2. **Click "New Project" → "Deploy from GitHub repo"**
3. **Select your repository**
4. **Configure the service:**
   - **Root Directory**: `Boom-Booking-Isolate/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check**: `/api/health`

5. **Set Environment Variables in Railway Dashboard:**
   ```
   NODE_ENV=production
   PORT=5001
   JWT_SECRET=your-super-secure-jwt-secret-for-production-change-this-now
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   CORS_ORIGIN=*
   BCRYPT_ROUNDS=12
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   LOG_LEVEL=info
   ENABLE_METRICS=true
   DEFAULT_TIMEZONE=America/New_York
   DEFAULT_CURRENCY=USD
   BOOKING_ADVANCE_DAYS=30
   BOOKING_MIN_DURATION=60
   BOOKING_MAX_DURATION=480
   ```

6. **Deploy and note the Railway URL** (e.g., `https://your-app.railway.app`)

---

## 🎨 **Step 2: Deploy Frontend to Vercel**

### **Method A: Using Vercel CLI**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to frontend directory:**
   ```bash
   cd Boom-Booking-Isolate
   ```

3. **Login to Vercel:**
   ```bash
   vercel login
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

5. **Set Environment Variables:**
   ```bash
   vercel env add VITE_API_BASE_URL
   # Enter: https://your-railway-backend.railway.app/api
   
   vercel env add VITE_WS_URL
   # Enter: https://your-railway-backend.railway.app
   
   vercel env add VITE_APP_NAME
   # Enter: Boom Karaoke Booking
   ```

### **Method B: Using Vercel Dashboard**

1. **Go to [Vercel.com](https://vercel.com)**
2. **Click "New Project" → "Import Git Repository"**
3. **Select your repository**
4. **Configure the project:**
   - **Root Directory**: `Boom-Booking-Isolate`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Framework**: Vite

5. **Set Environment Variables in Vercel Dashboard:**
   ```
   VITE_API_BASE_URL=https://your-railway-backend.railway.app/api
   VITE_WS_URL=https://your-railway-backend.railway.app
   VITE_APP_NAME=Boom Karaoke Booking
   VITE_APP_VERSION=1.0.0
   ```

6. **Deploy and note the Vercel URL** (e.g., `https://your-app.vercel.app`)

---

## 🔧 **Step 3: Update CORS Configuration**

After both deployments are complete:

1. **Update Railway CORS_ORIGIN:**
   ```bash
   railway variables set CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```

2. **Redeploy Railway:**
   ```bash
   railway up
   ```

---

## ✅ **Step 4: Test Your Deployment**

1. **Test Backend API:**
   ```bash
   curl https://your-railway-backend.railway.app/api/health
   ```

2. **Test Frontend:**
   - Visit your Vercel URL
   - Try logging in
   - Test booking functionality

---

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **CORS Errors:**
   - Ensure `CORS_ORIGIN` includes your Vercel domain
   - Check that Railway backend is accessible

2. **Environment Variables:**
   - Verify all required variables are set
   - Check variable names are correct (case-sensitive)

3. **Build Failures:**
   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json

4. **Database Issues:**
   - Railway provides PostgreSQL by default
   - Check database connection string

---

## 📊 **Monitoring & Maintenance**

### **Railway Dashboard:**
- Monitor backend performance
- View logs and metrics
- Manage environment variables

### **Vercel Dashboard:**
- Monitor frontend performance
- View deployment history
- Manage domains and environment variables

---

## 🎯 **Next Steps After Deployment**

1. **Set up custom domains** (optional)
2. **Configure SSL certificates** (automatic)
3. **Set up monitoring and alerts**
4. **Configure backup strategies**
5. **Set up CI/CD pipelines**

---

**Last Updated**: December 2024
**Version**: 1.0.0-production-ready
