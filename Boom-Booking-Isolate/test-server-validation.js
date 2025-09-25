/**
 * Server-Side System Validation
 * 
 * This script runs comprehensive validation tests in a Node.js environment
 * without requiring browser APIs like localStorage.
 */

import { SystemValidator } from './src/utils/systemValidation.js';
import { getStorage, isNodeEnvironment } from './src/utils/testEnvironment.js';

console.log('🧪 BOOM BOOKING SYSTEM - SERVER VALIDATION');
console.log('==========================================');
console.log('Testing all fixes from FIX_PLAN.md...\n');

console.log('🔍 Running comprehensive system validation...');
console.log(`Environment: ${isNodeEnvironment() ? 'Node.js' : 'Browser'}`);
console.log(`Storage: ${getStorage().constructor.name}\n`);

async function runServerValidation() {
  try {
    const validator = new SystemValidator();
    const results = await validator.runAllTests();
    
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('=====================');
    console.log(`Authentication: ${results.results.errors.some(e => e.test.includes('Authentication')) ? '❌ FAILED' : '✅ PASSED'}`);
    console.log(`Tenant Isolation: ${results.results.errors.some(e => e.test.includes('Tenant')) ? '❌ FAILED' : '✅ PASSED'}`);
    console.log(`Database Operations: ${results.results.errors.some(e => e.test.includes('Database')) ? '❌ FAILED' : '✅ PASSED'}`);
    console.log(`API Consistency: ${results.results.errors.some(e => e.test.includes('API')) ? '❌ FAILED' : '✅ PASSED'}`);
    console.log(`Error Handling: ${results.results.errors.some(e => e.test.includes('Error')) ? '❌ FAILED' : '✅ PASSED'}`);
    console.log(`Overall System: ${results.success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (!results.success) {
      console.log('\n❌ FAILED TESTS:');
      results.results.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
    }
    
    console.log(`\n🎯 Overall Result: ${results.success ? 'ALL SYSTEMS OPERATIONAL' : 'SOME ISSUES DETECTED'}`);
    
    process.exit(results.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run validation
runServerValidation();
