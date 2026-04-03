/**
 * GrabMaps MCP Server - HTTP Server Entry Point
 * Streamable HTTP transport for VPS deployment
 *
 * Authentication via MCP Key Service: users provide a usr_XXXXXXXX key
 * which is resolved to GrabMaps + AWS credentials at runtime.
 */
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { placeActions } from './actions/places.js';
import { routeActions } from './actions/routes.js';
import { FirebaseAnalytics, Analytics } from './firebase-analytics.js';
import { createLocationClient } from './utils/aws-client.js';
import { isKeyServiceEnabled, resolveKeyCredentials, type ResolvedCredentials } from './utils/key-service.js';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '8080');
const HOST = process.env.HOST || '0.0.0.0';
const ANALYTICS_DATA_DIR = process.env.ANALYTICS_DIR || '/app/data';
const ANALYTICS_FILE = path.join(ANALYTICS_DATA_DIR, 'analytics.json');
const SAVE_INTERVAL_MS = 60000; // Save every 60 seconds
const MAX_RECENT_CALLS = 100;

// Server metadata
const SERVER_NAME = 'GrabMaps MCP Server';
const SERVER_VERSION = '1.0.0';

// Key-service config (read here for logging only; the utility reads them itself)
const KEY_SERVICE_URL = process.env.KEY_SERVICE_URL || '';
const KEY_SERVICE_TOKEN = process.env.KEY_SERVICE_TOKEN || '';

if (isKeyServiceEnabled()) {
  console.log(`Key Service mode enabled. User keys will be resolved via: ${KEY_SERVICE_URL}`);
} else if (KEY_SERVICE_URL || KEY_SERVICE_TOKEN) {
  console.warn('Hosted key-service mode requires both KEY_SERVICE_URL and KEY_SERVICE_TOKEN.');
} else {
  console.warn('KEY_SERVICE_URL and KEY_SERVICE_TOKEN are not set. MCP endpoints will return 503 until configured.');
}

// HttpError for typed error responses
class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

// Track server start time for uptime
const serverStartTime = Date.now();

// Analytics data
let analytics: Analytics = {
  serverStartTime: new Date().toISOString(),
  totalRequests: 0,
  totalToolCalls: 0,
  requestsByMethod: {},
  requestsByEndpoint: {},
  toolCalls: {},
  recentToolCalls: [],
  clientsByIp: {},
  clientsByUserAgent: {},
  hourlyRequests: {},
};

/** Merge loaded data with safe defaults so no field is ever undefined. */
function safeAnalytics(loaded: Partial<Analytics>): Analytics {
  return {
    serverStartTime: loaded.serverStartTime || new Date().toISOString(),
    totalRequests: loaded.totalRequests || 0,
    totalToolCalls: loaded.totalToolCalls || 0,
    requestsByMethod: loaded.requestsByMethod || {},
    requestsByEndpoint: loaded.requestsByEndpoint || {},
    toolCalls: loaded.toolCalls || {},
    recentToolCalls: loaded.recentToolCalls || [],
    clientsByIp: loaded.clientsByIp || {},
    clientsByUserAgent: loaded.clientsByUserAgent || {},
    hourlyRequests: loaded.hourlyRequests || {},
  };
}

// Ensure data directory exists
function ensureDataDir(): void {
  if (!fs.existsSync(ANALYTICS_DATA_DIR)) {
    fs.mkdirSync(ANALYTICS_DATA_DIR, { recursive: true });
    console.log(`📁 Created analytics data directory: ${ANALYTICS_DATA_DIR}`);
  }
}

// Load analytics from disk on startup
function loadAnalytics(): void {
  try {
    ensureDataDir();
    if (fs.existsSync(ANALYTICS_FILE)) {
      const data = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
      const loaded = JSON.parse(data) as Partial<Analytics>;
      analytics = safeAnalytics(loaded);
      console.log(`📊 Loaded analytics from ${ANALYTICS_FILE}`);
      console.log(`   Total requests: ${analytics.totalRequests}`);
    } else {
      console.log(`📊 No existing analytics file, starting fresh`);
    }
  } catch (error) {
    console.error(`⚠️ Failed to load analytics:`, error);
  }
}

