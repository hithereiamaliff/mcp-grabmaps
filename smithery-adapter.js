/**
 * Adapter file for Smithery MCP Server
 * This file helps bridge the gap between CommonJS and ESM modules
 */

// Import the compiled server
const serverModule = require('./dist/smithery');

// Export a function that returns a server with the connect method
module.exports = async function() {
  const server = await serverModule.default();
  
  return {
    serverInfo: server.serverInfo,
    tools: server.tools,
    connect: async (config) => {
      console.log('MCP server connected with config:', config);
      return server;
    }
  };
};
