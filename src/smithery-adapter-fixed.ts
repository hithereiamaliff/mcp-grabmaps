import { createStatefulServer } from '@smithery/sdk';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import only Places and Routes actions (no Maps)
import { placeActions } from './actions/places.js';
import { routeActions } from './actions/routes.js';

// Define MCP server metadata
const serverMetadata = {
  name: 'grabmaps',
  description: 'GrabMaps API integration for Model Context Protocol',
  version: '1.0.0'
};

// Define tool interface
interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  function: (params: any) => Promise<any>;
}

// Create MCP server function for Smithery
const createMcpServer = ({ sessionId, config }: { sessionId: string; config: Record<string, unknown> }) => {
  // Create tools array
  const tools: Tool[] = [];

  // Add place actions as tools
  Object.entries(placeActions).forEach(([name, handler]: [string, (params: any) => Promise<any>]) => {
    tools.push({
      name,
      description: `GrabMaps Places API: ${name}`,
      parameters: {
        type: 'object',
        properties: {}
      },
      function: async (params: any) => {
        try {
          return await handler(params);
        } catch (error) {
          console.error(`Error in ${name}:`, error);
          throw new Error((error as Error).message);
        }
      }
    });
  });

  // Add route actions as tools
  Object.entries(routeActions).forEach(([name, handler]: [string, (params: any) => Promise<any>]) => {
    tools.push({
      name,
      description: `GrabMaps Routes API: ${name}`,
      parameters: {
        type: 'object',
        properties: {}
      },
      function: async (params: any) => {
        try {
          return await handler(params);
        } catch (error) {
          console.error(`Error in ${name}:`, error);
          throw new Error((error as Error).message);
        }
      }
    });
  });

  // Create MCP server instance with the tools
  const mcpServer = new McpServer({
    name: serverMetadata.name,
    description: serverMetadata.description,
    version: serverMetadata.version,
    tools
  });

  // Return the server property as required by createStatefulServer
  return mcpServer.server;
};

// Create and export the stateful server
const { app } = createStatefulServer(createMcpServer);

// Export the Express app as default
export default function({ sessionId, config }: { sessionId: string; config: Record<string, unknown> }) {
  return app;
}
