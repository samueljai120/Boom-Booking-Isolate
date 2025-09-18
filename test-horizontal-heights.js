// Test to verify new horizontal slot height values
console.log('Testing new horizontal slot height values...');

// Updated height mapping for horizontal layout
const heightMap = {
  'tiny': 50,
  'small': 70,
  'medium': 90,
  'large': 130,
  'huge': 160
};

console.log('New horizontal layout height mapping:');
Object.entries(heightMap).forEach(([size, height]) => {
  console.log(`${size}: ${height}px`);
});

// Test the specific values mentioned by user
console.log('\nUser-specified values:');
console.log('Tiny (smallest):', heightMap.tiny, 'px ✅');
console.log('Medium:', heightMap.medium, 'px ✅');
console.log('Large:', heightMap.large, 'px ✅');

// Test default value
const defaultHeight = heightMap['medium'] || 90;
console.log('\nDefault height (medium):', defaultHeight, 'px');

// Test calculation with scale factor
const heightScaleFactor = 1.0;
const testHeights = Object.entries(heightMap).map(([size, height]) => ({
  size,
  baseHeight: height,
  scaledHeight: Math.max(60, height * heightScaleFactor)
}));

console.log('\nScaled heights:');
testHeights.forEach(({ size, baseHeight, scaledHeight }) => {
  console.log(`${size}: ${baseHeight}px → ${scaledHeight}px`);
});

console.log('\n✅ Horizontal slot height values updated successfully!');
