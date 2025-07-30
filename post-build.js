/**
 * Post-build script to verify TypeScript compilation results
 */
const fs = require('fs');
const path = require('path');

console.log('Running post-build verification...');

// Check if dist directory exists
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory not found after TypeScript compilation');
  process.exit(1);
}

// Check if smithery.js exists in dist directory
const smitheryJsPath = path.join(distDir, 'smithery.js');
if (!fs.existsSync(smitheryJsPath)) {
  console.error('Error: smithery.js not found in dist directory after TypeScript compilation');
  process.exit(1);
}

console.log('Post-build verification completed successfully!');
console.log('Files in dist directory:');
const distFiles = fs.readdirSync(distDir);
distFiles.forEach(file => console.log(`- ${file}`));
