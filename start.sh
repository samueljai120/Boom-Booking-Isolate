#!/bin/bash

# Boom Karaoke Booking System - Railway Deployment Script
echo "🎤 Starting Boom Karaoke Booking System"
echo "========================================"

# Navigate to the application directory
cd Boom-Booking-Isolate

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if dist directory exists (build should already be done by Railway)
if [ ! -d "dist" ]; then
    echo "❌ Build directory not found. Application may not have been built properly."
    exit 1
fi

# Set PORT environment variable if not set
if [ -z "$PORT" ]; then
    export PORT=3000
    echo "⚠️ PORT not set, using default: $PORT"
else
    echo "✅ Using PORT: $PORT"
fi

# Log Railway environment variables for debugging
echo "🔍 Railway Environment:"
echo "   PORT: $PORT"
echo "   NODE_ENV: ${NODE_ENV:-not set}"
echo "   RAILWAY_ENVIRONMENT: ${RAILWAY_ENVIRONMENT:-not set}"
echo ""

echo "🚀 Starting production server..."
echo "📍 Server will be available at: http://0.0.0.0:$PORT"
echo "🔑 Demo credentials: demo@example.com / demo123"
echo "🏥 Health check endpoint: http://0.0.0.0:$PORT/health"
echo ""

# Start the Express server
echo "🔧 Starting Express server..."
exec node server.js
