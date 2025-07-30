/**
 * GrabMaps MCP Server
 * Provides Places and Routes API tools for Model Context Protocol
 */
import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { placeActions } from './actions/places.js';
import { routeActions } from './actions/routes.js';

// Load environment variables
dotenv.config();

// Define the config schema (optional, for passing secrets securely)
export const configSchema = z.object({
  grabMapsApiKey: z.string().optional().describe('GrabMaps API key'),
});

/**
 * Creates a stateless MCP server for the GrabMaps API
 */
export default function createStatelessServer({
  config: _config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new McpServer({
    name: 'grabmaps',
    description: 'GrabMaps API integration for Model Context Protocol',
    version: '1.0.0',
  });

  // Set API key from config if provided
  if (_config.grabMapsApiKey) {
    process.env.GRABMAPS_API_KEY = _config.grabMapsApiKey;
  }

  // Register Places API tools
  server.registerTool(
    'searchPlaceIndexForText',
    {
      description: `Search for places using text query.

IMPORTANT INSTRUCTION FOR AI MODELS: AI models MUST analyze the user's query to determine the country and ALWAYS include the appropriate country code in the request.
For example:
- If user asks about "City Square Mall", determine it's in Singapore and use country: "SGP"
- If user asks about "Songklanagarind Hospital", determine it's in Thailand and use country: "THA"
This is CRITICAL for returning accurate search results.`,
      inputSchema: {
        query: z.string().describe('Search query text'),
        country: z.string()
          .describe('REQUIRED: Three-letter ISO country code (e.g., "SGP" for Singapore, "MYS" for Malaysia, "THA" for Thailand). AI MODELS MUST ALWAYS INCLUDE THIS PARAMETER.')
          .optional(), // Technically optional but strongly encouraged
        maxResults: z.number().optional().describe('Maximum results to return'),
        language: z.string().optional().describe('Language code'),
      }
    },
    placeActions.searchPlaceIndexForText
  );

  server.registerTool(
    'searchPlaceIndexForPosition',
    {
      description: 'Search for places by coordinates (reverse geocoding)',
      inputSchema: {
        longitude: z.number().describe('Longitude coordinate'),
        latitude: z.number().describe('Latitude coordinate'),
        maxResults: z.number().optional().describe('Maximum results to return'),
        language: z.string().optional().describe('Language code'),
      },
    },
    placeActions.searchPlaceIndexForPosition
  );

  server.registerTool(
    'searchPlaceIndexForSuggestions',
    {
      description: `Get place suggestions based on partial text input.

IMPORTANT INSTRUCTION FOR AI MODELS: AI models MUST analyze the user's query to determine the country and ALWAYS include the appropriate country code in the request.
For example:
- If user asks about "City Square Mall", determine it's in Singapore and use country: "SGP"
- If user asks about "Songklanagarind Hospital", determine it's in Thailand and use country: "THA"
This is CRITICAL for returning accurate search results.`,
      inputSchema: {
        query: z.string().describe('Search query text'),
        country: z.string()
          .describe('REQUIRED: Three-letter ISO country code (e.g., "SGP" for Singapore, "MYS" for Malaysia, "THA" for Thailand). AI MODELS MUST ALWAYS INCLUDE THIS PARAMETER.')
          .optional(), // Technically optional but strongly encouraged
        maxResults: z.number().optional().describe('Maximum results to return'),
        language: z.string().optional().describe('Language code'),
      }
    },
    placeActions.searchPlaceIndexForSuggestions
  );

  server.registerTool(
    'getPlace',
    {
      description: 'Get place details by place ID',
      inputSchema: {
        placeId: z.string().describe('ID of the place to retrieve'),
        language: z.string().optional().describe('Language code'),
      },
    },
    placeActions.getPlace
  );

  // Register Routes API tools
  server.registerTool(
    'calculateRoute',
    {
      description: 'Calculate a route between two points',
      inputSchema: {
        origin: z.object({ longitude: z.number(), latitude: z.number() }),
        destination: z.object({ longitude: z.number(), latitude: z.number() }),
        travelMode: z.enum(['Car', 'Truck', 'Walking', 'Bicycle', 'Motorcycle']).optional(),
        distanceUnit: z.enum(['Kilometers', 'Miles']).optional(),
      },
    },
    routeActions.calculateRoute
  );

  type RouteMatrixParams = {
    departurePositions: number[][];
    destinationPositions: number[][];
    travelMode?: 'Car' | 'Truck' | 'Walking' | 'Bicycle' | 'Motorcycle';
    departureTime?: string;
    distanceUnit?: 'Kilometers' | 'Miles';
  };

  server.registerTool(
    'calculateRouteMatrix',
    {
      description: 'Calculates a route matrix between multiple origins and destinations.',
      inputSchema: {
        departurePositions: z.array(z.array(z.number())),
        destinationPositions: z.array(z.array(z.number())),
        travelMode: z.enum(['Car', 'Truck', 'Walking', 'Bicycle', 'Motorcycle']).optional(),
        distanceUnit: z.enum(['Kilometers', 'Miles']).optional(),
        departureTime: z.string().optional(),
      },
    },
    routeActions.calculateRouteMatrix
  );

  return server;
}
