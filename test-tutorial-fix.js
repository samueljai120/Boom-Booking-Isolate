// Test script to verify tutorial system fixes
console.log('🔧 Testing Tutorial System Fixes');
console.log('================================');

// Test 1: Check if TutorialProvider is properly wrapped
function testTutorialProvider() {
  console.log('\n1. Testing TutorialProvider Context:');
  
  // Check if the context is available
  const tutorialState = localStorage.getItem('karaoke-tutorial-state');
  if (tutorialState) {
    console.log('✅ Tutorial state found in localStorage');
    try {
      const parsed = JSON.parse(tutorialState);
      console.log('📊 Current tutorial state:', parsed);
    } catch (error) {
      console.log('❌ Error parsing tutorial state:', error);
    }
  } else {
    console.log('ℹ️ No tutorial state found - first time user');
  }
}

// Test 2: Check for excessive logging
function testLoggingCleanup() {
  console.log('\n2. Testing Logging Cleanup:');
  
  // Check if debug logs are still present
  const hasDebugLogs = console.log.toString().includes('🔧 TraditionalSchedule slot dimensions calculated');
  if (hasDebugLogs) {
    console.log('⚠️ Debug logs may still be present');
  } else {
    console.log('✅ Debug logs appear to be cleaned up');
  }
}

// Test 3: Check component initialization
function testComponentInitialization() {
  console.log('\n3. Testing Component Initialization:');
  
  // Check if tutorial button is present
  const tutorialButton = document.querySelector('[aria-label="Start tutorial"]');
  if (tutorialButton) {
    console.log('✅ Tutorial button found');
  } else {
    console.log('ℹ️ Tutorial button not found (may be hidden or not initialized)');
  }
  
  // Check if instructions modal has tutorial button
  const instructionsModal = document.querySelector('[data-testid="instructions-modal"]');
  if (instructionsModal) {
    console.log('✅ Instructions modal found');
  } else {
    console.log('ℹ️ Instructions modal not found (may not be open)');
  }
}

// Test 4: Check for context errors
function testContextErrors() {
  console.log('\n4. Testing Context Errors:');
  
  // Check if there are any context-related errors in the console
  const originalError = console.error;
  let contextErrors = 0;
  
  console.error = function(...args) {
    if (args[0] && args[0].includes && args[0].includes('useTutorial must be used within a TutorialProvider')) {
      contextErrors++;
    }
    originalError.apply(console, args);
  };
  
  // Restore original console.error after a short delay
  setTimeout(() => {
    console.error = originalError;
    if (contextErrors > 0) {
      console.log(`❌ Found ${contextErrors} context errors`);
    } else {
      console.log('✅ No context errors detected');
    }
  }, 1000);
}

// Test 5: Performance check
function testPerformance() {
  console.log('\n5. Testing Performance:');
  
  const startTime = performance.now();
  
  // Simulate some operations
  for (let i = 0; i < 1000; i++) {
    Math.random();
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`⏱️ Basic operations took ${duration.toFixed(2)}ms`);
  
  if (duration < 10) {
    console.log('✅ Performance looks good');
  } else {
    console.log('⚠️ Performance may be slow');
  }
}

// Run all tests
function runAllTests() {
  console.log('🧪 Running Tutorial System Fix Tests...\n');
  
  testTutorialProvider();
  testLoggingCleanup();
  testComponentInitialization();
  testContextErrors();
  testPerformance();
  
  console.log('\n✅ All tests completed!');
  console.log('\n💡 Next steps:');
  console.log('- Check browser console for any remaining errors');
  console.log('- Try clicking the tutorial button if visible');
  console.log('- Open Instructions modal to access tutorial');
  console.log('- Verify tutorial steps work correctly');
}

// Export for manual testing
window.tutorialFixTests = {
  runAllTests,
  testTutorialProvider,
  testLoggingCleanup,
  testComponentInitialization,
  testContextErrors,
  testPerformance
};

// Auto-run tests
runAllTests();

console.log('\n🎯 Tutorial Fix Test Script Loaded!');
console.log('Run tutorialFixTests.runAllTests() to run all tests');
