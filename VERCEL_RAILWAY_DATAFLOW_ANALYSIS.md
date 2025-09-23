# 🔄 Vercel ↔ Railway Dataflow Analysis

## 🎯 **Current Architecture Overview**

```
┌─────────────────┐    HTTPS     ┌─────────────────┐
│   Vercel        │ ──────────── │   Railway       │
│   Frontend      │              │   Backend       │
│                 │              │                 │
│ • React App     │              │ • Express API   │
│ • Vite Build    │              │ • PostgreSQL   │
│ • Static Files  │              │ • Socket.IO    │
└─────────────────┘              └─────────────────┘
```

---

## 🔧 **Configuration Analysis**

### **Frontend Configuration (Vercel)**

#### **1. API Base URL Configuration**
```javascript
// vercel.json - Environment Variables
{
  "env": {
    "VITE_API_BASE_URL": "https://advanced-calendar-production-02f3.up.railway.app/api",
    "VITE_WS_URL": "https://advanced-calendar-production-02f3.up.railway.app",
    "VITE_APP_NAME": "Boom Karaoke Booking",
    "VITE_APP_VERSION": "1.0.0"
  }
}
```

#### **2. API Configuration Logic**
```javascript
// src/utils/apiConfig.js
export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL; // ✅ Railway URL
  }
  
  if (import.meta.env.PROD) {
    return 'https://advanced-calendar-production-02f3.up.railway.app/api';
  }
  
  return 'http://localhost:5001/api'; // Development
};
```

#### **3. Smart Fallback System**
```javascript
// src/lib/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || API_CONFIG.BASE_URL;
let isMockMode = false; // Start with real API attempts

// Health check before API calls
const checkApiHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { 
      timeout: 5000,
      headers: API_CONFIG.HEADERS 
    });
    return response.status === 200;
  } catch (error) {
    return false; // Fallback to mock
  }
};
```

---

### **Backend Configuration (Railway)**

#### **1. CORS Configuration**
```javascript
// server-production.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*", // ⚠️ ISSUE: Too permissive
  credentials: true
}));
```

#### **2. Environment Variables**
```env
# env.railway.production
NODE_ENV=production
PORT=5001
CORS_ORIGIN=https://your-vercel-app.vercel.app  # ⚠️ ISSUE: Placeholder URL
JWT_SECRET=your-super-secure-jwt-secret-for-production-change-this-now-railway-2024
```

#### **3. API Routes Structure**
```javascript
// Available endpoints:
app.use('/api/auth', authRoutes);        // Authentication
app.use('/api/rooms', roomsRoutes);      // Room management
app.use('/api/bookings', bookingsRoutes); // Booking system
app.use('/api/health', healthRoutes);     // Health checks
// ... other routes
```

---

## 🔍 **Dataflow Analysis**

### **1. Authentication Flow**

```
Frontend (Vercel)                    Backend (Railway)
┌─────────────────┐                  ┌─────────────────┐
│ 1. User Login   │ ──────────────── │ POST /api/auth/login │
│                 │                  │                 │
│ 2. Store Token  │ ←──────────────── │ JWT Token + User │
│                 │                  │                 │
│ 3. API Calls    │ ──────────────── │ GET /api/auth/me │
│    + Bearer     │                  │                 │
│                 │ ←──────────────── │ User Data       │
└─────────────────┘                  └─────────────────┘
```

#### **Current Issues:**
- ❌ **403 Forbidden** on `/api/auth/me` - Token validation failing
- ❌ **CORS Origin** not properly configured
- ❌ **JWT Secret** using placeholder value

### **2. Health Check Flow**

```
Frontend (Vercel)                    Backend (Railway)
┌─────────────────┐                  ┌─────────────────┐
│ Health Check    │ ──────────────── │ GET /api/health │
│                 │                  │                 │
│ API Status      │ ←──────────────── │ Health Data    │
│                 │                  │                 │
│ Fallback Logic  │                  │ Database Check  │
└─────────────────┘                  └─────────────────┘
```

#### **Health Check Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-09-23T20:42:03.000Z",
  "uptime": 12345,
  "version": "1.0.0",
  "environment": "production",
  "database": "connected"
}
```

### **3. Error Handling Flow**

```
Frontend (Vercel)                    Backend (Railway)
┌─────────────────┐                  ┌─────────────────┐
│ API Call        │ ──────────────── │ Process Request │
│                 │                  │                 │
│ Error Response  │ ←──────────────── │ Error Response  │
│                 │                  │                 │
│ Fallback to     │                  │ Status Codes:   │
│ Mock Data       │                  │ • 401 Unauthorized
│                 │                  │ • 403 Forbidden
│                 │                  │ • 500 Server Error
└─────────────────┘                  └─────────────────┘
```

---

## 🚨 **Identified Issues**

### **1. CORS Configuration Problem**
```javascript
// Current (PROBLEMATIC)
origin: process.env.CORS_ORIGIN || "*"

// Should be (SECURE)
origin: process.env.CORS_ORIGIN || "https://boom-booking-frontend.vercel.app"
```

### **2. Environment Variable Issues**
```env
# Current (PROBLEMATIC)
CORS_ORIGIN=https://your-vercel-app.vercel.app  # Placeholder
JWT_SECRET=your-super-secure-jwt-secret-for-production-change-this-now-railway-2024  # Placeholder

# Should be (PRODUCTION)
CORS_ORIGIN=https://boom-booking-frontend.vercel.app  # Actual Vercel URL
JWT_SECRET=actual-secure-secret-key  # Real secret
```

### **3. Token Validation Issues**
```javascript
// Current issue: Token validation failing
jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
  if (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
  // ...
});
```

---

## 🔧 **Required Fixes**

### **1. Update Railway Environment Variables**
```env
NODE_ENV=production
PORT=5001
CORS_ORIGIN=https://boom-booking-frontend.vercel.app
JWT_SECRET=your-actual-secure-jwt-secret-here
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://...  # Railway provides this automatically
```

### **2. Fix CORS Configuration**
```javascript
// server-production.js
app.use(cors({
  origin: [
    'https://boom-booking-frontend.vercel.app',
    'https://boom-booking-frontend-git-main-samueljai120.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### **3. Improve Error Handling**
```javascript
// Better error responses
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        error: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    req.user = user;
    next();
  });
}
```

---

## 📊 **Dataflow Status**

| Component | Status | Issues |
|-----------|--------|--------|
| **Frontend → Backend** | ⚠️ Partial | CORS, Token validation |
| **Health Checks** | ✅ Working | None |
| **Authentication** | ❌ Failing | 403 errors, Token issues |
| **API Fallback** | ✅ Working | Mock data fallback |
| **Database** | ✅ Connected | PostgreSQL working |

---

## 🚀 **Next Steps**

1. **Update Railway Environment Variables**
   - Set correct `CORS_ORIGIN`
   - Set secure `JWT_SECRET`
   - Redeploy Railway service

2. **Test Dataflow**
   - Health check: `GET /api/health`
   - Authentication: `POST /api/auth/login`
   - Session check: `GET /api/auth/me`

3. **Monitor Console Logs**
   - Check for 403 errors
   - Verify CORS headers
   - Confirm token validation

---

**Analysis Date**: September 23, 2025  
**Status**: ⚠️ **NEEDS FIXES** - CORS and Authentication issues identified
