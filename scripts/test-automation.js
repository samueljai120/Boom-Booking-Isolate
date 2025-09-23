#!/usr/bin/env node

/**
 * Test Script for Automated Video Generation System
 * 
 * This script tests the video generation system components
 * to ensure everything is working correctly.
 */

const AutomatedVideoGenerator = require('./automated-video-generator');
const { AIVideoServices } = require('./ai-video-services');
const fs = require('fs').promises;
const path = require('path');

class AutomationTester {
  constructor() {
    this.testResults = {
      browser: false,
      puppeteer: false,
      aiServices: false,
      fileSystem: false,
      videoProcessing: false,
      overall: false
    };
  }

  async testBrowserInitialization() {
    console.log('🧪 Testing browser initialization...');
    
    try {
      const generator = new AutomatedVideoGenerator({
        baseUrl: 'http://localhost:3000',
        outputDir: './test-output',
        videoDuration: 5,
        videoQuality: 'low'
      });

      await generator.initialize();
      await generator.browser.close();
      
      this.testResults.browser = true;
      console.log('✅ Browser initialization test passed');
      return true;
      
    } catch (error) {
      console.log('❌ Browser initialization test failed:', error.message);
      return false;
    }
  }

  async testPuppeteerActions() {
    console.log('🧪 Testing Puppeteer actions...');
    
    try {
      const generator = new AutomatedVideoGenerator({
        baseUrl: 'https://example.com',
        outputDir: './test-output',
        videoDuration: 5
      });

      await generator.initialize();
      
      // Test basic navigation
      await generator.executeAction({ type: 'navigate', url: 'https://example.com' });
      await generator.executeAction({ type: 'wait', duration: 1000 });
      
      await generator.browser.close();
      
      this.testResults.puppeteer = true;
      console.log('✅ Puppeteer actions test passed');
      return true;
      
    } catch (error) {
      console.log('❌ Puppeteer actions test failed:', error.message);
      return false;
    }
  }

  async testAIServices() {
    console.log('🧪 Testing AI services configuration...');
    
    try {
      const aiServices = new AIVideoServices();
      
      // Test service configuration
      const services = ['veed', 'kapwing', 'pippit', 'googleVids', 'heygen'];
      let configuredServices = 0;
      
      for (const serviceName of services) {
        const service = aiServices.services[serviceName];
        if (service.isConfigured()) {
          configuredServices++;
          console.log(`✅ ${serviceName} service is configured`);
        } else {
          console.log(`⏭️ ${serviceName} service is not configured (API key missing)`);
        }
      }
      
      if (configuredServices > 0) {
        this.testResults.aiServices = true;
        console.log(`✅ AI services test passed (${configuredServices}/${services.length} configured)`);
      } else {
        console.log('⚠️ No AI services are configured - add API keys to .env file');
        this.testResults.aiServices = false;
      }
      
      return configuredServices > 0;
      
    } catch (error) {
      console.log('❌ AI services test failed:', error.message);
      return false;
    }
  }

  async testFileSystem() {
    console.log('🧪 Testing file system operations...');
    
    try {
      const testDir = './test-output';
      const testFile = path.join(testDir, 'test.txt');
      
      // Create test directory
      await fs.mkdir(testDir, { recursive: true });
      
      // Write test file
      await fs.writeFile(testFile, 'Test content');
      
      // Read test file
      const content = await fs.readFile(testFile, 'utf8');
      
      // Clean up
      await fs.unlink(testFile);
      await fs.rmdir(testDir);
      
      if (content === 'Test content') {
        this.testResults.fileSystem = true;
        console.log('✅ File system test passed');
        return true;
      } else {
        throw new Error('File content mismatch');
      }
      
    } catch (error) {
      console.log('❌ File system test failed:', error.message);
      return false;
    }
  }

  async testVideoProcessing() {
    console.log('🧪 Testing video processing capabilities...');
    
    try {
      // Check if FFmpeg is available
      const { execSync } = require('child_process');
      execSync('ffmpeg -version', { stdio: 'pipe' });
      
      this.testResults.videoProcessing = true;
      console.log('✅ Video processing test passed (FFmpeg available)');
      return true;
      
    } catch (error) {
      console.log('❌ Video processing test failed:', error.message);
      console.log('💡 Install FFmpeg: brew install ffmpeg (macOS) or apt-get install ffmpeg (Ubuntu)');
      return false;
    }
  }

