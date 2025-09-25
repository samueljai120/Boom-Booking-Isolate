#!/usr/bin/env node

/**
 * System Validation Test Script
 * 
 * This script validates all the fixes implemented according to FIX_PLAN.md
 */

import { quickValidation, validateComponent } from './src/utils/systemValidation.js';

console.log('🧪 BOOM BOOKING SYSTEM VALIDATION');
console.log('=====================================');
console.log('Testing all fixes from FIX_PLAN.md...\n');

async function runValidationTests() {
  try {
    console.log('🔍 Running comprehensive system validation...\n');
    
    // Test individual components
    console.log('1. Testing Authentication System...');
    const authResult = await validateComponent('auth');
    console.log(`   Result: ${authResult ? '✅ PASSED' : '❌ FAILED'}\n`);
    
    console.log('2. Testing Tenant Isolation...');
    const tenantResult = await validateComponent('tenant');
    console.log(`   Result: ${tenantResult ? '✅ PASSED' : '❌ FAILED'}\n`);
    
    console.log('3. Testing Database Operations...');
    const dbResult = await validateComponent('database');
    console.log(`   Result: ${dbResult ? '✅ PASSED' : '❌ FAILED'}\n`);
    
    console.log('4. Testing API Consistency...');
    const apiResult = await validateComponent('api');
    console.log(`   Result: ${apiResult ? '✅ PASSED' : '❌ FAILED'}\n`);
    
    console.log('5. Testing Error Handling...');
    const errorResult = await validateComponent('errors');
    console.log(`   Result: ${errorResult ? '✅ PASSED' : '❌ FAILED'}\n`);
    
    // Run full validation suite
    console.log('6. Running Complete Validation Suite...');
    const fullResult = await quickValidation();
    
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('=====================');
    console.log(`Authentication: ${authResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Tenant Isolation: ${tenantResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Database Operations: ${dbResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`API Consistency: ${apiResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Error Handling: ${errorResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Overall System: ${fullResult.success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (fullResult.success) {
      console.log('\n🎉 ALL FIXES VALIDATED SUCCESSFULLY!');
      console.log('The system is now secure, consistent, and production-ready.');
      process.exit(0);
    } else {
      console.log('\n⚠️  SOME VALIDATION TESTS FAILED');
      console.log('Please review the failed tests and fix the issues.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ VALIDATION ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the validation
runValidationTests();
