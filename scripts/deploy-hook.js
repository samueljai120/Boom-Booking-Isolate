#!/usr/bin/env node

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
