/**
 * Adapter file for Smithery MCP Server
 * This file helps bridge the gap between CommonJS and ESM modules
 */

// Import the compiled server with error handling
let serverModule;
try {
  serverModule = require('./dist/smithery');
  console.log('Successfully loaded server module from ./dist/smithery');
} catch (error) {
  console.error('Error loading server module:', error.message);
  // Provide a fallback module if the import fails
  serverModule = {
    default: () => ({
      serverInfo: {
        name: 'grabmaps',
        description: 'GrabMaps API integration for Model Context Protocol',
        version: '1.0.0'
      },
      tools: {}
    })
  };
  console.log('Using fallback server module');
}

// Export a function that returns a server with the connect method
module.exports = async function() {
  try {
    const server = await serverModule.default();
    
    return {
      serverInfo: server.serverInfo,
      tools: server.tools,
      connect: async (config) => {
        console.log('MCP server connected with config:', config);
        return server;
      }
    };
  } catch (error) {
    console.error('Error creating server:', error.message);
    // Return a minimal server implementation as fallback
    return {
      serverInfo: {
        name: 'grabmaps',
        description: 'GrabMaps API integration for Model Context Protocol',
        version: '1.0.0'
      },
      tools: {},
      connect: async () => ({
        serverInfo: {
          name: 'grabmaps',
          description: 'GrabMaps API integration for Model Context Protocol',
          version: '1.0.0'
        },
        tools: {}
      })
    };
  }
};
