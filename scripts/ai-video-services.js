/**
 * AI Video Services Integration
 * 
 * This module provides integration with various AI-powered video generation
 * services for creating highlight videos from raw footage.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');

class AIVideoServices {
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 300000, // 5 minutes
      retries: config.retries || 3,
      ...config
    };
    
    this.services = {
      veed: new VEEDService(config.veed),
      kapwing: new KapwingService(config.kapwing),
      pippit: new PippitService(config.pippit),
      googleVids: new GoogleVidsService(config.googleVids),
      heygen: new HeyGenService(config.heygen)
    };
  }

  async generateHighlights(videoPath, feature, options = {}) {
    console.log(`🤖 Generating AI highlights for: ${feature.name}`);
    
    const defaultOptions = {
      duration: 15,
      style: 'professional',
      includeSubtitles: true,
      backgroundMusic: true,
      transitions: true,
      platform: 'general'
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    // Try services in order of preference
    const serviceOrder = ['veed', 'kapwing', 'pippit', 'googleVids', 'heygen'];
    
    for (const serviceName of serviceOrder) {
      const service = this.services[serviceName];
      
      if (!service.isConfigured()) {
        console.log(`⏭️ Skipping ${serviceName} - not configured`);
        continue;
      }
      
      try {
        console.log(`🎬 Using ${serviceName} for highlight generation...`);
        const result = await service.generateHighlights(videoPath, feature, finalOptions);
        
        if (result.success) {
          console.log(`✅ Highlights generated successfully with ${serviceName}`);
          return result;
        }
      } catch (error) {
        console.error(`❌ ${serviceName} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All AI video services failed to generate highlights');
  }
}

class VEEDService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.VEED_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.veed.io/v1';
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async generateHighlights(videoPath, feature, options) {
    const form = new FormData();
    
    // Upload video file
    form.append('file', await fs.readFile(videoPath));
    form.append('title', feature.title);
    form.append('description', feature.description);
    form.append('duration', options.duration);
    form.append('style', options.style);
    form.append('include_subtitles', options.includeSubtitles);
    form.append('background_music', options.backgroundMusic);
    form.append('transitions', options.transitions);
    form.append('platform', options.platform);

    try {
      const response = await axios.post(`${this.baseUrl}/highlights`, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: this.config?.timeout || 300000
      });

      const projectId = response.data.project_id;
      
      // Poll for completion
      const result = await this.pollForCompletion(projectId);
      
      return {
        success: true,
        service: 'veed',
        videoUrl: result.highlight_video_url,
        thumbnailUrl: result.thumbnail_url,
        duration: result.duration,
        fileSize: result.file_size,
        metadata: result.metadata
      };

    } catch (error) {
      throw new Error(`VEED API error: ${error.response?.data?.message || error.message}`);
    }
  }

  async pollForCompletion(projectId, maxAttempts = 30) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.baseUrl}/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        const status = response.data.status;
        
        if (status === 'completed') {
          return response.data;
        } else if (status === 'failed') {
          throw new Error('Video processing failed');
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
        
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    throw new Error('Video processing timeout');
  }
}

class KapwingService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.KAPWING_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.kapwing.com/v1';
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async generateHighlights(videoPath, feature, options) {
    const form = new FormData();
    
    form.append('file', await fs.readFile(videoPath));
    form.append('title', feature.title);
    form.append('target_length', options.duration);
    form.append('style', options.style);
    form.append('auto_subtitles', options.includeSubtitles);
    form.append('background_music', options.backgroundMusic);

    try {
      const response = await axios.post(`${this.baseUrl}/highlight-video`, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: this.config?.timeout || 300000
      });

      const taskId = response.data.task_id;
      
      // Poll for completion
      const result = await this.pollForCompletion(taskId);
      
      return {
        success: true,
        service: 'kapwing',
        videoUrl: result.video_url,
        thumbnailUrl: result.thumbnail_url,
        duration: result.duration,
        highlights: result.highlights
      };

    } catch (error) {
      throw new Error(`Kapwing API error: ${error.response?.data?.message || error.message}`);
    }
  }

  async pollForCompletion(taskId, maxAttempts = 30) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.baseUrl}/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        const status = response.data.status;
        
        if (status === 'completed') {
          return response.data.result;
        } else if (status === 'failed') {
          throw new Error('Video processing failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, 10000));
        
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    throw new Error('Video processing timeout');
  }
}

class PippitService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.PIPPIT_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.pippit.ai/v1';
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async generateHighlights(videoPath, feature, options) {
    const form = new FormData();
    
    form.append('file', await fs.readFile(videoPath));
    form.append('title', feature.title);
    form.append('description', feature.description);
    form.append('target_duration', options.duration);
    form.append('visual_style', options.style);
    form.append('include_voiceover', true);
    form.append('include_effects', options.transitions);

    try {
      const response = await axios.post(`${this.baseUrl}/create-highlight`, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: this.config?.timeout || 300000
      });

      const videoId = response.data.video_id;
      
      // Poll for completion
      const result = await this.pollForCompletion(videoId);
      
      return {
        success: true,
        service: 'pippit',
        videoUrl: result.download_url,
        thumbnailUrl: result.thumbnail_url,
        duration: result.duration,
        script: result.generated_script,
        voiceover: result.voiceover_url
      };

    } catch (error) {
      throw new Error(`Pippit API error: ${error.response?.data?.message || error.message}`);
    }
  }

  async pollForCompletion(videoId, maxAttempts = 30) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.baseUrl}/videos/${videoId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        const status = response.data.status;
        
        if (status === 'ready') {
          return response.data;
        } else if (status === 'failed') {
          throw new Error('Video generation failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, 10000));
        
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    throw new Error('Video generation timeout');
  }
}

class GoogleVidsService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.GOOGLE_VIDS_API_KEY;
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async generateHighlights(videoPath, feature, options) {
    // Google Vids integration would go here
    // This is a placeholder implementation
    
    console.log('📝 Google Vids integration not yet implemented');
    throw new Error('Google Vids service not implemented');
  }
}

class HeyGenService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.HEYGEN_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.heygen.com/v1';
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async generateHighlights(videoPath, feature, options) {
    const form = new FormData();
    
    form.append('video_file', await fs.readFile(videoPath));
    form.append('title', feature.title);
    form.append('description', feature.description);
    form.append('avatar_id', 'default');
    form.append('voice_id', 'default');
    form.append('duration', options.duration);

    try {
      const response = await axios.post(`${this.baseUrl}/video/create`, form, {
        headers: {
          ...form.getHeaders(),
          'X-API-Key': this.apiKey
        },
        timeout: this.config?.timeout || 300000
      });

      const videoId = response.data.video_id;
      
      // Poll for completion
      const result = await this.pollForCompletion(videoId);
      
      return {
        success: true,
        service: 'heygen',
        videoUrl: result.video_url,
        thumbnailUrl: result.thumbnail_url,
        duration: result.duration,
        avatar: result.avatar_used
      };

    } catch (error) {
      throw new Error(`HeyGen API error: ${error.response?.data?.message || error.message}`);
    }
  }

  async pollForCompletion(videoId, maxAttempts = 30) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.baseUrl}/video/${videoId}`, {
          headers: {
            'X-API-Key': this.apiKey
          }
        });

        const status = response.data.status;
        
        if (status === 'completed') {
          return response.data;
        } else if (status === 'failed') {
          throw new Error('Video generation failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, 10000));
        
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    throw new Error('Video generation timeout');
  }
}

// Utility functions for video processing
class VideoUtils {
  static async downloadVideo(videoUrl, outputPath) {
    try {
      const response = await axios.get(videoUrl, { responseType: 'stream' });
      const writer = require('fs').createWriteStream(outputPath);
      
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(outputPath));
        writer.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to download video: ${error.message}`);
    }
  }

  static async optimizeVideo(inputPath, outputPath, options = {}) {
    const ffmpeg = require('fluent-ffmpeg');
    
    const defaultOptions = {
      resolution: '1920x1080',
      fps: 30,
      bitrate: '2000k',
      audioBitrate: '128k',
      format: 'mp4'
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .size(finalOptions.resolution)
        .fps(finalOptions.fps)
        .videoBitrate(finalOptions.bitrate)
        .audioBitrate(finalOptions.audioBitrate)
        .format(finalOptions.format)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .save(outputPath);
    });
  }

  static async createThumbnail(videoPath, outputPath, timestamp = '00:00:05') {
    const ffmpeg = require('fluent-ffmpeg');
    
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '320x180'
        })
        .on('end', () => resolve(outputPath))
        .on('error', reject);
    });
  }
}

module.exports = {
  AIVideoServices,
  VEEDService,
  KapwingService,
  PippitService,
  GoogleVidsService,
  HeyGenService,
  VideoUtils
};
