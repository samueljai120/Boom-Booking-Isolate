#!/usr/bin/env node

/**
 * Setup Script for Automated Video Generation System
 * 
 * This script sets up the complete automation environment for
 * generating calendar feature highlight videos.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

class AutomationSetup {
  constructor() {
    this.scriptsDir = __dirname;
    this.projectRoot = path.join(this.scriptsDir, '..');
    this.config = {
      services: {
        veed: {
          name: 'VEED AI Highlights',
          url: 'https://www.veed.io',
          apiEndpoint: 'https://api.veed.io/v1',
          features: ['AI highlight generation', 'Auto-editing', 'Multiple formats']
        },
        kapwing: {
          name: 'Kapwing AI Video Highlight Maker',
          url: 'https://www.kapwing.com',
          apiEndpoint: 'https://api.kapwing.com/v1',
          features: ['Auto-scan footage', 'Shareable clips', 'Social media optimization']
        },
        pippit: {
          name: 'Pippit Highlight Video Maker',
          url: 'https://www.pippit.ai',
          apiEndpoint: 'https://api.pippit.ai/v1',
          features: ['AI visuals', 'Effects', 'Voiceovers']
        },
        obs: {
          name: 'OBS Studio',
          url: 'https://obsproject.com',
          features: ['Screen recording', 'Streaming', 'Video mixing']
        },
        ffmpeg: {
          name: 'FFmpeg',
          url: 'https://ffmpeg.org',
          features: ['Video processing', 'Format conversion', 'Effects']
        }
      }
    };
  }

  async checkSystemRequirements() {
    console.log('🔍 Checking system requirements...');
    
    const requirements = {
      node: { command: 'node --version', minVersion: '16.0.0' },
      npm: { command: 'npm --version', minVersion: '8.0.0' },
      ffmpeg: { command: 'ffmpeg -version', minVersion: '4.0.0' },
      puppeteer: { command: 'npx puppeteer --version', minVersion: '21.0.0' }
    };
    
    const results = {};
    
    for (const [tool, req] of Object.entries(requirements)) {
      try {
        const output = execSync(req.command, { encoding: 'utf8', timeout: 5000 });
        results[tool] = { installed: true, output: output.trim() };
        console.log(`✅ ${tool}: ${output.trim().split('\n')[0]}`);
      } catch (error) {
        results[tool] = { installed: false, error: error.message };
        console.log(`❌ ${tool}: Not installed or not accessible`);
      }
    }
    
    return results;
  }

  async installDependencies() {
    console.log('📦 Installing dependencies...');
    
    try {
      // Install Node.js dependencies
      execSync('npm install', { 
        cwd: this.scriptsDir, 
        stdio: 'inherit' 
      });
      
      // Install system dependencies (macOS)
      if (process.platform === 'darwin') {
        console.log('🍎 Installing macOS dependencies...');
        try {
          execSync('brew install ffmpeg', { stdio: 'inherit' });
        } catch (error) {
          console.warn('⚠️ Could not install FFmpeg via Homebrew. Please install manually.');
        }
      }
      
      console.log('✅ Dependencies installed successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Error installing dependencies:', error.message);
      return false;
    }
  }

  async createEnvironmentConfig() {
    console.log('⚙️ Creating environment configuration...');
    
    const envTemplate = `# Boom Booking Video Generation Configuration
# Copy this to .env and fill in your API keys

# Application Settings
BOOM_BOOKING_URL=http://localhost:3000
OUTPUT_DIR=./demo-videos
VIDEO_DURATION=30
VIDEO_QUALITY=high

# AI Video Services API Keys
# Get your API keys from the respective services
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
GENERATION_SCHEDULE="0 9 * * 1"  # Every Monday at 9 AM

# Notification Settings
SLACK_WEBHOOK_URL=your_slack_webhook_here
EMAIL_NOTIFICATIONS=false
NOTIFICATION_EMAIL=your_email@example.com
`;

    const envPath = path.join(this.scriptsDir, '.env.example');
    await fs.writeFile(envPath, envTemplate);
    
    console.log(`✅ Environment template created: ${envPath}`);
    console.log('📝 Please copy .env.example to .env and configure your API keys');
  }

  async createFeatureConfig() {
    console.log('🎬 Creating feature configuration...');
    
    const featureConfig = {
      features: [
        {
          name: 'smart-booking-system',
          title: 'Smart Booking System',
          description: 'Intuitive calendar interface with real-time availability and conflict detection',
          priority: 1,
          actions: [
            { type: 'navigate', url: '/dashboard' },
            { type: 'wait', duration: 2000 },
            { type: 'click', selector: '[data-testid="calendar-view"]' },
            { type: 'wait', duration: 1000 },
            { type: 'click', selector: '[data-testid="new-booking"]' },
            { type: 'wait', duration: 2000 },
            { type: 'fill', selector: '[data-testid="customer-name"]', value: 'John Smith' },
            { type: 'select', selector: '[data-testid="room-select"]', value: 'Room A' },
            { type: 'click', selector: '[data-testid="save-booking"]' },
            { type: 'wait', duration: 3000 }
          ]
        },
        {
          name: 'multi-user-management',
          title: 'Multi-User Management',
          description: 'Role-based access control for staff, managers, and administrators',
          priority: 2,
          actions: [
            { type: 'navigate', url: '/dashboard' },
            { type: 'wait', duration: 2000 },
            { type: 'click', selector: '[data-testid="users-menu"]' },
            { type: 'wait', duration: 1000 },
            { type: 'click', selector: '[data-testid="add-user"]' },
            { type: 'fill', selector: '[data-testid="user-name"]', value: 'Sarah Manager' },
            { type: 'select', selector: '[data-testid="user-role"]', value: 'manager' },
            { type: 'click', selector: '[data-testid="save-user"]' },
            { type: 'wait', duration: 2000 }
          ]
        },
        {
          name: 'analytics-reports',
          title: 'Analytics & Reports',
          description: 'Comprehensive insights into booking patterns and revenue optimization',
          priority: 3,
          actions: [
            { type: 'navigate', url: '/dashboard' },
            { type: 'wait', duration: 2000 },
            { type: 'click', selector: '[data-testid="analytics-tab"]' },
            { type: 'wait', duration: 2000 },
            { type: 'click', selector: '[data-testid="revenue-chart"]' },
            { type: 'wait', duration: 1500 },
            { type: 'click', selector: '[data-testid="booking-trends"]' },
            { type: 'wait', duration: 2000 }
          ]
        },
        {
          name: 'mobile-optimized',
          title: 'Mobile Optimized',
          description: 'Responsive design that works perfectly on all devices and screen sizes',
          priority: 4,
          actions: [
            { type: 'navigate', url: '/dashboard' },
            { type: 'wait', duration: 2000 },
            { type: 'setViewport', width: 375, height: 667 },
            { type: 'wait', duration: 1000 },
            { type: 'click', selector: '[data-testid="mobile-menu"]' },
            { type: 'wait', duration: 1000 },
            { type: 'click', selector: '[data-testid="mobile-bookings"]' },
            { type: 'wait', duration: 2000 }
          ]
        },
        {
          name: 'enterprise-security',
          title: 'Enterprise Security',
          description: 'Bank-level security with data encryption and secure authentication',
          priority: 5,
          actions: [
            { type: 'navigate', url: '/dashboard' },
            { type: 'wait', duration: 2000 },
            { type: 'click', selector: '[data-testid="settings-menu"]' },
            { type: 'wait', duration: 1000 },
            { type: 'click', selector: '[data-testid="security-tab"]' },
            { type: 'wait', duration: 2000 },
            { type: 'click', selector: '[data-testid="two-factor-auth"]' },
            { type: 'wait', duration: 1500 }
          ]
        },
        {
          name: 'lightning-fast',
          title: 'Lightning Fast',
          description: 'Optimized performance with sub-second response times and real-time updates',
          priority: 6,
          actions: [
            { type: 'navigate', url: '/dashboard' },
            { type: 'wait', duration: 1000 },
            { type: 'click', selector: '[data-testid="refresh-data"]' },
            { type: 'wait', duration: 500 },
            { type: 'click', selector: '[data-testid="search-bookings"]' },
            { type: 'type', selector: '[data-testid="search-input"]', value: 'test' },
            { type: 'wait', duration: 1000 }
          ]
        }
      ],
      videoSettings: {
        resolution: '1920x1080',
        fps: 30,
        duration: 30,
        format: 'mp4',
        quality: 'high',
        compression: 'medium'
      },
      aiServices: {
        primary: 'veed',
        fallback: 'kapwing',
        settings: {
          highlightDuration: 15,
          autoTransitions: true,
          backgroundMusic: true,
          subtitles: true
        }
      }
    };

    const configPath = path.join(this.scriptsDir, 'video-config.json');
    await fs.writeFile(configPath, JSON.stringify(featureConfig, null, 2));
    
    console.log(`✅ Feature configuration created: ${configPath}`);
  }

  async createAutomationScripts() {
    console.log('🤖 Creating automation scripts...');
    
    // Create scheduled generation script
    const scheduledScript = `#!/usr/bin/env node

/**
 * Scheduled Video Generation Script
 * Runs automated video generation on a schedule
 */

