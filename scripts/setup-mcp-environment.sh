#!/bin/bash
# MCP Environment Setup Script
# Sets up the complete MCP automation environment

echo "🤖 Setting up MCP Automation Environment for Boom Karaoke Booking System"
echo "========================================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp env.template .env.local
    echo "📝 Please update .env.local with your actual values"
fi

# Check required environment variables
echo "🔍 Checking environment variables..."

REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "VERCEL_URL" "VERCEL_TOKEN" "GITHUB_TOKEN")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "⚠️  Missing environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo "📝 Please set these variables in your .env.local file or export them"
fi

# Create MCP migrations directory
echo "📁 Creating MCP migrations directory..."
mkdir -p api/mcp/migrations

# Make MCP scripts executable
echo "🔧 Making MCP scripts executable..."
chmod +x api/mcp/*.js
chmod +x scripts/test-mcp-automation.js

# Test MCP configuration
echo "🧪 Testing MCP configuration..."
if [ -f "/Users/wingb/.cursor/mcp.json" ]; then
    echo "✅ MCP configuration file found"
else
    echo "❌ MCP configuration file not found at /Users/wingb/.cursor/mcp.json"
    echo "📝 Please ensure the MCP configuration is properly set up"
fi

# Test database connection
echo "🗄️  Testing database connection..."
if [ -n "$DATABASE_URL" ]; then
    node -e "
    const { neon } = require('@neondatabase/serverless');
    const db = neon(process.env.DATABASE_URL);
    db\`SELECT 1 as test\`.then(() => {
        console.log('✅ Database connection successful');
        process.exit(0);
    }).catch(err => {
        console.log('❌ Database connection failed:', err.message);
        process.exit(1);
    });
    " 2>/dev/null
else
    echo "⚠️  DATABASE_URL not set, skipping database test"
fi

# Test Vercel connection
echo "🚀 Testing Vercel connection..."
if [ -n "$VERCEL_TOKEN" ]; then
    if command -v vercel &> /dev/null; then
        vercel whoami &>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Vercel connection successful"
        else
            echo "⚠️  Vercel connection failed. Please check your VERCEL_TOKEN"
        fi
    else
        echo "⚠️  Vercel CLI not installed. Please install with: npm install -g vercel"
    fi
else
    echo "⚠️  VERCEL_TOKEN not set, skipping Vercel test"
fi

# Run MCP test suite
echo "🧪 Running MCP test suite..."
if [ -f "scripts/test-mcp-automation.js" ]; then
    node scripts/test-mcp-automation.js
    if [ $? -eq 0 ]; then
        echo "✅ MCP test suite completed successfully"
    else
        echo "⚠️  MCP test suite had issues. Check the output above"
    fi
else
    echo "❌ MCP test script not found"
fi

echo ""
echo "🎉 MCP Environment Setup Complete!"
echo "=================================="
echo ""
echo "📋 Next Steps:"
echo "1. Update .env.local with your actual values"
echo "2. Test individual MCP servers:"
echo "   - node api/mcp/database-automation.js"
echo "   - node api/mcp/api-testing.js"
echo "   - node api/mcp/deployment-automation.js"
echo "   - node api/mcp/business-intelligence.js"
echo "   - node api/mcp/security-monitoring.js"
echo "   - node api/mcp/mcp-orchestrator.js"
echo "3. Run the complete test suite:"
echo "   - node scripts/test-mcp-automation.js"
echo ""
echo "📚 Documentation:"
echo "   - docs/mcp/README.md"
echo "   - docs/mcp/MCP_IMPLEMENTATION_GUIDE.md"
echo ""
echo "🚀 Happy Automating!"