// Save analytics to disk
function saveAnalytics(): void {
  try {
    ensureDataDir();
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(analytics, null, 2));
    console.log(`💾 Saved analytics to ${ANALYTICS_FILE}`);
  } catch (error) {
    console.error(`⚠️ Failed to save analytics:`, error);
  }
}

// Track HTTP request
function trackRequest(req: Request, endpoint: string): void {
  analytics.totalRequests++;
  
  const method = req.method;
  analytics.requestsByMethod[method] = (analytics.requestsByMethod[method] || 0) + 1;
  
  analytics.requestsByEndpoint[endpoint] = (analytics.requestsByEndpoint[endpoint] || 0) + 1;
  
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  analytics.clientsByIp[clientIp] = (analytics.clientsByIp[clientIp] || 0) + 1;
  
  const userAgent = req.headers['user-agent'] || 'unknown';
  const shortAgent = userAgent.substring(0, 50);
  analytics.clientsByUserAgent[shortAgent] = (analytics.clientsByUserAgent[shortAgent] || 0) + 1;
  
  const hour = new Date().toISOString().substring(0, 13);
  analytics.hourlyRequests[hour] = (analytics.hourlyRequests[hour] || 0) + 1;
}

// Track tool call
function trackToolCall(toolName: string, req: Request): void {
  analytics.totalToolCalls++;
  analytics.toolCalls[toolName] = (analytics.toolCalls[toolName] || 0) + 1;
  
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  const toolCall = {
    tool: toolName,
    timestamp: new Date().toISOString(),
    clientIp,
    userAgent: (req.headers['user-agent'] || 'unknown').substring(0, 50),
  };
  
  analytics.recentToolCalls.unshift(toolCall);
  if (analytics.recentToolCalls.length > MAX_RECENT_CALLS) {
    analytics.recentToolCalls.pop();
  }
}

// Initialize Firebase Analytics
const firebaseAnalytics = new FirebaseAnalytics('mcp-grabmaps');

// Load analytics on startup (try Firebase first, then local)
async function initializeAnalytics() {
  if (firebaseAnalytics.isInitialized()) {
    const firebaseData = await firebaseAnalytics.loadAnalytics();
    if (firebaseData) {
      analytics = safeAnalytics(firebaseData);
      console.log('📊 Loaded analytics from Firebase');
      return;
    }
  }
  
  // Fallback to local file
  loadAnalytics();
}

initializeAnalytics();

// Periodic save (to both Firebase and local)
const saveInterval = setInterval(async () => {
  saveAnalytics(); // Local backup
  if (firebaseAnalytics.isInitialized()) {
    await firebaseAnalytics.saveAnalytics(analytics); // Firebase primary
  }
}, SAVE_INTERVAL_MS);

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

// =============================================================================
// Helpers
// =============================================================================

/** Extract usr_ key from ?api_key= or ?apiKey= query param */
function getHostedUserKeyFromQuery(req: Request): string | undefined {
  const candidate = req.query.api_key ?? req.query.apiKey;
  return typeof candidate === 'string' && candidate.startsWith('usr_')
    ? candidate
    : undefined;
}

/** Normalize route for analytics (mask user keys) */
function normalizeRouteForAnalytics(req: Request): string {
  if (req.path.startsWith('/mcp/usr_')) return '/mcp/:userKey';
  return req.path;
}

// =============================================================================
// MCP Server factory
// =============================================================================

/**
 * Creates an MCP server instance with the provided credentials.
 * Credentials are passed directly to the AWS LocationClient via closure —
 * no global process.env mutation.
 */
