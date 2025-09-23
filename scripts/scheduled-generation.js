#!/usr/bin/env node

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
