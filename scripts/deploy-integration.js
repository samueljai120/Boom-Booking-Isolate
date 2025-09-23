#!/usr/bin/env node

/**
 * Deployment Integration Script
 * 
 * This script integrates the automated video generation system
 * with various deployment platforms and CI/CD pipelines.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

class DeploymentIntegration {
  constructor(config = {}) {
    this.config = {
      platforms: {
        netlify: config.netlify || {},
        vercel: config.vercel || {},
        github: config.github || {},
        gitlab: config.gitlab || {},
        aws: config.aws || {},
        docker: config.docker || {}
      },
      ...config
    };
    
    this.deploymentHooks = [];
  }

  async setupNetlifyIntegration() {
    console.log('🌐 Setting up Netlify integration...');
    
    const netlifyConfig = {
      build: {
        command: "npm run build && node scripts/deploy-hook.js",
        publish: "dist"
      },
      functions: {
        "video-generation": {
          runtime: "nodejs18.x",
          handler: "scripts/netlify-function.js"
        }
      },
      redirects: [
        {
          from: "/api/video-generation",
          to: "/.netlify/functions/video-generation",
          status: 200
        }
      ]
    };

    const configPath = path.join(process.cwd(), 'netlify.toml');
    await fs.writeFile(configPath, JSON.stringify(netlifyConfig, null, 2));
    
    // Create Netlify function
    const netlifyFunction = `
const AutomatedVideoGenerator = require('./automated-video-generator');
const { AIVideoServices } = require('./ai-video-services');

exports.handler = async (event, context) => {
  try {
    const generator = new AutomatedVideoGenerator({
      baseUrl: process.env.BOOM_BOOKING_URL || 'https://boom-booking.netlify.app',
      outputDir: '/tmp/demo-videos',
      videoDuration: 30,
      videoQuality: 'high'
    });

    const videoPath = await generator.runFullPipeline();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        videoPath: videoPath,
        message: 'Video generated successfully'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
`;

    const functionPath = path.join(process.cwd(), 'netlify/functions/video-generation.js');
    await fs.mkdir(path.dirname(functionPath), { recursive: true });
    await fs.writeFile(functionPath, netlifyFunction);
    
    console.log('✅ Netlify integration configured');
  }

  async setupVercelIntegration() {
    console.log('▲ Setting up Vercel integration...');
    
    const vercelConfig = {
      version: 2,
      builds: [
        {
          src: "scripts/vercel-function.js",
          use: "@vercel/node"
        }
      ],
      routes: [
        {
          src: "/api/video-generation",
          dest: "/scripts/vercel-function.js"
        }
      ],
      env: {
        BOOM_BOOKING_URL: process.env.BOOM_BOOKING_URL,
        VEED_API_KEY: process.env.VEED_API_KEY,
        KAPWING_API_KEY: process.env.KAPWING_API_KEY,
        PIPPIT_API_KEY: process.env.PIPPIT_API_KEY
      }
    };

    const configPath = path.join(process.cwd(), 'vercel.json');
    await fs.writeFile(configPath, JSON.stringify(vercelConfig, null, 2));
    
    // Create Vercel function
    const vercelFunction = `
const AutomatedVideoGenerator = require('./automated-video-generator');

module.exports = async (req, res) => {
  try {
    const generator = new AutomatedVideoGenerator({
      baseUrl: process.env.BOOM_BOOKING_URL,
      outputDir: '/tmp/demo-videos',
      videoDuration: 30,
      videoQuality: 'high'
    });

    const videoPath = await generator.runFullPipeline();
    
    res.status(200).json({
      success: true,
      videoPath: videoPath,
      message: 'Video generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
`;

    const functionPath = path.join(process.cwd(), 'api/video-generation.js');
    await fs.mkdir(path.dirname(functionPath), { recursive: true });
    await fs.writeFile(functionPath, vercelFunction);
    
    console.log('✅ Vercel integration configured');
  }

  async setupGitHubActions() {
    console.log('🐙 Setting up GitHub Actions...');
    
    const githubWorkflow = `name: Automated Video Generation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM

jobs:
  generate-videos:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        cd scripts
        npm install
    
    - name: Setup Chrome
      uses: browser-actions/setup-chrome@latest
    
    - name: Install FFmpeg
      run: |
        sudo apt-get update
        sudo apt-get install -y ffmpeg
    
    - name: Generate videos
      env:
        BOOM_BOOKING_URL: \${{ secrets.BOOM_BOOKING_URL }}
        VEED_API_KEY: \${{ secrets.VEED_API_KEY }}
        KAPWING_API_KEY: \${{ secrets.KAPWING_API_KEY }}
        PIPPIT_API_KEY: \${{ secrets.PIPPIT_API_KEY }}
        OUTPUT_DIR: ./demo-videos
      run: |
        cd scripts
        npm run generate
    
    - name: Upload videos
      uses: actions/upload-artifact@v3
      with:
        name: demo-videos
        path: scripts/demo-videos/
    
    - name: Deploy to GitHub Pages
      if: github.ref == 'refs/heads/main'
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: scripts/demo-videos/
`;

    const workflowPath = path.join(process.cwd(), '.github/workflows/video-generation.yml');
    await fs.mkdir(path.dirname(workflowPath), { recursive: true });
    await fs.writeFile(workflowPath, githubWorkflow);
    
    console.log('✅ GitHub Actions workflow created');
  }

  async setupDockerIntegration() {
    console.log('🐳 Setting up Docker integration...');
    
    const dockerfile = `
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \\
    chromium \\
    nss \\
    freetype \\
    freetype-dev \\
    harfbuzz \\
    ca-certificates \\
    ttf-freefont \\
    ffmpeg

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \\
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy package files
COPY scripts/package*.json ./scripts/
RUN cd scripts && npm install

# Copy application files
COPY scripts/ ./
COPY dist/ ./dist/

# Create output directory
RUN mkdir -p demo-videos

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Default command
CMD ["node", "automated-video-generator.js", "generate"]
`;

    const dockerPath = path.join(process.cwd(), 'Dockerfile.video-generator');
    await fs.writeFile(dockerPath, dockerfile);
    
    // Create docker-compose configuration
    const dockerCompose = `
version: '3.8'

services:
  video-generator:
    build:
      context: .
      dockerfile: Dockerfile.video-generator
    environment:
      - BOOM_BOOKING_URL=\${BOOM_BOOKING_URL}
      - VEED_API_KEY=\${VEED_API_KEY}
      - KAPWING_API_KEY=\${KAPWING_API_KEY}
      - PIPPIT_API_KEY=\${PIPPIT_API_KEY}
      - OUTPUT_DIR=/app/demo-videos
    volumes:
      - ./demo-videos:/app/demo-videos
    restart: unless-stopped
    
  scheduler:
    build:
      context: .
      dockerfile: Dockerfile.video-generator
    command: ["node", "scheduled-generation.js"]
    environment:
      - BOOM_BOOKING_URL=\${BOOM_BOOKING_URL}
      - VEED_API_KEY=\${VEED_API_KEY}
      - KAPWING_API_KEY=\${KAPWING_API_KEY}
      - PIPPIT_API_KEY=\${PIPPIT_API_KEY}
      - GENERATION_SCHEDULE=\${GENERATION_SCHEDULE:-"0 9 * * 1"}
    volumes:
      - ./demo-videos:/app/demo-videos
    restart: unless-stopped
`;

    const composePath = path.join(process.cwd(), 'docker-compose.video-generator.yml');
    await fs.writeFile(composePath, dockerCompose);
    
    console.log('✅ Docker integration configured');
  }

  async createWebhookEndpoints() {
    console.log('🔗 Creating webhook endpoints...');
    
    const webhookServer = `
const express = require('express');
const AutomatedVideoGenerator = require('./automated-video-generator');
const { AIVideoServices } = require('./ai-video-services');

const app = express();
app.use(express.json());

// Webhook endpoints
app.post('/webhook/deploy', async (req, res) => {
  try {
    console.log('🚀 Deployment webhook triggered');
    
    const generator = new AutomatedVideoGenerator({
      baseUrl: process.env.BOOM_BOOKING_URL,
      outputDir: process.env.OUTPUT_DIR || './demo-videos',
      videoDuration: 30,
      videoQuality: 'high'
    });

    const videoPath = await generator.runFullPipeline();
    
    res.json({
      success: true,
      videoPath: videoPath,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/webhook/schedule', async (req, res) => {
  try {
    const { schedule, feature } = req.body;
    
    console.log('⏰ Scheduled generation webhook triggered');
    
    const generator = new AutomatedVideoGenerator({
      baseUrl: process.env.BOOM_BOOKING_URL,
      outputDir: process.env.OUTPUT_DIR || './demo-videos',
      videoDuration: 30,
      videoQuality: 'high'
    });

    const videoPath = await generator.runFullPipeline();
    
    res.json({
      success: true,
      videoPath: videoPath,
      schedule: schedule,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Scheduled webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log('🎬 Video generation webhook server running on port', port);
});
`;

    const webhookPath = path.join(process.cwd(), 'scripts/webhook-server.js');
    await fs.writeFile(webhookPath, webhookServer);
    
    console.log('✅ Webhook endpoints created');
  }

  async setupNotificationSystem() {
    console.log('📢 Setting up notification system...');
    
    const notificationService = `
const axios = require('axios');

class NotificationService {
  constructor(config = {}) {
    this.config = {
      slack: config.slack || {},
      email: config.email || {},
      webhook: config.webhook || {},
      ...config
    };
  }

  async sendSuccess(videoPath, metadata = {}) {
    const message = {
      title: '✅ Video Generation Successful',
      message: 'New demo videos have been generated successfully!',
      videoPath: videoPath,
      metadata: metadata,
      timestamp: new Date().toISOString()
    };

    await this.sendToAllChannels(message);
  }

  async sendError(error, context = {}) {
    const message = {
      title: '❌ Video Generation Failed',
      message: 'Video generation encountered an error',
      error: error.message,
      context: context,
      timestamp: new Date().toISOString()
    };

    await this.sendToAllChannels(message);
  }

  async sendToAllChannels(message) {
    const promises = [];

    if (this.config.slack.webhookUrl) {
      promises.push(this.sendToSlack(message));
    }

    if (this.config.email.enabled) {
      promises.push(this.sendToEmail(message));
    }

    if (this.config.webhook.url) {
      promises.push(this.sendToWebhook(message));
    }

    await Promise.allSettled(promises);
  }

  async sendToSlack(message) {
    try {
      const payload = {
        text: message.title,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*' + message.title + '*\\n' + message.message
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: 'Timestamp: ' + message.timestamp
              }
            ]
          }
        ]
      };

      await axios.post(this.config.slack.webhookUrl, payload);
    } catch (error) {
      console.error('Slack notification failed:', error);
    }
  }

  async sendToEmail(message) {
    // Email implementation would go here
    console.log('📧 Email notification:', message.title);
  }

  async sendToWebhook(message) {
    try {
      await axios.post(this.config.webhook.url, message, {
        headers: this.config.webhook.headers || {}
      });
    } catch (error) {
      console.error('Webhook notification failed:', error);
    }
  }
}

module.exports = NotificationService;
`;

    const notificationPath = path.join(process.cwd(), 'scripts/notification-service.js');
    await fs.writeFile(notificationPath, notificationService);
    
    console.log('✅ Notification system configured');
  }

  async runFullIntegration() {
    console.log('🚀 Setting up complete deployment integration...');
    
    try {
      await this.setupNetlifyIntegration();
      await this.setupVercelIntegration();
      await this.setupGitHubActions();
      await this.setupDockerIntegration();
      await this.createWebhookEndpoints();
      await this.setupNotificationSystem();
      
      console.log('🎉 Deployment integration completed successfully!');
      console.log('');
      console.log('Integration features:');
      console.log('✅ Netlify functions and build hooks');
      console.log('✅ Vercel API routes and serverless functions');
      console.log('✅ GitHub Actions CI/CD workflow');
      console.log('✅ Docker containerization');
      console.log('✅ Webhook endpoints for external triggers');
      console.log('✅ Multi-channel notification system');
      
    } catch (error) {
      console.error('❌ Integration setup failed:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  const integration = new DeploymentIntegration();
  
  try {
    switch (command) {
      case 'all':
        await integration.runFullIntegration();
        break;
        
      case 'netlify':
        await integration.setupNetlifyIntegration();
        break;
        
      case 'vercel':
        await integration.setupVercelIntegration();
        break;
        
      case 'github':
        await integration.setupGitHubActions();
        break;
        
      case 'docker':
        await integration.setupDockerIntegration();
        break;
        
      case 'webhooks':
        await integration.createWebhookEndpoints();
        break;
        
      case 'notifications':
        await integration.setupNotificationSystem();
        break;
        
      default:
        console.log(`
🔗 Boom Booking Deployment Integration

Usage:
  node deploy-integration.js [command]

Commands:
  all          - Setup all integrations (default)
  netlify      - Setup Netlify integration
  vercel       - Setup Vercel integration
  github       - Setup GitHub Actions
  docker       - Setup Docker integration
  webhooks     - Create webhook endpoints
  notifications - Setup notification system

Examples:
  node deploy-integration.js all
  node deploy-integration.js netlify
  node deploy-integration.js docker
        `);
    }
  } catch (error) {
    console.error('❌ Integration failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DeploymentIntegration;
