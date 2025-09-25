# Production Environment Setup Guide

## 🚨 Critical Security Configuration

This guide ensures your production environment is properly configured for security and reliability.

## 🔐 Required Environment Variables

### 1. JWT_SECRET (CRITICAL)
```bash
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
```

**⚠️ IMPORTANT**: 
- Must be at least 32 characters long
- Must be unique and unpredictable
- Never use the default fallback value in production
- Generate a secure random string

**Generate a secure JWT secret:**
```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64

# Option 3: Online generator (use a trusted source)
# https://generate-secret.vercel.app/64
```

### 2. Database Configuration

#### Option A: Railway PostgreSQL (Recommended)
```bash
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

#### Option B: Individual Database Variables
```bash
POSTGRES_HOST=your-postgres-host
POSTGRES_PORT=5432
POSTGRES_DB=your-database-name
POSTGRES_USER=your-username
POSTGRES_PASSWORD=your-secure-password
```

### 3. Server Configuration
```bash
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

## 🚀 Deployment Platforms

### Railway Deployment

1. **Set Environment Variables in Railway Dashboard:**
   ```
   JWT_SECRET=your-generated-secret-here
   NODE_ENV=production
   DATABASE_URL=postgresql://... (auto-provided by Railway)
   ```

2. **Verify Configuration:**
   - Go to Railway Dashboard → Your Project → Variables
   - Ensure all required variables are set
   - Check that DATABASE_URL is present (auto-provided)

### Vercel Deployment

1. **Set Environment Variables in Vercel Dashboard:**
   ```
   JWT_SECRET=your-generated-secret-here
   NODE_ENV=production
   DATABASE_URL=your-postgresql-connection-string
   ```

2. **For Frontend (if deploying separately):**
   ```
   VITE_API_BASE_URL=https://your-backend-domain.com/api
   VITE_WS_URL=https://your-backend-domain.com
   ```

### Manual Server Deployment

1. **Create .env file:**
   ```bash
   # Copy from .env.example and update values
   cp .env.example .env
   ```

2. **Edit .env file:**
   ```bash
   nano .env
   ```

3. **Set all required variables:**
   ```bash
   JWT_SECRET=your-generated-secret-here
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   PORT=5000
   CORS_ORIGIN=https://yourdomain.com
   ```

## ✅ Environment Validation

The application now includes automatic environment validation that will:

1. **Check all required variables** on startup
2. **Validate JWT_SECRET** is properly configured
3. **Verify database configuration** is complete
4. **Provide helpful error messages** for missing configuration

### Validation Output (Success):
```
🚀 Starting Boom Karaoke Backend API...
🔍 Validating environment variables...
✅ Environment validation passed
📊 Validated 8 environment variables
🔧 Environment Configuration:
   - NODE_ENV: production
   - PORT: 5000
   - Database: DATABASE_URL set
   - JWT_SECRET: Configured
   - CORS_ORIGIN: https://yourdomain.com
✅ JWT_SECRET is properly configured
✅ PostgreSQL connection established successfully
```

### Validation Output (Failure):
```
❌ Environment validation failed. Please check your configuration.
❌ Missing required environment variables:
   - JWT_SECRET: JWT signing secret (must be at least 32 characters)
❌ JWT_SECRET not set or using fallback value
🔧 Please set JWT_SECRET environment variable for security
```

## 🔧 Troubleshooting

### Issue 1: JWT_SECRET Not Set
**Error**: `JWT_SECRET not set or using fallback value`

**Solution**:
1. Generate a secure JWT secret (see above)
2. Set the environment variable in your deployment platform
3. Redeploy the application

### Issue 2: Database Connection Failed
**Error**: `Database configuration is required`

**Solution**:
1. Ensure DATABASE_URL is set (Railway provides this automatically)
2. Or set individual POSTGRES_* variables
3. Verify database is accessible from your deployment platform

### Issue 3: CORS Issues
**Error**: `Access to fetch at '...' has been blocked by CORS policy`

**Solution**:
1. Set CORS_ORIGIN to your frontend domain
2. Include all domains that will access the API
3. Use comma-separated values for multiple domains

## 📋 Production Checklist

- [ ] JWT_SECRET is set and at least 32 characters
- [ ] NODE_ENV is set to 'production'
- [ ] Database connection is configured
- [ ] CORS_ORIGIN includes your frontend domain
- [ ] All environment variables are validated
- [ ] Application starts without validation errors
- [ ] Health check endpoint responds correctly
- [ ] Authentication endpoints work properly

## 🛡️ Security Best Practices

1. **Never commit secrets** to version control
2. **Use strong, unique secrets** for each environment
3. **Rotate secrets regularly** in production
4. **Monitor for security vulnerabilities**
5. **Use HTTPS** in production
6. **Enable CORS** only for trusted domains
7. **Regular security audits** of dependencies

## 📞 Support

If you encounter issues with environment configuration:

1. Check the validation output in your deployment logs
2. Verify all required variables are set
3. Ensure values meet the validation requirements
4. Check deployment platform documentation for environment variable setup

The application will now provide clear error messages for any configuration issues, making it easier to identify and fix problems.
