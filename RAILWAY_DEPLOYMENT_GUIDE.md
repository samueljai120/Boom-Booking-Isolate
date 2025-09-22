# Railway Deployment Guide for Boom Karaoke Booking System

## Problem Fixed
Railway was trying to deploy from the root directory but couldn't find the Node.js application because it's located in the `Boom-Booking-Isolate/` subdirectory.

## Solution Implemented

### 1. Root Directory Configuration Files
Created the following files in the repository root:

#### `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "./start.sh",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### `package.json`
```json
{
  "name": "boom-booking-repository",
  "version": "1.0.0",
  "description": "Boom Karaoke Booking System - Full Repository",
  "private": true,
  "scripts": {
    "build": "cd Boom-Booking-Isolate && npm install && npm run build",
    "start": "cd Boom-Booking-Isolate && npm run preview",
    "dev": "cd Boom-Booking-Isolate && npm run dev",
    "install-deps": "cd Boom-Booking-Isolate && npm install"
  },
  "keywords": ["karaoke", "booking", "calendar", "react", "vite"],
  "author": "Boom Karaoke Team",
  "license": "MIT"
}
```

#### `start.sh`
A bash script that:
- Navigates to the `Boom-Booking-Isolate/` directory
- Installs dependencies if needed
- Builds the application
- Starts the preview server on Railway's PORT

#### `.railwayignore`
Excludes unnecessary files from deployment to optimize build time.

### 2. Application Directory Updates

#### Updated `Boom-Booking-Isolate/package.json`
- Added `start` script for production deployment
- Modified `preview` script to use Railway's PORT environment variable
- Added proper host binding for Railway deployment

## Deployment Steps

### 1. Commit and Push Changes
```bash
git add .
git commit -m "Fix Railway deployment configuration"
git push origin main
```

### 2. Railway Deployment
1. Go to your Railway dashboard
2. Select your project
3. Click "Deploy" or trigger a new deployment
4. Railway will now:
   - Detect the Node.js application
   - Run the `start.sh` script
   - Build the React application
   - Start the preview server

### 3. Environment Variables (Optional)
If you need to configure environment variables in Railway:
1. Go to your Railway project settings
2. Add these variables:
   - `VITE_API_BASE_URL` (if connecting to a backend API)
   - `VITE_WS_URL` (if using WebSocket connections)
   - Any other environment variables from `env.production.example`

## Expected Behavior
- Railway will successfully detect the Node.js application
- The build process will complete without errors
- Your React application will be served on Railway's provided URL
- Health checks will pass at the root path `/`

## Troubleshooting
If deployment still fails:
1. Check Railway logs for specific error messages
2. Ensure all files are committed and pushed to GitHub
3. Verify that the `start.sh` script has execute permissions
4. Check that all dependencies in `Boom-Booking-Isolate/package.json` are compatible

## File Structure After Fix
```
/
├── railway.json          # Railway deployment configuration
├── package.json          # Root package.json for Railway
├── start.sh              # Deployment script
├── .railwayignore        # Files to exclude from deployment
├── Boom-Booking-Isolate/ # Your actual application
│   ├── package.json      # Updated with production scripts
│   ├── src/              # React application source
│   └── ...               # Other app files
└── ...                   # Documentation and other files
```