function createMcpServer(config: ResolvedCredentials): McpServer {
  // Create a request-scoped LocationClient with explicit credentials
  const locationClient = createLocationClient({
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
    region: config.awsRegion,
  });

  const server = new McpServer({
    name: 'grabmaps',
    description: 'GrabMaps API integration for Model Context Protocol',
    version: SERVER_VERSION,
  });

  // Register Places API tools — pass locationClient via closure
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
    (params) => placeActions.searchPlaceIndexForText(params, locationClient)
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
    (params) => placeActions.searchPlaceIndexForPosition(params, locationClient)
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
    (params) => placeActions.searchPlaceIndexForSuggestions(params, locationClient)
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
    (params) => placeActions.getPlace(params, locationClient)
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
    (params) => routeActions.calculateRoute(params, locationClient)
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
    (params) => routeActions.calculateRouteMatrix(params, locationClient)
  );

  return server;
}

// =============================================================================
// Per-request MCP handler
// =============================================================================

async function handleMcpRequest(
  req: Request,
  res: Response,
  credentials: ResolvedCredentials,
): Promise<void> {
  // Track tool calls
  if (req.body?.method === 'tools/call' && req.body?.params?.name) {
    trackToolCall(req.body.params.name, req);
  }

  const mcpServer = createMcpServer(credentials);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    void transport.close();
    void mcpServer.close();
  };

  res.once('finish', cleanup);
  res.once('close', cleanup);

  try {
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    cleanup();

    if (error instanceof HttpError) {
      if (!res.headersSent) {
        res.status(error.status).json({ error: error.code, message: error.message });
      }
      return;
    }

    console.error('Unhandled MCP HTTP error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'internal_error', message: 'Unexpected server error' });
    }
  }
}

// =============================================================================
// Discovery handler (no credentials needed)
// =============================================================================

async function handleDiscoveryRequest(req: Request, res: Response): Promise<void> {
  console.log(`[DEBUG] Handling discovery request: ${req.body?.method}`);

  const demoServer = new McpServer({
    name: 'grabmaps-mcp',
    version: SERVER_VERSION,
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
      logging: {}
    }
  });

  // Register all tools for discovery (demo versions)
  demoServer.tool('searchPlaceIndexForText', 'Search for places using text query. GrabMaps supports 8 Southeast Asian countries: Malaysia, Singapore, Thailand, Myanmar, Cambodia, Vietnam, Philippines, Indonesia.', {}, async () => ({
    content: [{ type: 'text', text: 'Demo: Requires GrabMaps credentials' }]
  }));
  demoServer.tool('searchPlaceIndexForPosition', 'Search for places by coordinates (reverse geocoding). Supports Southeast Asia only.', {}, async () => ({
    content: [{ type: 'text', text: 'Demo: Requires GrabMaps credentials' }]
  }));
  demoServer.tool('searchPlaceIndexForSuggestions', 'Get place suggestions based on partial text input. Supports Southeast Asia only.', {}, async () => ({
    content: [{ type: 'text', text: 'Demo: Requires GrabMaps credentials' }]
  }));
  demoServer.tool('getPlace', 'Get place details by place ID. Supports Southeast Asia only.', {}, async () => ({
    content: [{ type: 'text', text: 'Demo: Requires GrabMaps credentials' }]
  }));
  demoServer.tool('calculateRoute', 'Calculate a route between two points. Supports Car, Truck, Walking, Bicycle, Motorcycle modes.', {}, async () => ({
    content: [{ type: 'text', text: 'Demo: Requires GrabMaps credentials' }]
  }));
  demoServer.tool('calculateRouteMatrix', 'Calculate route matrix between multiple origins and destinations.', {}, async () => ({
    content: [{ type: 'text', text: 'Demo: Requires GrabMaps credentials' }]
  }));

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    void transport.close();
    void demoServer.close();
  };

  res.once('finish', cleanup);
  res.once('close', cleanup);

  try {
    await demoServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    cleanup();
    console.error('Discovery request error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'internal_error', message: 'Discovery request failed' });
    }
  }
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Smithery server-card.json endpoint for external MCP discovery
 */
