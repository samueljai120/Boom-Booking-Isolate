# 🚨 Troubleshooting Guide

## 📋 Overview

This comprehensive troubleshooting guide covers common issues, solutions, and debugging techniques for the Boom Karaoke Booking System.

**Status**: ✅ **PRODUCTION READY**  
**Support Level**: 🛠️ **COMPREHENSIVE**

---

## 🔧 Common Issues & Solutions

### 1. Authentication Issues

#### Issue: "Login failed" or "Invalid credentials"
**Symptoms**:
- User cannot log in with correct credentials
- Error message shows "Invalid credentials"
- Console shows authentication errors

**Solutions**:
1. **Verify Demo Credentials**:
   ```
   Email: demo@example.com
   Password: demo123
   ```

2. **Check Database Connection**:
   ```bash
   # Test database connectivity
   npm run test:database
   
   # Verify environment variables
   echo $DATABASE_URL
   ```

3. **Clear Browser Storage**:
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   ```

4. **Check JWT Secret**:
   ```bash
   # Ensure JWT_SECRET is set
   echo $JWT_SECRET
   ```

#### Issue: "Token expired" or "Session invalid"
**Symptoms**:
- User gets logged out unexpectedly
- "Token expired" error messages
- Authentication state resets

**Solutions**:
1. **Check Token Expiration**:
   ```bash
   # Default token expiration is 24h
   # Check JWT_EXPIRES_IN environment variable
   echo $JWT_EXPIRES_IN
   ```

2. **Refresh Authentication**:
   ```javascript
   // Force re-authentication
   localStorage.removeItem('authToken');
   window.location.reload();
   ```

---

### 2. Database Connection Issues

#### Issue: "Database connection failed"
**Symptoms**:
- API endpoints return 500 errors
- "Connection refused" errors
- Database queries timeout

**Solutions**:
1. **Verify Database URL**:
   ```bash
   # Check DATABASE_URL format
   echo $DATABASE_URL
   # Should be: postgresql://user:pass@host:port/database
   ```

2. **Test Database Connectivity**:
   ```bash
   # Run database test
   npm run test:database
   
   # Manual connection test
   node -e "
   const { Pool } = require('pg');
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   pool.query('SELECT NOW()', (err, res) => {
     if (err) console.error('Connection failed:', err);
     else console.log('Connected successfully:', res.rows[0]);
     pool.end();
   });
   "
   ```

3. **Check Database Status**:
   ```bash
   # For Neon databases
   # Check dashboard for connection status
   # Verify SSL requirements
   ```

#### Issue: "Table doesn't exist" or "Schema errors"
**Symptoms**:
- "relation does not exist" errors
- Database schema not found
- Migration errors

**Solutions**:
1. **Run Database Migrations**:
   ```bash
   # Initialize database schema
   npm run db:migrate
   
   # Seed initial data
   npm run db:seed
   ```

2. **Check Database Schema**:
   ```sql
   -- Connect to database and check tables
   \dt
   \d users
   \d rooms
   \d bookings
   \d business_hours
   ```

---

### 3. API Issues

#### Issue: "API request failed" or "Network error"
**Symptoms**:
- API calls return network errors
- 404 or 500 status codes
- CORS errors in browser

**Solutions**:
1. **Check API Server Status**:
   ```bash
   # Test health endpoint
   curl http://localhost:3000/api/health
   
   # Check server logs
   npm run dev
   ```

2. **Verify API Routes**:
   ```bash
   # Test specific endpoints
   curl http://localhost:3000/api/rooms
   curl http://localhost:3000/api/business-hours
   ```

3. **Check CORS Configuration**:
   ```bash
   # Verify CORS_ORIGIN environment variable
   echo $CORS_ORIGIN
   
   # For development, should include:
   # http://localhost:3000,http://localhost:5173
   ```

#### Issue: "Rate limit exceeded"
**Symptoms**:
- "Too many requests" errors
- API calls blocked temporarily
- 429 status codes

**Solutions**:
1. **Wait and Retry**:
   ```javascript
   // Implement exponential backoff
   const delay = Math.pow(2, attempt) * 1000;
   setTimeout(() => retryRequest(), delay);
   ```

2. **Check Rate Limit Settings**:
   ```bash
   # Rate limits are configured per endpoint
   # Auth: 5 requests per 15 minutes
   # API: 1000 requests per 15 minutes
   ```

---

### 4. WebSocket Issues

#### Issue: "WebSocket connection failed"
**Symptoms**:
- Real-time updates not working
- "Connection failed" errors
- WebSocket status shows disconnected

**Solutions**:
1. **Check WebSocket Server**:
   ```bash
   # Verify WebSocket server is running
   # Check server logs for WebSocket errors
   ```

2. **Test WebSocket Connection**:
   ```javascript
   // In browser console
   const ws = new WebSocket('ws://localhost:3000');
   ws.onopen = () => console.log('Connected');
   ws.onerror = (error) => console.error('Error:', error);
   ```

3. **Check WebSocket URL**:
   ```bash
   # Verify VITE_WS_URL environment variable
   echo $VITE_WS_URL
   ```

---

### 5. Performance Issues

#### Issue: "Slow response times" or "Page loading slowly"
**Symptoms**:
- API responses take >5 seconds
- Page loads slowly
- High memory usage

**Solutions**:
1. **Check Database Performance**:
   ```bash
   # Monitor database queries
   npm run analyze:queries
   
   # Check connection pool
   npm run monitor:database
   ```

2. **Optimize Queries**:
   ```sql
   -- Check for slow queries
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC;
   ```

3. **Monitor Memory Usage**:
   ```bash
   # Check memory usage
   npm run monitor:memory
   
   # Look for memory leaks
   npm run test:memory
   ```

---

## 🔍 Debugging Techniques

### 1. Enable Debug Mode

```javascript
// In browser console or localStorage
localStorage.setItem('debug', 'true');