const cron = require('node-cron');
const AutomatedVideoGenerator = require('./automated-video-generator');
require('dotenv').config();

// Schedule video generation (default: every Monday at 9 AM)
const schedule = process.env.GENERATION_SCHEDULE || '0 9 * * 1';

console.log('📅 Setting up scheduled video generation...');
console.log('Schedule:', schedule);

const generator = new AutomatedVideoGenerator({
  baseUrl: process.env.BOOM_BOOKING_URL,
  outputDir: process.env.OUTPUT_DIR,
  videoDuration: parseInt(process.env.VIDEO_DURATION),
  videoQuality: process.env.VIDEO_QUALITY
});

cron.schedule(schedule, async () => {
  console.log('🎬 Starting scheduled video generation...');
  
  try {
    const videoPath = await generator.runFullPipeline();
    console.log('✅ Scheduled video generation completed:', videoPath);
    
    // Send notification if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      await sendSlackNotification('✅ Video generation completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Scheduled video generation failed:', error);
    
    if (process.env.SLACK_WEBHOOK_URL) {
      await sendSlackNotification('❌ Video generation failed: ' + error.message);
    }
  }
});

async function sendSlackNotification(message) {
  const axios = require('axios');
  
  try {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: message,
      username: 'Boom Booking Bot',
      icon_emoji: ':video_camera:'
    });
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
}

