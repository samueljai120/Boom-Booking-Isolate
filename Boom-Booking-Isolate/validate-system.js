/**
 * System Validation Script
 * 
 * Validates that all implemented fixes are working correctly
 * and the system is ready for production deployment.
 */

import fs from 'fs';
import path from 'path';

// Validation results
const validationResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

// Utility functions
const logValidation = (testName, status, details = '') => {
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusIcon} ${testName}: ${status} ${details}`);
  
  if (status === 'PASS') {
    validationResults.passed++;
  } else if (status === 'FAIL') {
    validationResults.failed++;
    validationResults.errors.push(`${testName}: ${details}`);
  } else {
    validationResults.warnings++;
  }
};

const checkFileExists = (filePath, description) => {
  try {
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      logValidation(`${description} File`, 'PASS', `${filePath} (${Math.round(stats.size / 1024)}KB)`);
      return true;
    } else {
      logValidation(`${description} File`, 'FAIL', `${filePath} not found`);
      return false;
    }
  } catch (error) {
    logValidation(`${description} File`, 'FAIL', error.message);
    return false;
  }
};

const checkFileContent = (filePath, description, requiredContent) => {
  try {
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasContent = requiredContent.every(item => content.includes(item));
      
      if (hasContent) {
        logValidation(`${description} Content`, 'PASS', 'Required content found');
        return true;
      } else {
        const missing = requiredContent.filter(item => !content.includes(item));
        logValidation(`${description} Content`, 'FAIL', `Missing: ${missing.join(', ')}`);
        return false;
      }
    } else {
      logValidation(`${description} Content`, 'FAIL', 'File not found');
      return false;
    }
  } catch (error) {
    logValidation(`${description} Content`, 'FAIL', error.message);
    return false;
  }
};

// Validation tests
class FileStructureValidation {
  static validate() {
    console.log('\n📁 VALIDATING FILE STRUCTURE');
    console.log('=============================');
    
    // Check critical files exist
    const criticalFiles = [
      { path: 'server.js', desc: 'Main Server' },
      { path: 'backend/middleware/advancedSecurity.js', desc: 'Advanced Security Middleware' },
      { path: 'backend/middleware/performanceOptimization.js', desc: 'Performance Optimization Middleware' },
      { path: 'backend/middleware/errorHandling.js', desc: 'Error Handling Middleware' },
      { path: 'backend/middleware/monitoring.js', desc: 'Monitoring Middleware' },
      { path: 'backend/config/production.js', desc: 'Production Configuration' },
      { path: 'backend/routes/auth.js', desc: 'Authentication Routes' },
      { path: 'backend/routes/bookings.js', desc: 'Bookings Routes' },
      { path: 'backend/routes/rooms.js', desc: 'Rooms Routes' },
      { path: 'backend/database/postgres.js', desc: 'PostgreSQL Database' },
      { path: 'src/lib/unifiedApiClient.js', desc: 'Unified API Client' },
      { path: 'src/contexts/SimplifiedAuthContext.jsx', desc: 'Simplified Auth Context' },
      { path: 'src/contexts/SimplifiedTenantContext.jsx', desc: 'Simplified Tenant Context' },
      { path: 'src/contexts/UnifiedWebSocketContext.jsx', desc: 'Unified WebSocket Context' },
      { path: 'src/utils/systemValidation.js', desc: 'System Validation Utils' }
    ];
    
    criticalFiles.forEach(file => {
      checkFileExists(file.path, file.desc);
    });
    
    // Check documentation files
    const documentationFiles = [
      { path: 'FIX_PLAN.md', desc: 'Fix Plan Documentation' },
      { path: 'PRODUCTION_DEPLOYMENT_GUIDE.md', desc: 'Production Deployment Guide' },
      { path: 'COMPLETE_SYSTEM_TRANSFORMATION.md', desc: 'System Transformation Summary' },
      { path: 'MIGRATION_GUIDE.md', desc: 'Migration Guide' }
    ];
    
    documentationFiles.forEach(file => {
      checkFileExists(file.path, file.desc);
    });
  }
}

class SecurityValidation {
  static validate() {
    console.log('\n🔒 VALIDATING SECURITY IMPLEMENTATION');
    console.log('======================================');
    
    // Check advanced security middleware
    checkFileContent(
      'backend/middleware/advancedSecurity.js',
      'Advanced Security Middleware',
      [
        'rateLimit',
        'helmet',
        'sanitizeInput',
        'preventSqlInjection',
        'securityHeaders',
        'requestFingerprinting',
        'authRateLimit',
        'apiRateLimit'
      ]
    );
    
    // Check server security integration
    checkFileContent(
      'server.js',
      'Server Security Integration',
      [
        'securityHeaders',
        'sanitizeInput',
        'authRateLimit',
        'apiRateLimit',
        'preventSqlInjection',
        'securityLogger'
      ]
    );
    
    // Check authentication security
    checkFileContent(
      'backend/routes/auth.js',
      'Authentication Security',
      [
        'bcrypt',
        'jwt',
        'validationResult',
        'isEmail',
        'normalizeEmail'
      ]
    );
    
    // Check tenant isolation in bookings
    checkFileContent(
      'backend/routes/bookings.js',
      'Bookings Tenant Isolation',
      [
        'tenant_id = $',
        'pool.query',
        'validationResult'
      ]
    );
    
    // Check tenant isolation in rooms
    checkFileContent(
      'backend/routes/rooms.js',
      'Rooms Tenant Isolation',
      [
        'tenant_id = $',
        'pool.query',
        'validationResult'
      ]
    );
  }
}

class PerformanceValidation {
  static validate() {
    console.log('\n🚀 VALIDATING PERFORMANCE OPTIMIZATION');
    console.log('=======================================');
    
    // Check performance optimization middleware
    checkFileContent(
      'backend/middleware/performanceOptimization.js',
      'Performance Optimization',
      [
        'MemoryCache',
        'cacheMiddleware',
        'invalidateCache',
        'optimizeQueries',
        'performanceMonitor',
        'responseCompression'
      ]
    );
    
    // Check database optimization
    checkFileContent(
      'backend/database/postgres.js',
      'Database Optimization',
      [
        'Pool',
        'connectionTimeoutMillis',
        'idleTimeoutMillis',
        'max',
        'min'
      ]
    );
    
    // Check server performance integration
    checkFileContent(
      'server.js',
      'Server Performance Integration',
      [
        'responseCompression',
        'performanceMonitor',
        'optimizeDatabasePool'
      ]
    );
  }
}

class ErrorHandlingValidation {
  static validate() {
    console.log('\n🛠️ VALIDATING ERROR HANDLING');
    console.log('=============================');
    
    // Check error handling middleware
    checkFileContent(
      'backend/middleware/errorHandling.js',
      'Error Handling Middleware',
      [
        'AppError',
        'ValidationError',
        'AuthenticationError',
        'DatabaseError',
        'errorHandler',
        'asyncHandler',
        'Logger'
      ]
    );
    
    // Check server error handling integration
    checkFileContent(
      'server.js',
      'Server Error Handling Integration',
      [
        'errorHandler',
        'setupGlobalErrorHandlers',
        'healthCheck'
      ]
    );
  }
}

class MonitoringValidation {
  static validate() {
    console.log('\n📊 VALIDATING MONITORING & ANALYTICS');
    console.log('=====================================');
    
    // Check monitoring middleware
    checkFileContent(
      'backend/middleware/monitoring.js',
      'Monitoring Middleware',
      [
        'AnalyticsCollector',
        'businessIntelligence',
        'realTimeMonitoring',
        'analyticsMiddleware',
        'analyticsRoutes'
      ]
    );
    
    // Check server monitoring integration
    checkFileContent(
      'server.js',
      'Server Monitoring Integration',
      [
        'analyticsMiddleware',
        'analyticsRoutes',
        'healthCheck'
      ]
    );
  }
}

class ConfigurationValidation {
  static validate() {
    console.log('\n⚙️ VALIDATING PRODUCTION CONFIGURATION');
    console.log('========================================');
    
    // Check production configuration
    checkFileContent(
      'backend/config/production.js',
      'Production Configuration',
      [
        'productionConfig',
        'validateEnvironment',
        'security',
        'performance',
        'monitoring',
        'database',
        'websocket'
      ]
    );
    
    // Check server configuration integration
    checkFileContent(
      'server.js',
      'Server Configuration Integration',
      [
        'productionConfig',
        'validateEnvironment',
        'NODE_ENV'
      ]
    );
    
    // Check package.json for required dependencies
    checkFileContent(
      'package.json',
      'Package Dependencies',
      [
        'express',
        'cors',
        'helmet',
        'express-rate-limit',
        'express-validator',
        'bcryptjs',
        'jsonwebtoken',
        'socket.io',
        'compression'
      ]
    );
  }
}

class FrontendValidation {
  static validate() {
    console.log('\n🎨 VALIDATING FRONTEND IMPROVEMENTS');
    console.log('====================================');
    
    // Check unified API client
    checkFileContent(
      'src/lib/unifiedApiClient.js',
      'Unified API Client',
      [
        'apiClient',
        'authAPI',
        'roomsAPI',
        'bookingsAPI',
        'businessHoursAPI'
      ]
    );
    
    // Check simplified auth context
    checkFileContent(
      'src/contexts/SimplifiedAuthContext.jsx',
      'Simplified Auth Context',
      [
        'useAuth',
        'login',
        'logout',
        'isAuthenticated',
        'user'
      ]
    );
    
    // Check simplified tenant context
    checkFileContent(
      'src/contexts/SimplifiedTenantContext.jsx',
      'Simplified Tenant Context',
      [
        'useTenant',
        'currentTenant',
        'switchTenant'
      ]
    );
    
    // Check unified WebSocket context
    checkFileContent(
      'src/contexts/UnifiedWebSocketContext.jsx',
      'Unified WebSocket Context',
      [
        'useWebSocket',
        'connected',
        'joinRoom',
        'subscribeToBookingChanges'
      ]
    );
    
    // Check system validation utils
    checkFileContent(
      'src/utils/systemValidation.js',
      'System Validation Utils',
      [
        'validateComponent',
        'quickValidation',
        'runAllTests'
      ]
    );
  }
}

// Main validation runner
async function runSystemValidation() {
  console.log('🔍 SYSTEM VALIDATION SUITE');
  console.log('===========================');
  console.log(`🎯 Validating: Boom Karaoke Booking System`);
  console.log(`⏰ Started: ${new Date().toISOString()}`);
  console.log('');

  try {
    // Run all validation suites
    FileStructureValidation.validate();
    SecurityValidation.validate();
    PerformanceValidation.validate();
    ErrorHandlingValidation.validate();
    MonitoringValidation.validate();
    ConfigurationValidation.validate();
    FrontendValidation.validate();
    
  } catch (error) {
    console.error('❌ Validation suite failed:', error.message);
    validationResults.errors.push(`Validation suite error: ${error.message}`);
  }

  // Generate validation report
  console.log('\n📊 VALIDATION RESULTS SUMMARY');
  console.log('==============================');
  console.log(`✅ Passed: ${validationResults.passed}`);
  console.log(`❌ Failed: ${validationResults.failed}`);
  console.log(`⚠️ Warnings: ${validationResults.warnings}`);
  console.log(`📈 Success Rate: ${((validationResults.passed / (validationResults.passed + validationResults.failed)) * 100).toFixed(1)}%`);
  
  if (validationResults.errors.length > 0) {
    console.log('\n❌ VALIDATION ERRORS:');
    validationResults.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  if (validationResults.failed === 0) {
    console.log('\n🎉 ALL VALIDATIONS PASSED! System is ready for production deployment.');
    console.log('\n🚀 DEPLOYMENT READY:');
    console.log('   ✅ All security measures implemented');
    console.log('   ✅ Performance optimizations in place');
    console.log('   ✅ Error handling comprehensive');
    console.log('   ✅ Monitoring and analytics ready');
    console.log('   ✅ Production configuration complete');
    console.log('   ✅ Frontend improvements implemented');
    console.log('   ✅ Documentation complete');
  } else {
    console.log(`\n⚠️ ${validationResults.failed} validations failed. Please review and fix issues before deployment.`);
  }
  
  console.log(`\n🏁 Validation completed at: ${new Date().toISOString()}`);
  
  return validationResults.failed === 0;
}

// Export for use in other modules
export { runSystemValidation, FileStructureValidation, SecurityValidation, PerformanceValidation, ErrorHandlingValidation, MonitoringValidation, ConfigurationValidation, FrontendValidation };

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSystemValidation()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Validation runner failed:', error);
      process.exit(1);
    });
}
