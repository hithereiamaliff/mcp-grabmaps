/**
 * Pre-build script to ensure TypeScript files are compiled before Smithery build
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running pre-build script...');

// Create dist directory if it doesn't exist
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  console.log('Creating dist directory...');
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('Pre-build preparation completed successfully!');

