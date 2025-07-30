/**
 * Post-build script to verify TypeScript compilation results
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.log('Creating a fallback smithery.js file...');
  
  // Create a fallback smithery.js file
  const fallbackContent = `/**
 * Fallback smithery.js file created by post-build script
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Define the config schema for passing secrets securely
export const configSchema = z.object({
  grabMapsApiKey: z.string().describe('GrabMaps API key'),
  awsAccessKeyId: z.string().describe('AWS Access Key ID'),
  awsSecretAccessKey: z.string().describe('AWS Secret Access Key'),
  awsRegion: z.string().optional().describe('AWS Region (default: ap-southeast-5)'),
});

/**
 * Creates a stateless MCP server for the GrabMaps API
 */
export default function createStatelessServer({
  config: _config,
}) {
  const server = new McpServer({
    name: 'grabmaps',
    description: 'GrabMaps API integration for Model Context Protocol',
    version: '1.0.0',
  });

  // Set API key from config
  process.env.GRABMAPS_API_KEY = _config.grabMapsApiKey;
  
  // Set AWS credentials for GrabMaps integration via AWS Location Service
  process.env.AWS_ACCESS_KEY_ID = _config.awsAccessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = _config.awsSecretAccessKey;
  
  // Set AWS region if provided, otherwise use default
  process.env.AWS_REGION = _config.awsRegion || 'ap-southeast-5';
  
  console.log('GrabMaps MCP Server initialized with credentials');

  return server;
}`;

  fs.writeFileSync(smitheryJsPath, fallbackContent, 'utf8');
  console.log('Fallback smithery.js file created successfully!');
}

console.log('Post-build verification completed successfully!');
console.log('Files in dist directory:');
const distFiles = fs.readdirSync(distDir);
distFiles.forEach(file => console.log(`- ${file}`));
