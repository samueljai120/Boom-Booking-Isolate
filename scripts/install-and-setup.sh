#!/bin/bash

# Boom Booking Automated Video Generator - Installation Script
# This script sets up the complete automated video generation system

set -e  # Exit on any error

echo "🎬 Boom Booking Automated Video Generator Setup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
else
    print_error "Unsupported operating system: $OSTYPE"
    exit 1
fi

print_info "Detected operating system: $OS"

# Check Node.js version
check_node() {
    print_info "Checking Node.js installation..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
        
        if [ "$NODE_MAJOR" -ge 16 ]; then
            print_status "Node.js $NODE_VERSION is installed"
        else
            print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 16 or higher."
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        exit 1
    fi
}

# Check npm
check_npm() {
    print_info "Checking npm installation..."
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm $NPM_VERSION is installed"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Install system dependencies
install_system_deps() {
    print_info "Installing system dependencies..."
    
    if [ "$OS" == "macOS" ]; then
        # Check if Homebrew is installed
        if command -v brew &> /dev/null; then
            print_info "Installing FFmpeg via Homebrew..."
            brew install ffmpeg || print_warning "FFmpeg installation failed, but continuing..."
        else
            print_warning "Homebrew not found. Please install FFmpeg manually: https://ffmpeg.org/download.html"
        fi
    elif [ "$OS" == "Linux" ]; then
        print_info "Installing FFmpeg via apt-get..."
        sudo apt-get update
        sudo apt-get install -y ffmpeg || print_warning "FFmpeg installation failed, but continuing..."
    fi
}

# Install Node.js dependencies
install_node_deps() {
    print_info "Installing Node.js dependencies..."
    
    cd scripts
    npm install
    
    if [ $? -eq 0 ]; then
        print_status "Node.js dependencies installed successfully"
    else
        print_error "Failed to install Node.js dependencies"
        exit 1
    fi
    
    cd ..
}

# Create environment configuration
setup_environment() {
    print_info "Setting up environment configuration..."
    
    cd scripts
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_status "Created .env file from template"
        else
            # Create basic .env file
            cat > .env << EOF
# Boom Booking Video Generation Configuration
BOOM_BOOKING_URL=http://localhost:3000
OUTPUT_DIR=./demo-videos
VIDEO_DURATION=30
VIDEO_QUALITY=high

# AI Video Services API Keys (get these from the respective services)
VEED_API_KEY=your_veed_api_key_here
KAPWING_API_KEY=your_kapwing_api_key_here
PIPPIT_API_KEY=your_pippit_api_key_here

# Screen Recording Settings
RECORDING_FPS=30
RECORDING_BITRATE=2000k
AUDIO_BITRATE=128k

# Video Processing Settings
OUTPUT_FORMAT=mp4
RESOLUTION=1920x1080
COMPRESSION_LEVEL=medium

# Automation Settings
AUTO_GENERATE_ON_DEPLOY=false
SCHEDULED_GENERATION=false
GENERATION_SCHEDULE="0 9 * * 1"

# Notification Settings
SLACK_WEBHOOK_URL=your_slack_webhook_here
EMAIL_NOTIFICATIONS=false
NOTIFICATION_EMAIL=your_email@example.com
EOF
            print_status "Created .env file with default configuration"
        fi
    else
        print_info ".env file already exists"
    fi
    
    cd ..
}

# Run setup automation
run_setup_automation() {
    print_info "Running automated setup..."
    
    cd scripts
    node setup-automation.js
    
    if [ $? -eq 0 ]; then
        print_status "Automated setup completed successfully"
    else
        print_error "Automated setup failed"
        exit 1
    fi
    
    cd ..
}

# Run tests
run_tests() {
    print_info "Running system tests..."
    
    cd scripts
    node test-automation.js all
    
    if [ $? -eq 0 ]; then
        print_status "All tests passed"
    else
        print_warning "Some tests failed - check the test report for details"
    fi
    
    cd ..
}

# Create output directory
create_output_dir() {
    print_info "Creating output directory..."
    
    mkdir -p scripts/demo-videos
    print_status "Output directory created: scripts/demo-videos"
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Configure your API keys in scripts/.env:"
    echo "   - Get VEED API key: https://www.veed.io"
    echo "   - Get Kapwing API key: https://www.kapwing.com"
    echo "   - Get Pippit API key: https://www.pippit.ai"
    echo ""
    echo "2. Start your Boom Booking application:"
    echo "   npm start"
    echo ""
    echo "3. Generate your first videos:"
    echo "   cd scripts && npm run generate"
    echo ""
    echo "4. Check the generated videos in:"
    echo "   scripts/demo-videos/"
    echo ""
    echo "For more information, see: scripts/README.md"
}

# Main installation process
main() {
    echo "Starting installation process..."
    echo ""
    
    check_node
    check_npm
    install_system_deps
    install_node_deps
    setup_environment
    create_output_dir
    run_setup_automation
    run_tests
    show_next_steps
    
    print_status "Installation completed successfully!"
}

# Run main function
main "$@"
