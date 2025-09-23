#!/bin/bash

# Boom Karaoke Frontend - Production Start Script for Railway
echo "🎤 Starting Boom Karaoke Booking System"
echo "======================================="
echo "🔨 Building application..."

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

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Build the application for production
echo "🏗️ Building for production..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Set PORT environment variable if not set
export PORT=${PORT:-3000}

echo "🚀 Starting production server..."
echo "📍 Server will be available at: http://0.0.0.0:$PORT"
echo "🔑 Demo credentials: demo@example.com / demo123"
echo ""

# Start the production server using Vite preview
npm run preview

