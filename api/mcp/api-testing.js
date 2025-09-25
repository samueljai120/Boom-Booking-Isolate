#!/usr/bin/env node
// API Testing and Validation MCP Server
// Handles automated API testing, validation, and monitoring

const axios = require('axios');
const jwt = require('jsonwebtoken');

class APITestingMCP {
  constructor() {
    this.baseURL = process.env.VERCEL_URL || 'http://localhost:3000';
    this.testResults = [];
    this.authToken = null;
  }

  // Generate test authentication token
  async generateAuthToken() {
    try {
      const response = await axios.post(`${this.baseURL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'test123'
      });
      this.authToken = response.data.token;
      return this.authToken;
    } catch (error) {
      console.error('Auth token generation failed:', error.message);
      return null;
    }
  }

  // Test API endpoint
  async testEndpoint(endpoint, method = 'GET', data = null, expectedStatus = 200) {
    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (this.authToken) {
      config.headers.Authorization = `Bearer ${this.authToken}`;
    }

    if (data) {
      config.data = data;
    }

    try {
      const startTime = Date.now();
      const response = await axios(config);
      const responseTime = Date.now() - startTime;

      const result = {
        endpoint,
        method,
        status: response.status,
        expectedStatus,
        responseTime,
        success: response.status === expectedStatus,
        timestamp: new Date().toISOString()
      };

      this.testResults.push(result);
      return result;
    } catch (error) {
      const result = {
        endpoint,
        method,
        status: error.response?.status || 0,
        expectedStatus,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      this.testResults.push(result);
      return result;
    }
  }

  // Run comprehensive API test suite
  async runAPITestSuite() {
    console.log('🚀 Starting API Test Suite...');
    
    // Health check
    await this.testEndpoint('/api/health', 'GET', null, 200);
    
    // Authentication tests
    await this.testEndpoint('/api/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'test123'
    }, 200);
    
    // Generate auth token for protected routes
    await this.generateAuthToken();
    
    // Protected route tests
    if (this.authToken) {
      await this.testEndpoint('/api/auth/me', 'GET', null, 200);
      await this.testEndpoint('/api/rooms', 'GET', null, 200);
      await this.testEndpoint('/api/bookings', 'GET', null, 200);
      await this.testEndpoint('/api/business-hours', 'GET', null, 200);
    }

    // Test error handling
    await this.testEndpoint('/api/nonexistent', 'GET', null, 404);
    await this.testEndpoint('/api/auth/login', 'POST', {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    }, 401);

    return this.testResults;
  }

  // Validate API response structure
  validateResponseStructure(response, expectedStructure) {
    const errors = [];
    
    for (const key of expectedStructure) {
      if (!response.hasOwnProperty(key)) {
        errors.push(`Missing required field: ${key}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Performance testing
  async performanceTest(endpoint, iterations = 10) {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const result = await this.testEndpoint(endpoint);
      results.push(result.responseTime);
    }

    const avgResponseTime = results.reduce((a, b) => a + b, 0) / results.length;
    const maxResponseTime = Math.max(...results);
    const minResponseTime = Math.min(...results);

    return {
      endpoint,
      iterations,
      avgResponseTime,
      maxResponseTime,
      minResponseTime,
      results
    };
  }

  // Load testing
  async loadTest(endpoint, concurrentUsers = 10, duration = 30) {
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    const results = [];
    
    const testPromises = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
      const testPromise = this.runContinuousTest(endpoint, endTime);
      testPromises.push(testPromise);
    }
    
    const userResults = await Promise.all(testPromises);
    
    // Aggregate results
    const allResults = userResults.flat();
    const successfulRequests = allResults.filter(r => r.success).length;
    const failedRequests = allResults.length - successfulRequests;
    const avgResponseTime = allResults.reduce((sum, r) => sum + r.responseTime, 0) / allResults.length;
    
    return {
      endpoint,
      concurrentUsers,
      duration,
      totalRequests: allResults.length,
      successfulRequests,
      failedRequests,
      successRate: (successfulRequests / allResults.length) * 100,
      avgResponseTime,
      requestsPerSecond: allResults.length / duration
    };
  }

  // Run continuous test for load testing
  async runContinuousTest(endpoint, endTime) {
    const results = [];
    
    while (Date.now() < endTime) {
      const result = await this.testEndpoint(endpoint);
      results.push(result);
      
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  // Generate test report
  generateTestReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(test => test.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: `${successRate.toFixed(2)}%`
      },
      results: this.testResults,
      timestamp: new Date().toISOString()
    };
  }

  // Test specific booking functionality
  async testBookingFlow() {
    const results = [];
    
    // Test room listing
    const roomsResult = await this.testEndpoint('/api/rooms', 'GET', null, 200);
    results.push(roomsResult);
    
    if (roomsResult.success && roomsResult.data && roomsResult.data.length > 0) {
      const roomId = roomsResult.data[0].id;
      
      // Test booking creation
      const bookingData = {
        room_id: roomId,
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        customer_name: 'Test Customer',
        customer_email: 'test@example.com'
      };
      
      const createResult = await this.testEndpoint('/api/bookings', 'POST', bookingData, 201);
      results.push(createResult);
      
      if (createResult.success && createResult.data && createResult.data.id) {
        const bookingId = createResult.data.id;
        
        // Test booking retrieval
        const getResult = await this.testEndpoint(`/api/bookings/${bookingId}`, 'GET', null, 200);
        results.push(getResult);
        
        // Test booking update
        const updateData = { customer_name: 'Updated Customer' };
        const updateResult = await this.testEndpoint(`/api/bookings/${bookingId}`, 'PUT', updateData, 200);
        results.push(updateResult);
        
        // Test booking cancellation
        const cancelResult = await this.testEndpoint(`/api/bookings/${bookingId}/cancel`, 'PUT', null, 200);
        results.push(cancelResult);
      }
    }
    
    return results;
  }
}

// MCP Server Implementation
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const apiMCP = new APITestingMCP();

const server = new Server(
  {
    name: 'api-testing',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'test_endpoint',
        description: 'Test a specific API endpoint',
        inputSchema: {
          type: 'object',
          properties: {
            endpoint: { type: 'string', description: 'API endpoint to test' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'GET' },
            data: { type: 'object', description: 'Request data for POST/PUT requests' },
            expectedStatus: { type: 'number', default: 200 }
          },
          required: ['endpoint']
        },
      },
      {
        name: 'run_test_suite',
        description: 'Run comprehensive API test suite',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'performance_test',
        description: 'Run performance test on an endpoint',
        inputSchema: {
          type: 'object',
          properties: {
            endpoint: { type: 'string', description: 'API endpoint to test' },
            iterations: { type: 'number', default: 10 }
          },
          required: ['endpoint']
        },
      },
      {
        name: 'load_test',
        description: 'Run load test on an endpoint',
        inputSchema: {
          type: 'object',
          properties: {
            endpoint: { type: 'string', description: 'API endpoint to test' },
            concurrentUsers: { type: 'number', default: 10 },
            duration: { type: 'number', default: 30 }
          },
          required: ['endpoint']
        },
      },
      {
        name: 'test_booking_flow',
        description: 'Test complete booking flow',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'generate_report',
        description: 'Generate test report',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;
    
    switch (name) {
      case 'test_endpoint':
        result = await apiMCP.testEndpoint(args.endpoint, args.method, args.data, args.expectedStatus);
        break;
      case 'run_test_suite':
        result = await apiMCP.runAPITestSuite();
        break;
      case 'performance_test':
        result = await apiMCP.performanceTest(args.endpoint, args.iterations);
        break;
      case 'load_test':
        result = await apiMCP.loadTest(args.endpoint, args.concurrentUsers, args.duration);
        break;
      case 'test_booking_flow':
        result = await apiMCP.testBookingFlow();
        break;
      case 'generate_report':
        result = apiMCP.generateTestReport();
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('API Testing MCP server running on stdio');
}

main().catch(console.error);
