# 🚀 Railway + Vercel Deployment Guide

## 🎯 **Optimal Architecture: Separate Services**

### **Railway (Backend API) + Vercel (Frontend)**

This setup provides:
- ✅ **Scalability**: Independent scaling of frontend and backend
- ✅ **Performance**: CDN distribution for frontend via Vercel
- ✅ **Cost Efficiency**: Pay only for what you use
- ✅ **Reliability**: Separate failure domains

---

## 📁 **Directory Selection**

### **For Railway (Backend API)**
```
📁 Root Directory: Boom-Booking-Isolate/backend/
├── 🎯 package.json (backend dependencies)
├── 🎯 server.js / server-production.js
├── 🎯 routes/ (API endpoints)
├── 🎯 middleware/ (authentication, CORS)
└── 🎯 database/ (database configuration)
```

**Railway Settings:**
- **Root Directory**: `Boom-Booking-Isolate/backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Port**: Auto-assigned by Railway

### **For Vercel (Frontend)**
```
📁 Root Directory: Boom-Booking-Isolate/
├── 🎯 package.json (frontend dependencies)
├── 🎯 vite.config.js
├── 🎯 src/ (React components)
├── 🎯 dist/ (built files)
└── 🎯 vercel.json (already configured)
```

**Vercel Settings:**
- **Root Directory**: `Boom-Booking-Isolate`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite

---

## 🚀 **Step-by-Step Deployment**

### **Step 1: Deploy Backend to Railway**

1. **Connect GitHub Repository**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure Backend Service**
   ```
   📁 Root Directory: Boom-Booking-Isolate/backend
   🔧 Build Command: npm install
   ▶️ Start Command: npm start
   🔗 Health Check: /api/health
   ```

3. **Set Environment Variables**
   ```env
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=your-production-jwt-secret-change-this
   DATABASE_URL=sqlite:./data/database.sqlite
   CORS_ORIGIN=*
   ```

4. **Deploy**
   - Railway will automatically build and deploy
   - Note the generated Railway URL (e.g., `https://your-app.railway.app`)

### **Step 2: Deploy Frontend to Vercel**

1. **Connect GitHub Repository**
   - Go to [Vercel.com](https://vercel.com)
   - Click "New Project" → "Import Git Repository"
   - Select your repository

2. **Configure Frontend Service**
   ```
   📁 Root Directory: Boom-Booking-Isolate
   🔧 Build Command: npm run build
   📂 Output Directory: dist
   🎨 Framework: Vite
   ```

3. **Set Environment Variables**
   ```env
   VITE_API_BASE_URL=https://your-railway-backend.railway.app/api
   VITE_WS_URL=https://your-railway-backend.railway.app
   VITE_APP_NAME=Boom Karaoke Booking
   ```

4. **Deploy**
   - Vercel will build and deploy automatically
   - You'll get a Vercel URL (e.g., `https://your-app.vercel.app`)

---

## 🔧 **Environment Variables Reference**

### **Railway Backend (.env)**
```env
# Server Configuration
NODE_ENV=production
PORT=3001

# Security
JWT_SECRET=your-production-jwt-secret-change-this
CORS_ORIGIN=https://your-vercel-app.vercel.app

# Database
DATABASE_URL=sqlite:./data/database.sqlite

# Email (Optional)
EMAIL_SERVICE_API_KEY=your-email-api-key

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
```

### **Vercel Frontend (.env)**
```env
# API Configuration
VITE_API_BASE_URL=https://your-railway-backend.railway.app/api
VITE_WS_URL=https://your-railway-backend.railway.app

# App Configuration
VITE_APP_NAME=Boom Karaoke Booking
VITE_APP_VERSION=1.0.0

# Stripe (Optional)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
```

---

## 🔄 **Alternative: Full-Stack on Railway**

If you prefer to deploy everything on Railway:

### **Railway Full-Stack Configuration**
```
📁 Root Directory: Boom-Booking-Isolate/
🔧 Build Command: npm run build
▶️ Start Command: cd backend && npm start
🔗 Health Check: /api/health
```

**Pros:**
- ✅ Single deployment
- ✅ Simpler configuration
- ✅ Lower latency between frontend/backend

**Cons:**
- ❌ Less scalable
- ❌ No CDN benefits
- ❌ Higher costs for static files

---

## 📊 **Performance Comparison**

| Setup | Frontend Speed | Backend Speed | Cost | Scalability |
|-------|---------------|---------------|------|-------------|
| **Railway + Vercel** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Railway Full-Stack** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Vercel Full-Stack** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🎯 **Recommended Setup**

### **For Production: Railway + Vercel**
- **Railway**: Backend API (`Boom-Booking-Isolate/backend/`)
- **Vercel**: Frontend (`Boom-Booking-Isolate/`)

### **For Development: Railway Full-Stack**
- **Railway**: Everything (`Boom-Booking-Isolate/`)

---

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **CORS Errors**
   - Update `CORS_ORIGIN` in Railway backend
   - Include your Vercel domain

2. **Environment Variables**
   - Ensure all required variables are set
   - Check variable names (case-sensitive)

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

4. **Database Issues**
   - Ensure database file permissions
   - Check database path in production

---

## 📞 **Support**

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Project Issues**: [GitHub Issues](https://github.com/samueljai120/Advanced-Calendar/issues)

---

**Last Updated**: September 22, 2025
**Version**: 1.0.0-production-ready