console.log('✅ Scheduled video generation is active');
`;

    const scheduledPath = path.join(this.scriptsDir, 'scheduled-generation.js');
    await fs.writeFile(scheduledPath, scheduledScript);
    
    // Create deployment hook script
    const deployScript = `#!/usr/bin/env node

/**
 * Deployment Hook Script
 * Automatically generates videos when deployed
 */

const AutomatedVideoGenerator = require('./automated-video-generator');
require('dotenv').config();

async function generateOnDeploy() {
  if (process.env.AUTO_GENERATE_ON_DEPLOY !== 'true') {
    console.log('⏭️ Auto-generation on deploy is disabled');
    return;
  }
  
  console.log('🚀 Generating videos after deployment...');
  
  const generator = new AutomatedVideoGenerator({
    baseUrl: process.env.BOOM_BOOKING_URL,
    outputDir: process.env.OUTPUT_DIR,
    videoDuration: parseInt(process.env.VIDEO_DURATION),
    videoQuality: process.env.VIDEO_QUALITY
  });
  
  try {
    const videoPath = await generator.runFullPipeline();
    console.log('✅ Post-deployment video generation completed:', videoPath);
  } catch (error) {
    console.error('❌ Post-deployment video generation failed:', error);
  }
}

generateOnDeploy();
`;

    const deployPath = path.join(this.scriptsDir, 'deploy-hook.js');
    await fs.writeFile(deployPath, deployScript);
    
    console.log('✅ Automation scripts created');
  }

  async createDocumentation() {
    console.log('📚 Creating documentation...');
    
    const readme = `# Boom Booking Automated Video Generator

## Overview

This system automatically generates highlight videos showcasing the features of the Boom Booking calendar application. It uses AI-powered tools to create professional videos with minimal manual intervention.

## Features

- 🤖 **AI-Powered Video Generation**: Uses VEED, Kapwing, and Pippit for automatic highlight creation
- 🎬 **Automated Screen Recording**: Captures application interactions using Puppeteer
- 📱 **Multi-Platform Support**: Generates videos optimized for different platforms
- ⏰ **Scheduled Generation**: Automatic video creation on a schedule
- 🔄 **Deployment Integration**: Auto-generates videos after deployments
- 📊 **Multiple Formats**: Creates videos in various formats and resolutions

