#!/bin/bash

# Boom Karaoke Frontend - Standalone Start Script
echo "🎤 Starting Boom Karaoke Frontend (Standalone)"
echo "=============================================="

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

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

echo "🚀 Starting development server..."
echo "📍 Frontend will be available at: http://localhost:3000"
echo "🔑 Demo credentials: demo@example.com / demo123"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev

