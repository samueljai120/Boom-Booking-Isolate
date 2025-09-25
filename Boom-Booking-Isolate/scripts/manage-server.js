#!/usr/bin/env node

/**
 * Server Management Script
 * 
 * Handles server lifecycle with proper port management,
 * process monitoring, and graceful shutdown procedures.
 */

import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const SERVER_PORT = 3001;
const SERVER_FILE = 'server-local.js';
const PID_FILE = '.server.pid';

class ServerManager {
  constructor() {
    this.serverProcess = null;
    this.isShuttingDown = false;
  }

  /**
   * Check if port is available
   */
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      exec(`lsof -ti:${port}`, (error, stdout) => {
        resolve(stdout.trim() === '');
      });
    });
  }

  /**
   * Kill process on specific port
   */
  async killProcessOnPort(port) {
    return new Promise((resolve) => {
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (stdout.trim()) {
          const pids = stdout.trim().split('\n');
          console.log(`🔪 Killing processes on port ${port}: ${pids.join(', ')}`);
          
          pids.forEach(pid => {
            exec(`kill -9 ${pid}`, (killError) => {
              if (killError) {
                console.warn(`⚠️  Could not kill process ${pid}: ${killError.message}`);
              } else {
                console.log(`✅ Killed process ${pid}`);
              }
            });
          });
        }
        resolve();
      });
    });
  }

  /**
   * Start server with proper error handling
   */
  async startServer() {
    try {
      // Check if port is available
      const portAvailable = await this.isPortAvailable(SERVER_PORT);
      
      if (!portAvailable) {
        console.log(`🚨 Port ${SERVER_PORT} is in use. Cleaning up...`);
        await this.killProcessOnPort(SERVER_PORT);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }

      // Verify port is now available
      const portNowAvailable = await this.isPortAvailable(SERVER_PORT);
      if (!portNowAvailable) {
        throw new Error(`Port ${SERVER_PORT} is still in use after cleanup`);
      }

      console.log(`🚀 Starting server on port ${SERVER_PORT}...`);
      
      // Start server process
      this.serverProcess = spawn('node', [SERVER_FILE], {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      // Save PID
      if (this.serverProcess.pid) {
        fs.writeFileSync(PID_FILE, this.serverProcess.pid.toString());
        console.log(`📝 Server PID: ${this.serverProcess.pid}`);
      }

      // Handle server events
      this.serverProcess.on('error', (error) => {
        console.error(`❌ Server error: ${error.message}`);
        this.cleanup();
      });

      this.serverProcess.on('exit', (code, signal) => {
        console.log(`🛑 Server exited with code ${code}, signal ${signal}`);
        this.cleanup();
      });

      // Setup graceful shutdown
      process.on('SIGINT', () => this.gracefulShutdown());
      process.on('SIGTERM', () => this.gracefulShutdown());

      console.log(`✅ Server started successfully on port ${SERVER_PORT}`);
      console.log(`🌐 Server URL: http://localhost:${SERVER_PORT}`);
      console.log(`🏥 Health check: http://localhost:${SERVER_PORT}/api/health`);
      
      return true;

    } catch (error) {
      console.error(`❌ Failed to start server: ${error.message}`);
      return false;
    }
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log('\n🛑 Graceful shutdown initiated...');

    if (this.serverProcess) {
      console.log('📤 Sending SIGTERM to server...');
      this.serverProcess.kill('SIGTERM');

      // Wait for graceful shutdown
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          console.log('⚡ Force killing server...');
          this.serverProcess.kill('SIGKILL');
        }
        this.cleanup();
      }, 5000);
    } else {
      this.cleanup();
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Remove PID file
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }

    console.log('🧹 Cleanup completed');
    process.exit(0);
  }

  /**
   * Stop server
   */
  async stopServer() {
    console.log('🛑 Stopping server...');
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }

    // Also kill any processes on the port
    await this.killProcessOnPort(SERVER_PORT);
    
    this.cleanup();
  }

  /**
   * Restart server
   */
  async restartServer() {
    console.log('🔄 Restarting server...');
    await this.stopServer();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.startServer();
  }

  /**
   * Get server status
   */
  async getStatus() {
    const portAvailable = await this.isPortAvailable(SERVER_PORT);
    const pidFileExists = fs.existsSync(PID_FILE);
    
    return {
      port: SERVER_PORT,
      portAvailable,
      pidFileExists,
      pid: pidFileExists ? fs.readFileSync(PID_FILE, 'utf8').trim() : null
    };
  }
}

// CLI interface
const manager = new ServerManager();
const command = process.argv[2];

switch (command) {
  case 'start':
    manager.startServer();
    break;
  case 'stop':
    manager.stopServer();
    break;
  case 'restart':
    manager.restartServer();
    break;
  case 'status':
    manager.getStatus().then(status => {
      console.log('📊 Server Status:');
      console.log(`   Port: ${status.port}`);
      console.log(`   Port Available: ${status.portAvailable ? '✅' : '❌'}`);
      console.log(`   PID File: ${status.pidFileExists ? '✅' : '❌'}`);
      console.log(`   PID: ${status.pid || 'N/A'}`);
    });
    break;
  default:
    console.log('🎛️  Server Manager');
    console.log('Usage: node scripts/manage-server.js [start|stop|restart|status]');
    console.log('');
    console.log('Commands:');
    console.log('  start   - Start the server');
    console.log('  stop    - Stop the server');
    console.log('  restart - Restart the server');
    console.log('  status  - Check server status');
    break;
}