## Quick Start

1. **Install Dependencies**
   \`\`\`bash
   npm run setup
   \`\`\`

2. **Configure Environment**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your API keys and settings
   \`\`\`

3. **Generate Videos**
   \`\`\`bash
   npm run generate
   \`\`\`

## Configuration

### Environment Variables

- \`BOOM_BOOKING_URL\`: Base URL of your application
- \`OUTPUT_DIR\`: Directory for generated videos
- \`VIDEO_DURATION\`: Duration per feature in seconds
- \`VEED_API_KEY\`: API key for VEED AI highlights
- \`KAPWING_API_KEY\`: API key for Kapwing
- \`PIPPIT_API_KEY\`: API key for Pippit

### Feature Configuration

Edit \`video-config.json\` to customize:
- Feature definitions and actions
- Video settings (resolution, quality, etc.)
- AI service preferences
- Automation schedules

## AI Services Integration

### VEED AI Highlights
- **Features**: Auto-highlight generation, professional editing
- **API**: https://api.veed.io/v1
- **Setup**: Get API key from VEED dashboard

### Kapwing AI Video Highlight Maker
- **Features**: Auto-scan footage, social media optimization
- **API**: https://api.kapwing.com/v1
- **Setup**: Get API key from Kapwing dashboard

### Pippit Highlight Video Maker
- **Features**: AI visuals, effects, voiceovers
- **API**: https://api.pippit.ai/v1
- **Setup**: Get API key from Pippit dashboard

## Automation Options

### Scheduled Generation
\`\`\`bash
# Run scheduled video generation
node scheduled-generation.js
\`\`\`

### Deployment Integration
\`\`\`bash
# Generate videos after deployment
node deploy-hook.js
\`\`\`

## Commands

- \`npm run generate\`: Generate all feature videos
- \`npm run cleanup\`: Clean up temporary files
- \`npm run test\`: Test browser initialization
- \`npm run setup\`: Complete setup process

## Troubleshooting

### Common Issues

1. **Browser Launch Fails**
   - Ensure Chrome/Chromium is installed
   - Check Puppeteer dependencies

2. **API Key Errors**
   - Verify API keys in .env file
   - Check service-specific documentation

3. **Video Generation Fails**
   - Ensure FFmpeg is installed
   - Check disk space and permissions

### Support

For issues and questions:
- Check the logs in the output directory
- Verify all dependencies are installed
- Ensure API keys are valid and have sufficient credits

## Advanced Usage

### Custom Feature Actions

Add new features by editing \`video-config.json\`:

\`\`\`json
{
  "name": "custom-feature",
  "title": "Custom Feature",
  "description": "Description of the feature",
  "actions": [
    { "type": "navigate", "url": "/custom-page" },
    { "type": "wait", "duration": 2000 },
    { "type": "click", "selector": "[data-testid='custom-button']" }
  ]
}
\`\`\`

### Custom Video Processing

Extend the \`AutomatedVideoGenerator\` class to add custom processing:

\`\`\`javascript
class CustomVideoGenerator extends AutomatedVideoGenerator {
  async customProcessing(videoPath) {
    // Add your custom video processing logic
  }
}
\`\`\`
`;

    const readmePath = path.join(this.scriptsDir, 'README.md');
    await fs.writeFile(readmePath, readme);
    
    console.log('✅ Documentation created');
  }

  async runFullSetup() {
    console.log('🚀 Starting complete automation setup...');
    
    try {
      // Check system requirements
      const requirements = await this.checkSystemRequirements();
      
      // Install dependencies
      const depsInstalled = await this.installDependencies();
      if (!depsInstalled) {
        throw new Error('Failed to install dependencies');
      }
      
      // Create configuration files
      await this.createEnvironmentConfig();
      await this.createFeatureConfig();
      
      // Create automation scripts
      await this.createAutomationScripts();
      
      // Create documentation
      await this.createDocumentation();
      
      console.log('🎉 Setup completed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Copy .env.example to .env and configure your API keys');
      console.log('2. Run: npm run generate');
      console.log('3. Check the demo-videos directory for generated videos');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const setup = new AutomationSetup();
  
  try {
    await setup.runFullSetup();
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AutomationSetup;