// Restart application to see debug logs
```

### 2. Check Console Logs

```javascript
// Look for these error patterns:
// - Authentication errors
// - Database connection errors
// - API request failures
// - WebSocket connection issues
```

### 3. Network Tab Analysis

```javascript
// In browser DevTools Network tab:
// 1. Check API request status codes
// 2. Verify request/response headers
// 3. Look for failed requests
// 4. Check WebSocket connections
```

### 4. Database Debugging

```sql
-- Check active connections
SELECT * FROM pg_stat_activity;

-- Monitor query performance
SELECT * FROM pg_stat_statements 
ORDER BY total_time DESC;

-- Check table sizes
SELECT schemaname,tablename,pg_size_pretty(size) as size
FROM (
  SELECT schemaname,tablename,pg_total_relation_size(schemaname||'.'||tablename) as size
  FROM pg_tables
) t
ORDER BY size DESC;
```

---

## 🧪 Testing & Validation

### 1. Run System Validation

```bash
# Run comprehensive system tests
npm run test:validation

# Test specific components
npm run test:auth
npm run test:database
npm run test:api
npm run test:websocket
```

### 2. Manual Testing Checklist

#### Authentication Testing
- [ ] Login with demo credentials
- [ ] Logout functionality
- [ ] Session persistence
- [ ] Token expiration handling

#### Database Testing
- [ ] Room creation/updates
- [ ] Booking creation/cancellation
- [ ] Business hours management
- [ ] Data persistence

#### API Testing
- [ ] All endpoints respond correctly
- [ ] Error handling works
- [ ] Rate limiting functions
- [ ] CORS configuration

#### WebSocket Testing
- [ ] Connection establishes
- [ ] Real-time updates work
- [ ] Reconnection on disconnect
- [ ] Event handling

---

## 🚨 Emergency Procedures

### 1. System Recovery

```bash
# Stop all services
pm2 stop all
# or
docker-compose down

# Clear problematic data
# (Be careful - this may delete user data)
npm run db:reset

# Restart services
npm run dev
# or
docker-compose up -d
```

### 2. Database Recovery

```bash
# Restore from backup
gunzip -c /backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | psql $DATABASE_URL

# Or restore specific tables
pg_restore -t users -t rooms $DATABASE_URL backup.sql
```

### 3. Rollback Deployment

```bash
# Revert to previous version
git checkout previous-stable-tag

# Restart application
npm run build
npm start
```

---

## 📊 Monitoring & Health Checks

### 1. Health Check Endpoints

```bash
# Basic health check
curl http://localhost:3000/health

# Detailed system health
curl http://localhost:3000/api/health

# Monitoring metrics
curl http://localhost:3000/api/monitoring
```

### 2. Key Metrics to Monitor

- **Response Time**: Should be <200ms
- **Error Rate**: Should be <1%
- **Memory Usage**: Should be <80%
- **Database Connections**: Monitor pool usage
- **WebSocket Connections**: Track active connections

### 3. Alert Thresholds

```bash
# Set up alerts for:
# - High error rates (>5%)
# - Slow response times (>5s)
# - High memory usage (>90%)
# - Database connection issues
# - SSL certificate expiration
```

---

## 📞 Getting Help

### 1. Documentation Resources
- **[System Overview](../SYSTEM_OVERVIEW.md)** - Complete system overview
- **[Deployment Guide](../deployment/PRODUCTION_DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[API Documentation](API_DOCUMENTATION.md)** - API reference
- **[Database Schema](DATABASE_STRUCTURE.md)** - Database structure

### 2. Log Analysis
```bash
# Check application logs
tail -f /var/log/boom-booking/app.log

# Check error logs
tail -f /var/log/boom-booking/error.log

# Check database logs
tail -f /var/log/postgresql/postgresql.log
```

### 3. Community Support
- **GitHub Issues**: Report bugs and feature requests
- **GitHub Discussions**: Ask questions and get help
- **Documentation**: Check the docs/ directory for guides

---

## 🎯 Prevention Strategies

### 1. Regular Maintenance
- **Daily**: Check health endpoints
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies and security patches

### 2. Monitoring Setup
- **Uptime Monitoring**: External service monitoring
- **Performance Monitoring**: Response time tracking
- **Error Tracking**: Automated error reporting
- **Security Monitoring**: Threat detection

### 3. Backup Strategy
- **Database Backups**: Daily automated backups
- **Application Backups**: Weekly code backups
- **Configuration Backups**: Environment variable backups

---

## 🏆 Best Practices

### 1. Development
- Always test changes locally before deployment
- Use environment variables for configuration
- Implement proper error handling
- Write comprehensive tests

### 2. Deployment
- Use staging environment for testing
- Implement gradual rollouts
- Monitor deployment metrics
- Have rollback procedures ready

### 3. Operations
- Regular security audits
- Performance optimization
- Capacity planning
- Disaster recovery testing

---

*This troubleshooting guide provides comprehensive support for maintaining and debugging the Boom Karaoke Booking System.*
