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

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Build the application
echo "🔨 Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build application"
    exit 1
fi

# Start the preview server
echo "🚀 Starting production server..."
echo "📍 Application will be available at the Railway URL"
echo ""

# Use Railway's PORT environment variable
npm run preview
