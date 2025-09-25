#!/bin/bash

# Boom Karaoke Booking System - Localhost Startup Script
# Ensures only one instance is running

echo "🚀 Starting Boom Karaoke Booking System - Localhost"
echo "=================================================="

# Kill any existing processes
echo "🛑 Stopping any existing instances..."
pkill -f "node.*server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "vercel dev" 2>/dev/null

# Wait a moment for processes to stop
sleep 2

# Check if any processes are still running
if pgrep -f "node.*server" > /dev/null; then
    echo "⚠️  Warning: Some processes may still be running"
    echo "   You may need to manually stop them"
fi

# Navigate to the project directory
cd "/Users/wingb/Library/Mobile Documents/com~apple~CloudDocs/cursor/Ver alpha scale up/Boom-Booking-Isolate"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🌟 Starting development server..."
echo "   Frontend: http://localhost:3000"
echo "   API: http://localhost:3000/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================================="

# Start the server directly
node server.js
