/**
 * Smithery MCP Server configuration (ES Module version)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Export the configuration
export default {
  name: 'grabmaps',
  description: 'GrabMaps API integration for Model Context Protocol',
  version: '1.0.0',
  entry: join(__dirname, './smithery-adapter.js'),
  public: true,
  port: 8181
};
