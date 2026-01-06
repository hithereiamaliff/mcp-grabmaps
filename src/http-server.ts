/**
 * GrabMaps MCP Server - HTTP Server Entry Point
 * Streamable HTTP transport for VPS deployment
 * 
 * Supports per-user credentials via URL query parameters:
 * ?grabMapsApiKey=...&awsAccessKeyId=...&awsSecretAccessKey=...&awsRegion=...
 */
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { placeActions } from './actions/places.js';
import { routeActions } from './actions/routes.js';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '8080');
const HOST = process.env.HOST || '0.0.0.0';

// Server metadata
const SERVER_NAME = 'GrabMaps MCP Server';
const SERVER_VERSION = '1.0.0';

// Track server start time for uptime
const serverStartTime = Date.now();

// Helper to format uptime
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

/**
 * Creates an MCP server instance with the provided credentials
 */
function createMcpServer(config: {
  grabMapsApiKey: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion?: string;
}): McpServer {
  // Set environment variables for the API calls
  process.env.GRABMAPS_API_KEY = config.grabMapsApiKey;
  process.env.AWS_ACCESS_KEY_ID = config.awsAccessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = config.awsSecretAccessKey;
  process.env.AWS_REGION = config.awsRegion || 'ap-southeast-5';

  const server = new McpServer({
    name: 'grabmaps',
    description: 'GrabMaps API integration for Model Context Protocol',
    version: SERVER_VERSION,
  });

  // Register Places API tools
  server.registerTool(
    'searchPlaceIndexForText',
    {
      description: `Search for places using text query.

IMPORTANT INSTRUCTION FOR AI MODELS: 
1. GrabMaps ONLY supports eight countries in Southeast Asia: Malaysia (MYS), Singapore (SGP), Thailand (THA), Myanmar (MMR), Cambodia (KHM), Vietnam (VNM), Philippines (PHL), and Indonesia (IDN). Searches outside these countries will not return accurate results.

2. AI models MUST analyze the user's query to determine the country and ALWAYS include the appropriate country code in the request.`,
      inputSchema: {
        query: z.string().describe('Search query text'),
        country: z.string()
          .describe('REQUIRED: Three-letter ISO country code (e.g., "SGP" for Singapore, "MYS" for Malaysia, "THA" for Thailand).')
          .optional(),
        maxResults: z.number().optional().describe('Maximum results to return'),
        language: z.string().optional().describe('Language code'),
      }
    },
    placeActions.searchPlaceIndexForText
  );

  server.registerTool(
    'searchPlaceIndexForPosition',
    {
      description: 'Search for places by coordinates (reverse geocoding). Note: GrabMaps ONLY supports eight countries in Southeast Asia.',
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

IMPORTANT INSTRUCTION FOR AI MODELS: 
1. GrabMaps ONLY supports eight countries in Southeast Asia: Malaysia (MYS), Singapore (SGP), Thailand (THA), Myanmar (MMR), Cambodia (KHM), Vietnam (VNM), Philippines (PHL), and Indonesia (IDN).

2. AI models MUST analyze the user's query to determine the country and ALWAYS include the appropriate country code in the request.`,
      inputSchema: {
        query: z.string().describe('Search query text'),
        country: z.string()
          .describe('REQUIRED: Three-letter ISO country code.')
          .optional(),
        maxResults: z.number().optional().describe('Maximum results to return'),
        language: z.string().optional().describe('Language code'),
      }
    },
    placeActions.searchPlaceIndexForSuggestions
  );

  server.registerTool(
    'getPlace',
    {
      description: 'Get place details by place ID. Note: GrabMaps ONLY supports eight countries in Southeast Asia.',
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

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Root endpoint - Server info and usage instructions
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    description: 'MCP server for GrabMaps API (Places & Routes)',
    transport: 'streamable-http',
    usage: {
      mcpUrl: 'https://mcp.techmavie.digital/grabmaps/mcp?grabMapsApiKey=YOUR_KEY&awsAccessKeyId=YOUR_AWS_KEY&awsSecretAccessKey=YOUR_AWS_SECRET',
      parameters: {
        grabMapsApiKey: 'Your GrabMaps API key (required)',
        awsAccessKeyId: 'Your AWS Access Key ID (required)',
        awsSecretAccessKey: 'Your AWS Secret Access Key (required)',
        awsRegion: 'AWS Region (optional, default: ap-southeast-5)',
      }
    },
    endpoints: {
      health: '/health',
      mcp: '/mcp?grabMapsApiKey=...&awsAccessKeyId=...&awsSecretAccessKey=...',
    },
    supportedCountries: ['Malaysia (MYS)', 'Singapore (SGP)', 'Thailand (THA)', 'Myanmar (MMR)', 'Cambodia (KHM)', 'Vietnam (VNM)', 'Philippines (PHL)', 'Indonesia (IDN)'],
    uptime: formatUptime(Date.now() - serverStartTime),
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    server: SERVER_NAME,
    version: SERVER_VERSION,
    transport: 'streamable-http',
    uptime: formatUptime(Date.now() - serverStartTime),
    timestamp: new Date().toISOString(),
  });
});

/**
 * MCP endpoint - Handles MCP requests with per-user credentials
 */
app.all('/mcp', async (req: Request, res: Response) => {
  try {
    // Extract credentials from query parameters
    const grabMapsApiKey = req.query.grabMapsApiKey as string;
    const awsAccessKeyId = req.query.awsAccessKeyId as string;
    const awsSecretAccessKey = req.query.awsSecretAccessKey as string;
    const awsRegion = req.query.awsRegion as string | undefined;

    // Validate required credentials
    if (!grabMapsApiKey || !awsAccessKeyId || !awsSecretAccessKey) {
      res.status(400).json({
        error: 'Missing required parameters',
        message: 'Please provide GrabMaps and AWS credentials via query parameters',
        required: ['grabMapsApiKey', 'awsAccessKeyId', 'awsSecretAccessKey'],
        optional: ['awsRegion'],
        example: '/mcp?grabMapsApiKey=YOUR_KEY&awsAccessKeyId=YOUR_AWS_KEY&awsSecretAccessKey=YOUR_AWS_SECRET',
      });
      return;
    }

    // Log credential usage (masked)
    console.log(`[grabmaps-mcp] Using credentials: grabMapsApiKey=${grabMapsApiKey.substring(0, 8)}..., awsAccessKeyId=${awsAccessKeyId.substring(0, 8)}...`);

    // Create MCP server with user credentials
    const mcpServer = createMcpServer({
      grabMapsApiKey,
      awsAccessKeyId,
      awsSecretAccessKey,
      awsRegion,
    });

    // Create transport and handle request
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    // Connect server to transport
    await mcpServer.connect(transport);

    // Handle the request
    await transport.handleRequest(req, res, req.body);

  } catch (error) {
    console.error('MCP request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, HOST, () => {
  console.log(`
🚀 ${SERVER_NAME} (HTTP) running on http://${HOST}:${PORT}
   Health: http://${HOST}:${PORT}/health
   MCP:    http://${HOST}:${PORT}/mcp?grabMapsApiKey=...&awsAccessKeyId=...&awsSecretAccessKey=...

📍 Supported Countries: Malaysia, Singapore, Thailand, Myanmar, Cambodia, Vietnam, Philippines, Indonesia
`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