  async testEnvironmentConfiguration() {
    console.log('🧪 Testing environment configuration...');
    
    const requiredEnvVars = [
      'BOOM_BOOKING_URL',
      'OUTPUT_DIR',
      'VIDEO_DURATION'
    ];
    
    const optionalEnvVars = [
      'VEED_API_KEY',
      'KAPWING_API_KEY',
      'PIPPIT_API_KEY'
    ];
    
    let configured = 0;
    
    // Check required variables
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar} is configured`);
        configured++;
      } else {
        console.log(`❌ ${envVar} is not configured`);
      }
    }
    
    // Check optional variables
    for (const envVar of optionalEnvVars) {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar} is configured`);
        configured++;
      } else {
        console.log(`⏭️ ${envVar} is not configured (optional)`);
      }
    }
    
    const requiredConfigured = requiredEnvVars.every(envVar => process.env[envVar]);
    
    if (requiredConfigured) {
      console.log('✅ Environment configuration test passed');
      return true;
    } else {
      console.log('❌ Environment configuration test failed - missing required variables');
      return false;
    }
  }

  async testFeatureConfiguration() {
    console.log('🧪 Testing feature configuration...');
    
    try {
      const configPath = path.join(__dirname, 'video-config.json');
      const configExists = await fs.access(configPath).then(() => true).catch(() => false);
      
      if (configExists) {
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        
        if (config.features && Array.isArray(config.features) && config.features.length > 0) {
          console.log(`✅ Feature configuration test passed (${config.features.length} features configured)`);
          return true;
        } else {
          console.log('❌ Feature configuration test failed - no features configured');
          return false;
        }
      } else {
        console.log('❌ Feature configuration test failed - video-config.json not found');
        console.log('💡 Run: node setup-automation.js to create configuration files');
        return false;
      }
      
    } catch (error) {
      console.log('❌ Feature configuration test failed:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🧪 Running automated video generation system tests...');
    console.log('=' * 60);
    
    const tests = [
      { name: 'Environment Configuration', fn: () => this.testEnvironmentConfiguration() },
      { name: 'File System', fn: () => this.testFileSystem() },
      { name: 'Video Processing', fn: () => this.testVideoProcessing() },
      { name: 'Feature Configuration', fn: () => this.testFeatureConfiguration() },
      { name: 'AI Services', fn: () => this.testAIServices() },
      { name: 'Browser Initialization', fn: () => this.testBrowserInitialization() },
      { name: 'Puppeteer Actions', fn: () => this.testPuppeteerActions() }
    ];
    
    let passedTests = 0;
    
    for (const test of tests) {
      console.log(`\n📋 ${test.name}:`);
      try {
        const result = await test.fn();
        if (result) {
          passedTests++;
        }
      } catch (error) {
        console.log(`❌ ${test.name} failed with error:`, error.message);
      }
    }
    
    console.log('\n' + '=' * 60);
    console.log(`📊 Test Results: ${passedTests}/${tests.length} tests passed`);
    
    if (passedTests === tests.length) {
      console.log('🎉 All tests passed! System is ready for video generation.');
      this.testResults.overall = true;
    } else {
      console.log('⚠️ Some tests failed. Please fix the issues before generating videos.');
      this.testResults.overall = false;
    }
    
    // Generate test report
    await this.generateTestReport();
    
    return this.testResults.overall;
  }

  async generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(__dirname, 'test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Test report saved to: ${reportPath}`);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (!this.testResults.browser) {
      recommendations.push({
        issue: 'Browser initialization failed',
        solution: 'Install Chrome/Chromium and ensure Puppeteer dependencies are installed',
        command: 'npm install puppeteer'
      });
    }
    
    if (!this.testResults.videoProcessing) {
      recommendations.push({
        issue: 'Video processing capabilities missing',
        solution: 'Install FFmpeg for video processing',
        command: 'brew install ffmpeg (macOS) or sudo apt-get install ffmpeg (Ubuntu)'
      });
    }
    
    if (!this.testResults.aiServices) {
      recommendations.push({
        issue: 'No AI services configured',
        solution: 'Add API keys to .env file for VEED, Kapwing, or Pippit',
        command: 'cp .env.example .env && edit .env with your API keys'
      });
    }
    
    if (!process.env.BOOM_BOOKING_URL) {
      recommendations.push({
        issue: 'Application URL not configured',
        solution: 'Set BOOM_BOOKING_URL in .env file',
        command: 'echo "BOOM_BOOKING_URL=http://localhost:3000" >> .env'
      });
    }
    
    return recommendations;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';
  
  const tester = new AutomationTester();
  
  try {
    switch (testType) {
      case 'all':
        const success = await tester.runAllTests();
        process.exit(success ? 0 : 1);
        break;
        
      case 'browser':
        await tester.testBrowserInitialization();
        break;
        
      case 'ai':
        await tester.testAIServices();
        break;
        
      case 'filesystem':
        await tester.testFileSystem();
        break;
        
      case 'video':
        await tester.testVideoProcessing();
        break;
        
      case 'config':
        await tester.testEnvironmentConfiguration();
        await tester.testFeatureConfiguration();
        break;
        
      default:
        console.log(`
🧪 Boom Booking Video Generation Test Suite

Usage:
  node test-automation.js [test-type]

Test Types:
  all        - Run all tests (default)
  browser    - Test browser initialization
  ai         - Test AI services configuration
  filesystem - Test file system operations
  video      - Test video processing capabilities
  config     - Test environment and feature configuration

Examples:
  node test-automation.js all
  node test-automation.js browser
  node test-automation.js config
        `);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AutomationTester;