app.get('/.well-known/mcp/server-card.json', (req: Request, res: Response) => {
  trackRequest(req, '/.well-known/mcp/server-card.json');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({
    name: 'grabmaps-mcp',
    version: SERVER_VERSION,
    description: 'MCP server for GrabMaps API - Places & Routes for Southeast Asia (Malaysia, Singapore, Thailand, Myanmar, Cambodia, Vietnam, Philippines, Indonesia)',
    homepage: 'https://github.com/hithereiamaliff/mcp-grabmaps',
    transport: {
      type: 'streamable-http',
      url: '/mcp'
    },
    capabilities: {
      tools: true,
      resources: true,
      prompts: true
    },
    authentication: {
      type: 'api-key',
      description: 'Provide your usr_XXXXXXXX API key via query param or URL path',
      options: {
        queryParam: '/mcp?api_key=usr_XXXXXXXX',
        path: '/mcp/usr_XXXXXXXX',
      },
    },
  });
});

/**
 * Smithery mcp-config endpoint for session configuration
 */
app.get('/.well-known/mcp-config', (req: Request, res: Response) => {
  trackRequest(req, '/.well-known/mcp-config');
  res.json({
    schema: {
      type: 'object',
      properties: {
        api_key: {
          type: 'string',
          description: 'Your MCP Key Service API key (starts with usr_)',
          title: 'API Key',
          format: 'password',
        },
      },
      required: ['api_key'],
    },
  });
});

/**
 * Root endpoint - Server info and usage instructions
 */
