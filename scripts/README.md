# Boom Booking Automated Video Generator

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
   ```bash
   npm run setup
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and settings
   ```

3. **Generate Videos**
   ```bash
   npm run generate
   ```

## Configuration

### Environment Variables

- `BOOM_BOOKING_URL`: Base URL of your application
- `OUTPUT_DIR`: Directory for generated videos
- `VIDEO_DURATION`: Duration per feature in seconds
- `VEED_API_KEY`: API key for VEED AI highlights
- `KAPWING_API_KEY`: API key for Kapwing
- `PIPPIT_API_KEY`: API key for Pippit

### Feature Configuration

Edit `video-config.json` to customize:
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
```bash
# Run scheduled video generation
node scheduled-generation.js
```

### Deployment Integration
```bash
# Generate videos after deployment
node deploy-hook.js
```

## Commands

- `npm run generate`: Generate all feature videos
- `npm run cleanup`: Clean up temporary files
- `npm run test`: Test browser initialization
- `npm run setup`: Complete setup process

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

Add new features by editing `video-config.json`:

```json
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
```

### Custom Video Processing

Extend the `AutomatedVideoGenerator` class to add custom processing:

```javascript
class CustomVideoGenerator extends AutomatedVideoGenerator {
  async customProcessing(videoPath) {
    // Add your custom video processing logic
  }
}
```
