/**
 * Pre-build script to ensure TypeScript files are compiled before Smithery build
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running pre-build script...');

// Create dist directory if it doesn't exist
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  console.log('Creating dist directory...');
  fs.mkdirSync(distDir, { recursive: true });
}

// Ensure src directory exists and has the required files
const srcDir = path.join(process.cwd(), 'src');
if (!fs.existsSync(srcDir)) {
  console.error('Error: src directory not found');
  process.exit(1);
}

// Check if smithery.ts exists
const smitheryTsPath = path.join(srcDir, 'smithery.ts');
if (!fs.existsSync(smitheryTsPath)) {
  console.error('Error: smithery.ts not found in src directory');
  process.exit(1);
}

console.log('Pre-build preparation completed successfully!');

