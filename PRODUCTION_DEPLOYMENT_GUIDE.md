# Production Deployment Guide
## Boom Booking Platform - Live Deployment

**Date**: December 19, 2024  
**Status**: 🚀 **READY FOR DEPLOYMENT**  
**Platforms**: Railway (Backend) + Vercel (Frontend)

---

## 🎯 **DEPLOYMENT OVERVIEW**

### **Architecture**
- **Backend**: Railway (Node.js + PostgreSQL)
- **Frontend**: Vercel (React + Vite)
- **Database**: Railway PostgreSQL
- **Domain**: Custom domain with SSL

---

## 📋 **DEPLOYMENT CHECKLIST**

### **✅ Pre-Deployment (COMPLETED)**
- [x] Frontend production build successful
- [x] Backend production server configured
- [x] Environment variables prepared
- [x] Database migration scripts ready
- [x] Docker configuration complete
- [x] Security headers configured
- [x] CORS settings updated

### **🔄 Deployment Steps (IN PROGRESS)**
- [ ] Deploy backend to Railway
- [ ] Set up PostgreSQL database on Railway
- [ ] Configure environment variables
- [ ] Deploy frontend to Vercel
- [ ] Set up custom domain
- [ ] Configure SSL certificates
- [ ] Test production deployment
- [ ] Set up monitoring

---

## 🚀 **STEP 1: RAILWAY BACKEND DEPLOYMENT**

### **1.1 Create Railway Account**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your repository

### **1.2 Deploy Backend**
1. Create new project on Railway
2. Connect to your GitHub repository
3. Select the `Boom-Booking-Isolate` folder
4. Railway will auto-detect Node.js

### **1.3 Configure Environment Variables**
Set these in Railway dashboard:
```
NODE_ENV=production
PORT=5001
DB_TYPE=postgresql
JWT_SECRET=your-super-secure-jwt-secret
CORS_ORIGIN=https://your-vercel-app.vercel.app
EMAIL_PROVIDER=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
STRIPE_SECRET_KEY=your-stripe-secret
```

### **1.4 Add PostgreSQL Database**
1. In Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will provide connection details
4. Update environment variables with DB credentials

---

## 🌐 **STEP 2: VERCEL FRONTEND DEPLOYMENT**

### **2.1 Create Vercel Account**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository

### **2.2 Deploy Frontend**
1. Import project from GitHub
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Set root directory: `Boom-Booking-Isolate`

### **2.3 Configure Environment Variables**
Set these in Vercel dashboard:
```
VITE_API_BASE_URL=https://your-railway-backend.railway.app/api
VITE_WS_URL=https://your-railway-backend.railway.app
```

---

## 🔧 **STEP 3: DATABASE MIGRATION**

### **3.1 Run Migration Script**
```bash
# Connect to Railway database
psql $DATABASE_URL

# Run migration script
node backend/scripts/migrate-sqlite-to-postgres.js
```

### **3.2 Verify Data Integrity**
- Check all tables created
- Verify data migration
- Test API endpoints

---

## 🌍 **STEP 4: CUSTOM DOMAIN SETUP**

### **4.1 Backend Domain (Railway)**
1. Go to Railway project settings
2. Add custom domain
3. Configure DNS records
4. Enable SSL

### **4.2 Frontend Domain (Vercel)**
1. Go to Vercel project settings
2. Add custom domain
3. Configure DNS records
4. Enable SSL

---

## ✅ **STEP 5: PRODUCTION TESTING**

### **5.1 Backend API Tests**
- [ ] Health check: `GET /api/health`
- [ ] Authentication: `POST /api/auth/login`
- [ ] Bookings: `GET /api/bookings`
- [ ] Rooms: `GET /api/rooms`
- [ ] Settings: `GET /api/settings`

### **5.2 Frontend Tests**
- [ ] Landing page loads
- [ ] Login functionality
- [ ] Dashboard access
- [ ] Booking creation
- [ ] Settings management
- [ ] Admin panel access

### **5.3 Integration Tests**
- [ ] Frontend-backend communication
- [ ] Real-time updates (Socket.IO)
- [ ] Email notifications
- [ ] File uploads
- [ ] Database operations

---

## 📊 **PRODUCTION MONITORING**

### **6.1 Railway Monitoring**
- CPU and memory usage
- Database performance
- API response times
- Error logs

### **6.2 Vercel Monitoring**
- Build status
- Function execution
- Edge network performance
- Analytics

---

## 🔒 **SECURITY CHECKLIST**

### **7.1 Environment Security**
- [ ] All secrets in environment variables
- [ ] No hardcoded credentials
- [ ] Secure JWT secrets
- [ ] CORS properly configured

### **7.2 Database Security**
- [ ] Connection encryption
- [ ] Row-level security enabled
- [ ] Regular backups
- [ ] Access controls

### **7.3 Application Security**
- [ ] Helmet security headers
- [ ] Input validation
- [ ] Rate limiting
- [ ] XSS protection

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**
1. **CORS Errors**: Check CORS_ORIGIN setting
2. **Database Connection**: Verify DB credentials
3. **Build Failures**: Check Node.js version
4. **SSL Issues**: Verify domain configuration

### **Debug Commands**
```bash
# Check Railway logs
railway logs

# Check Vercel logs
vercel logs

# Test API endpoints
curl https://your-backend.railway.app/api/health
```

---

## 📈 **POST-DEPLOYMENT**

### **8.1 Performance Optimization**
- Enable CDN caching
- Optimize database queries
- Implement Redis caching
- Monitor performance metrics

### **8.2 User Onboarding**
- Test with real users
- Gather feedback
- Monitor usage patterns
- Iterate based on data

---

## 🎉 **SUCCESS CRITERIA**

### **Deployment Success**
- [ ] Backend accessible at custom domain
- [ ] Frontend accessible at custom domain
- [ ] All API endpoints working
- [ ] Database migration successful
- [ ] SSL certificates active
- [ ] Real-time features working
- [ ] Email notifications working

### **Performance Targets**
- [ ] API response time < 200ms
- [ ] Frontend load time < 3s
- [ ] 99.9% uptime
- [ ] Zero critical errors

---

**Ready to deploy! Follow the steps above to get your Boom Booking platform live in production! 🚀**
