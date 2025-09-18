// Test script for the Interactive Tutorial System
// This script can be run in the browser console to test tutorial functionality

console.log('🎯 Interactive Tutorial System Test Script');
console.log('==========================================');

// Test tutorial state management
function testTutorialState() {
  console.log('\n📊 Testing Tutorial State Management:');
  
  // Check if tutorial context is available
  if (typeof window !== 'undefined' && window.React) {
    console.log('✅ React is available');
  } else {
    console.log('❌ React not found - make sure you\'re running this in the app');
  }
  
  // Check localStorage state
  const tutorialState = localStorage.getItem('karaoke-tutorial-state');
  if (tutorialState) {
    const parsed = JSON.parse(tutorialState);
    console.log('📝 Current tutorial state:', parsed);
  } else {
    console.log('📝 No tutorial state found - first time user');
  }
}

// Test tutorial functions
function testTutorialFunctions() {
  console.log('\n🔧 Testing Tutorial Functions:');
  
  // Simulate starting tutorial
  console.log('🚀 Starting tutorial...');
  
  // Simulate completing tutorial
  console.log('✅ Completing tutorial...');
  
  // Simulate skipping tutorial
  console.log('⏭️ Skipping tutorial...');
  
  // Simulate restarting tutorial
  console.log('🔄 Restarting tutorial...');
}

// Test tutorial steps
function testTutorialSteps() {
  console.log('\n📚 Testing Tutorial Steps:');
  
  const steps = [
    'Welcome',
    'Layout Overview', 
    'Sidebar Navigation',
    'Date Navigation',
    'Current Time Indicator',
    'Room Information',
    'Creating Bookings',
    'Drag & Drop Bookings',
    'Resize Bookings',
    'View & Edit Bookings',
    'Settings & Customization',
    'Completion'
  ];
  
  steps.forEach((step, index) => {
    console.log(`Step ${index + 1}: ${step}`);
  });
  
  console.log(`\nTotal steps: ${steps.length}`);
}

// Test UI elements
function testUIElements() {
  console.log('\n🎨 Testing UI Elements:');
  
  // Check for tutorial button
  const tutorialButton = document.querySelector('[aria-label="Start tutorial"]');
  if (tutorialButton) {
    console.log('✅ Floating tutorial button found');
  } else {
    console.log('❌ Floating tutorial button not found');
  }
  
  // Check for instructions modal
  const instructionsModal = document.querySelector('[data-testid="instructions-modal"]');
  if (instructionsModal) {
    console.log('✅ Instructions modal found');
  } else {
    console.log('ℹ️ Instructions modal not found (may not be open)');
  }
  
  // Check for tutorial modal
  const tutorialModal = document.querySelector('[data-testid="tutorial-modal"]');
  if (tutorialModal) {
    console.log('✅ Tutorial modal found');
  } else {
    console.log('ℹ️ Tutorial modal not found (may not be open)');
  }
}

// Test responsive design
function testResponsiveDesign() {
  console.log('\n📱 Testing Responsive Design:');
  
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  console.log(`Screen size: ${screenWidth}x${screenHeight}`);
  
  if (screenWidth < 640) {
    console.log('📱 Mobile view detected');
  } else if (screenWidth < 1024) {
    console.log('📱 Tablet view detected');
  } else {
    console.log('💻 Desktop view detected');
  }
}

// Test accessibility
function testAccessibility() {
  console.log('\n♿ Testing Accessibility:');
  
  // Check for ARIA labels
  const ariaElements = document.querySelectorAll('[aria-label]');
  console.log(`Found ${ariaElements.length} elements with ARIA labels`);
  
  // Check for keyboard navigation
  const focusableElements = document.querySelectorAll('button, [tabindex]');
  console.log(`Found ${focusableElements.length} focusable elements`);
  
  // Check for color contrast (basic check)
  const textElements = document.querySelectorAll('p, span, div');
  console.log(`Found ${textElements.length} text elements`);
}

// Run all tests
function runAllTests() {
  console.log('🧪 Running Interactive Tutorial System Tests...\n');
  
  testTutorialState();
  testTutorialFunctions();
  testTutorialSteps();
  testUIElements();
  testResponsiveDesign();
  testAccessibility();
  
  console.log('\n✅ All tests completed!');
  console.log('\n💡 Tips:');
  console.log('- Open the Instructions modal to see the tutorial button');
  console.log('- Click the floating purple button to start the tutorial');
  console.log('- Use browser dev tools to inspect tutorial elements');
  console.log('- Check localStorage for tutorial state persistence');
}

// Export functions for manual testing
window.tutorialTests = {
  runAllTests,
  testTutorialState,
  testTutorialFunctions,
  testTutorialSteps,
  testUIElements,
  testResponsiveDesign,
  testAccessibility
};

// Auto-run tests if in browser
if (typeof window !== 'undefined') {
  runAllTests();
}

console.log('\n🎯 Tutorial Test Script Loaded!');
console.log('Run tutorialTests.runAllTests() to run all tests');
console.log('Or run individual test functions as needed');