app.get('/', (req: Request, res: Response) => {
  trackRequest(req, '/');
  res.json({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    description: 'MCP server for GrabMaps API (Places & Routes)',
    transport: 'streamable-http',
    authentication: 'MCP Key Service (usr_XXXXXXXX)',
    usage: {
      queryParam: '/mcp?api_key=usr_XXXXXXXX',
      path: '/mcp/usr_XXXXXXXX',
    },
    endpoints: {
      health: '/health',
      mcp: '/mcp?api_key=usr_XXXXXXXX',
      mcpPath: '/mcp/usr_XXXXXXXX',
      analytics: '/analytics',
      dashboard: '/analytics/dashboard',
      discovery: '/.well-known/mcp/server-card.json',
    },
    keyServiceStatus: isKeyServiceEnabled() ? 'configured' : 'not configured',
    supportedCountries: ['Malaysia (MYS)', 'Singapore (SGP)', 'Thailand (THA)', 'Myanmar (MMR)', 'Cambodia (KHM)', 'Vietnam (VNM)', 'Philippines (PHL)', 'Indonesia (IDN)'],
    uptime: formatUptime(Date.now() - serverStartTime),
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  trackRequest(req, '/health');
  res.json({
    status: 'healthy',
    server: SERVER_NAME,
    version: SERVER_VERSION,
    transport: 'streamable-http',
    uptime: formatUptime(Date.now() - serverStartTime),
    timestamp: new Date().toISOString(),
    firebase: firebaseAnalytics.isInitialized() ? 'connected' : 'not configured',
  });
});

/**
 * Analytics endpoint - JSON data
 */
app.get('/analytics', (req: Request, res: Response) => {
  res.json({
    ...analytics,
    uptime: formatUptime(Date.now() - serverStartTime),
    firebase: firebaseAnalytics.isInitialized() ? 'connected' : 'not configured',
  });
});

/**
 * Analytics dashboard - HTML with Chart.js
 */
app.get('/analytics/dashboard', (req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GrabMaps MCP - Analytics Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #e0e0e0;
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: rgba(255,255,255,0.05);
      border-radius: 15px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .header h1 { color: #00d4aa; font-size: 2rem; margin-bottom: 10px; }
    .header p { color: #888; }
    .firebase-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      margin-top: 10px;
    }
    .firebase-connected { background: rgba(0,212,170,0.2); color: #00d4aa; }
    .firebase-disconnected { background: rgba(255,107,107,0.2); color: #ff6b6b; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: rgba(255,255,255,0.05);
      border-radius: 15px;
      padding: 25px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.1);
      transition: transform 0.2s;
    }
    .stat-card:hover { transform: translateY(-5px); }
    .stat-value { font-size: 2.5rem; font-weight: bold; color: #00d4aa; }
    .stat-label { color: #888; margin-top: 5px; font-size: 0.9rem; }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .chart-card {
      background: rgba(255,255,255,0.05);
      border-radius: 15px;
      padding: 20px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .chart-card h3 { color: #00d4aa; margin-bottom: 15px; font-size: 1.1rem; }
    .recent-activity {
      background: rgba(255,255,255,0.05);
      border-radius: 15px;
      padding: 20px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .recent-activity h3 { color: #00d4aa; margin-bottom: 15px; }
    .activity-list { list-style: none; max-height: 300px; overflow-y: auto; }
    .activity-item {
      padding: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .activity-item:last-child { border-bottom: none; }
    .tool-name { color: #00d4aa; font-weight: 500; }
    .timestamp { color: #666; font-size: 0.85rem; }
    .refresh-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #00d4aa;
      color: #1a1a2e;
      border: none;
      padding: 15px 25px;
      border-radius: 30px;
      cursor: pointer;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0,212,170,0.3);
      transition: transform 0.2s;
    }
    .refresh-btn:hover { transform: scale(1.05); }
    @media (max-width: 768px) {
      .charts-grid { grid-template-columns: 1fr; }
      .stat-value { font-size: 2rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📍 GrabMaps MCP Analytics</h1>
      <p>Real-time analytics for GrabMaps MCP Server</p>
      <span id="firebaseBadge" class="firebase-badge firebase-disconnected">Firebase: Checking...</span>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value" id="totalRequests">0</div>
        <div class="stat-label">Total Requests</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="totalToolCalls">0</div>
        <div class="stat-label">Tool Calls</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="uptime">0m</div>
        <div class="stat-label">Uptime</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="uniqueClients">0</div>
        <div class="stat-label">Unique Clients</div>
      </div>
    </div>
    
    <div class="charts-grid">
      <div class="chart-card">
        <h3>🛠️ Tool Usage</h3>
        <canvas id="toolsChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>📈 Hourly Requests (Last 24h)</h3>
        <canvas id="hourlyChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>🌐 Requests by Endpoint</h3>
        <canvas id="endpointChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>📊 Request Methods</h3>
        <canvas id="methodChart"></canvas>
      </div>
    </div>
    
    <div class="recent-activity">
      <h3>🕐 Recent Tool Calls</h3>
      <ul class="activity-list" id="activityList">
        <li class="activity-item">Loading...</li>
      </ul>
    </div>
  </div>
  
  <button class="refresh-btn" onclick="loadData()">🔄 Refresh</button>
  
  <script>
    let toolsChart, hourlyChart, endpointChart, methodChart;
    const chartColors = ['#00d4aa', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
    
    async function loadData() {
      try {
        const basePath = window.location.pathname.replace(/\\/analytics\\/dashboard\\/?$/, '');
        const res = await fetch(basePath + '/analytics');
        const data = await res.json();
        updateDashboard(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      }
    }
    
    function updateDashboard(data) {
      document.getElementById('totalRequests').textContent = data.totalRequests?.toLocaleString() || '0';
      document.getElementById('totalToolCalls').textContent = data.totalToolCalls?.toLocaleString() || '0';
      document.getElementById('uptime').textContent = data.uptime || '0m';
      document.getElementById('uniqueClients').textContent = Object.keys(data.clientsByIp || {}).length;
      
      // Firebase badge
      const badge = document.getElementById('firebaseBadge');
      if (data.firebase === 'connected') {
        badge.textContent = '🔥 Firebase: Connected';
        badge.className = 'firebase-badge firebase-connected';
      } else {
        badge.textContent = '⚠️ Firebase: Not Configured';
        badge.className = 'firebase-badge firebase-disconnected';
      }
      
      updateToolsChart(data.toolCalls || {});
      updateHourlyChart(data.hourlyRequests || {});
      updateEndpointChart(data.requestsByEndpoint || {});
      updateMethodChart(data.requestsByMethod || {});
      updateActivityList(data.recentToolCalls || []);
    }
    
    function updateToolsChart(toolCalls) {
      const ctx = document.getElementById('toolsChart').getContext('2d');
      const labels = Object.keys(toolCalls);
      const values = Object.values(toolCalls);
      
      if (toolsChart) toolsChart.destroy();
      toolsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['No data'],
          datasets: [{
            data: values.length ? values : [1],
            backgroundColor: chartColors,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom', labels: { color: '#888' } } }
        }
      });
    }
    
    function updateHourlyChart(hourlyRequests) {
      const ctx = document.getElementById('hourlyChart').getContext('2d');
      const sortedHours = Object.keys(hourlyRequests).sort().slice(-24);
      const labels = sortedHours.map(h => h.split('T')[1] + ':00');
      const values = sortedHours.map(h => hourlyRequests[h]);
      
      if (hourlyChart) hourlyChart.destroy();
      hourlyChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels.length ? labels : ['No data'],
          datasets: [{
            label: 'Requests',
            data: values.length ? values : [0],
            borderColor: '#00d4aa',
            backgroundColor: 'rgba(0,212,170,0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
    
    function updateEndpointChart(endpoints) {
      const ctx = document.getElementById('endpointChart').getContext('2d');
      const labels = Object.keys(endpoints);
      const values = Object.values(endpoints);
      
      if (endpointChart) endpointChart.destroy();
      endpointChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels.length ? labels : ['No data'],
          datasets: [{
            data: values.length ? values : [0],
            backgroundColor: chartColors,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          indexAxis: 'y',
          scales: {
            x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
            y: { ticks: { color: '#888' }, grid: { display: false } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
    
    function updateMethodChart(methods) {
      const ctx = document.getElementById('methodChart').getContext('2d');
      const labels = Object.keys(methods);
      const values = Object.values(methods);
      
      if (methodChart) methodChart.destroy();
      methodChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels.length ? labels : ['No data'],
          datasets: [{
            data: values.length ? values : [1],
            backgroundColor: chartColors,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom', labels: { color: '#888' } } }
        }
      });
    }
    
    function updateActivityList(recentCalls) {
      const list = document.getElementById('activityList');
      if (!recentCalls.length) {
        list.innerHTML = '<li class="activity-item">No recent tool calls</li>';
        return;
      }
      list.innerHTML = recentCalls.slice(0, 20).map(call => \`
        <li class="activity-item">
          <span class="tool-name">\${call.tool}</span>
          <span class="timestamp">\${new Date(call.timestamp).toLocaleString()}</span>
        </li>
      \`).join('');
    }
    
    loadData();
    setInterval(loadData, 30000);
  </script>
</body>
</html>`;
  res.type('html').send(html);
});

// =============================================================================
// MCP endpoints — per-request isolation
// =============================================================================

/**
 * Hosted key-service mode: /mcp/:userKey
 * Must be registered BEFORE /mcp to avoid Express matching usr_ as a query.
 */
app.all('/mcp/:userKey', async (req: Request, res: Response) => {
  trackRequest(req, normalizeRouteForAnalytics(req));

  try {
    if (!isKeyServiceEnabled()) {
      res.status(503).json({ error: 'service_unavailable', message: 'Key service not configured on this server.' });
      return;
    }

    const userKey = req.params.userKey;
    if (!userKey.startsWith('usr_')) {
      res.status(403).json({ error: 'invalid_key', message: 'API key must start with usr_' });
      return;
    }

    const result = await resolveKeyCredentials(userKey);
    if (!result.ok) {
      const status = result.reason === 'invalid_key' ? 403 : 503;
      const message = result.reason === 'invalid_key'
        ? 'Invalid or expired API key.'
        : result.reason === 'malformed_response'
          ? 'Authentication service returned incomplete credentials.'
          : 'Authentication service temporarily unavailable. Try again later.';
      res.status(status).json({ error: result.reason, message });
      return;
    }

    console.log(`[grabmaps-mcp] Resolved user key ${userKey.substring(0, 12)}...`);
    await handleMcpRequest(req, res, result.credentials);
  } catch (error) {
    if (error instanceof HttpError && !res.headersSent) {
      res.status(error.status).json({ error: error.code, message: error.message });
    } else if (!res.headersSent) {
      console.error('MCP request error:', error);
      res.status(500).json({ error: 'internal_error', message: 'Unexpected error' });
    }
  }
});

/**
 * MCP endpoint: /mcp
 * Supports ?api_key=usr_... query param and discovery requests.
 */
app.all('/mcp', async (req: Request, res: Response) => {
  trackRequest(req, '/mcp');

  try {
    // Check for hosted key-service query param
    const hostedUserKey = getHostedUserKeyFromQuery(req);

    // Detect discovery requests (Smithery scanning, no credentials)
    const mcpMethod = req.body?.method;
    const isDiscovery = !hostedUserKey && mcpMethod && (
      mcpMethod === 'initialize' ||
      mcpMethod === 'tools/list' ||
      mcpMethod === 'resources/list' ||
      mcpMethod === 'prompts/list' ||
      mcpMethod === 'notifications/initialized'
    );

    if (isDiscovery) {
      await handleDiscoveryRequest(req, res);
      return;
    }

    if (hostedUserKey) {
      // Hosted key-service via ?api_key=usr_...
      if (!isKeyServiceEnabled()) {
        res.status(503).json({ error: 'service_unavailable', message: 'Key service not configured on this server.' });
        return;
      }

      const result = await resolveKeyCredentials(hostedUserKey);
      if (!result.ok) {
        const status = result.reason === 'invalid_key' ? 403 : 503;
        const message = result.reason === 'invalid_key'
          ? 'Invalid or expired API key.'
          : result.reason === 'malformed_response'
            ? 'Authentication service returned incomplete credentials.'
            : 'Authentication service temporarily unavailable. Try again later.';
        res.status(status).json({ error: result.reason, message });
        return;
      }

      console.log(`[grabmaps-mcp] Resolved user key ${hostedUserKey.substring(0, 12)}...`);
      await handleMcpRequest(req, res, result.credentials);
    } else {
      // No credentials provided and not a discovery request
      res.status(400).json({
        error: 'missing_auth',
        message: 'Provide a usr_XXXXXXXX API key to authenticate.',
        usage: {
          queryParam: '/mcp?api_key=usr_XXXXXXXX',
          path: '/mcp/usr_XXXXXXXX',
        },
      });
    }
  } catch (error) {
    if (error instanceof HttpError && !res.headersSent) {
      res.status(error.status).json({ error: error.code, message: error.message });
    } else if (!res.headersSent) {
      console.error('MCP request error:', error);
      res.status(500).json({ error: 'internal_error', message: 'Unexpected error' });
    }
  }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, HOST, () => {
  console.log(`
🚀 ${SERVER_NAME} (HTTP) running on http://${HOST}:${PORT}
   Health:      http://${HOST}:${PORT}/health
   MCP (query): http://${HOST}:${PORT}/mcp?api_key=usr_XXXXXXXX
   MCP (path):  http://${HOST}:${PORT}/mcp/usr_XXXXXXXX
   Key Service: ${isKeyServiceEnabled() ? 'configured' : 'NOT configured'}

📍 Supported Countries: Malaysia, Singapore, Thailand, Myanmar, Cambodia, Vietnam, Philippines, Indonesia
`);
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  clearInterval(saveInterval);
  saveAnalytics(); // Save to local file
  if (firebaseAnalytics.isInitialized()) {
    await firebaseAnalytics.saveAnalytics(analytics); // Save to Firebase
  }
  console.log('Analytics saved. Goodbye!');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
