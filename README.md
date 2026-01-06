# GrabMaps MCP Server

A Model Context Protocol (MCP) server for GrabMaps API integration, providing access to GrabMaps services through AWS Location Service.

Do note that this MCP server is **NOT** officially affiliated with Grab, GrabMaps, or AWS Location Service.

> **Important**: GrabMaps only supports eight countries in Southeast Asia.
> 
> - 🇲🇾 Malaysia (MYS)
> - 🇸🇬 Singapore (SGP)
> - 🇹🇭 Thailand (THA)
> - 🇲🇲 Myanmar (MMR)
> - 🇰🇭 Cambodia (KHM)
> - 🇻🇳 Vietnam (VNM)
> - 🇵🇭 Philippines (PHL)
> - 🇮🇩 Indonesia (IDN)
>
> Search requests outside these countries will not return accurate results.

## Features

This MCP server provides access to GrabMaps functionality through two main categories:

### Places Actions (Available via MCP)
- **SearchPlaceIndexForText**: Forward geocoding to find places by name or address
- **SearchPlaceIndexForPosition**: Reverse geocoding to find places by coordinates
- **SearchPlaceIndexForSuggestions**: Get place suggestions as you type
- **GetPlace**: Retrieve detailed information about a specific place

### Routes Actions (Available via MCP)
- **CalculateRoute**: Calculate routes between points with waypoints
- **CalculateRouteMatrix**: Calculate a matrix of routes between multiple origins and destinations

### Analytics & Monitoring
- **Firebase Analytics**: Cloud-based analytics storage with Firebase Realtime Database
- **Local Backup**: Automatic local file backup as fallback
- **Visual Dashboard**: Real-time analytics dashboard with Chart.js
- **Request Tracking**: Track requests by method, endpoint, client IP, and user agent
- **Tool Call Tracking**: Monitor MCP tool usage and performance

### Maps Functionality (Requires AWS Console)
**Note**: Map rendering functionality is not directly available through the MCP server. To view and use maps:

1. Go to the AWS Location Service console
2. Look for the Maps section and click the "Try it" button
3. Ensure "Grab" is selected as the provider

To explore GrabMaps data coverage and see the maps in action without logging in to AWS, visit:
[https://grabmaps.grab.com/explore-data-coverage](https://grabmaps.grab.com/explore-data-coverage)

## Installation

### From NPM

```bash
npm install mcp-grabmaps
```

### From Source

```bash
git clone https://github.com/hithereiamaliff/mcp-grabmaps.git
cd mcp-grabmaps
npm install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# GrabMaps API credentials
GRABMAPS_API_KEY=your_grabmaps_api_key_here

# AWS credentials for AWS Location Service
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=ap-southeast-5  # Default region for Malaysia (ap-southeast-1 for Singapore)

# Place Index name (default for GrabMaps)
PLACE_INDEX_NAME=explore.place.Grab

# Map name (for rendering maps)
MAP_NAME=explore.map.Grab

# Route calculator name
ROUTE_CALCULATOR_NAME=explore.route-calculator.Grab

# Server port
PORT=3000
```

## Usage

### Method 1: Running Locally

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Method 2: Using with Smithery

```bash
# Run in development mode
npm run smithery:dev

# Build for production
npm run smithery:build

# Deploy to Smithery
npm run smithery:deploy
```

#### Testing in Smithery Playground

For the best experience testing Places and Routes APIs, we recommend using the Smithery playground:

1. Start your MCP server locally: `npm run dev`
2. Open the Smithery playground at: https://smithery.ai/playground
3. Connect to your local MCP server: `http://localhost:3000`
4. Test Places and Routes API calls using the provided examples in [SMITHERY_TESTING.md](./tests/SMITHERY_TESTING.md)

### Method 3: Self-Hosted VPS Deployment

Deploy the MCP server on your own VPS with Docker and Nginx. This method supports **per-user credentials via URL query parameters**, allowing multiple users to connect with their own GrabMaps and AWS credentials.

#### VPS URL Format

```
https://mcp.techmavie.digital/grabmaps/mcp?grabMapsApiKey=YOUR_KEY&awsAccessKeyId=YOUR_AWS_KEY&awsSecretAccessKey=YOUR_AWS_SECRET
```

**Query Parameters:**

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `grabMapsApiKey` | ✅ Yes | Your GrabMaps API key | `your-grabmaps-api-key` |
| `awsAccessKeyId` | ✅ Yes | Your AWS Access Key ID | `AKIAIOSFODNN7EXAMPLE` |
| `awsSecretAccessKey` | ✅ Yes | Your AWS Secret Access Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `awsRegion` | ❌ No | AWS Region (default: ap-southeast-5) | `ap-southeast-1` |

#### Client Configuration

**Claude Desktop:**
```json
{
  "mcpServers": {
    "grabmaps": {
      "transport": "streamable-http",
      "url": "https://mcp.techmavie.digital/grabmaps/mcp?grabMapsApiKey=YOUR_KEY&awsAccessKeyId=YOUR_AWS_KEY&awsSecretAccessKey=YOUR_AWS_SECRET"
    }
  }
}
```

**Cursor/Windsurf:** Same format in their MCP configuration files.

#### Live Demo

A public instance is available at:
```
https://mcp.techmavie.digital/grabmaps/mcp
```

Provide your credentials via query parameters as shown above.

---

## VPS Deployment

### Architecture

```
Client (Claude, Cursor, Windsurf, etc.)
    ↓ HTTPS
https://mcp.techmavie.digital/grabmaps/mcp
    ↓
Nginx (SSL termination + reverse proxy)
    ↓ HTTP
Docker Container (port 8092 → 8080)
    ↓
GrabMaps MCP Server (Streamable HTTP Transport)
    ↓
GrabMaps API + AWS Location Service
```

### Deployment Files

| File | Description |
|------|-------------|
| `src/http-server.ts` | HTTP server with Streamable HTTP transport |
| `Dockerfile` | Container configuration for VPS |
| `docker-compose.yml` | Docker orchestration (port 8092) |
| `deploy/nginx-mcp.conf` | Nginx reverse proxy configuration |
| `.github/workflows/deploy-vps.yml` | Auto-deployment via GitHub Actions |

### Quick Deploy

```bash
# On your VPS
mkdir -p /opt/mcp-servers/grabmaps
cd /opt/mcp-servers/grabmaps
git clone https://github.com/hithereiamaliff/mcp-grabmaps.git .
docker compose up -d --build

# Configure Nginx (add location block from deploy/nginx-mcp.conf)
sudo nano /etc/nginx/sites-available/mcp.techmavie.digital
sudo nginx -t
sudo systemctl reload nginx
```

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | Server info and usage instructions |
| `/health` | Health check with Firebase status |
| `/mcp` | MCP endpoint (requires credentials) |
| `/analytics` | Analytics data (JSON) |
| `/analytics/dashboard` | Visual analytics dashboard |

---

## Firebase Analytics

The VPS deployment includes Firebase Realtime Database integration for cloud-based analytics storage.

### Features

- **Dual Storage**: Firebase (primary) + local file backup (fallback)
- **Real-time Tracking**: Requests, tool calls, client IPs, user agents
- **Visual Dashboard**: Chart.js dashboard at `/analytics/dashboard`
- **Persistent**: Analytics survive container restarts and redeployments
- **Auto-save**: Saves every 60 seconds + on graceful shutdown

### Analytics Data Tracked

- Total requests and tool calls
- Requests by method (GET, POST)
- Requests by endpoint (/, /health, /mcp, /analytics)
- Tool usage statistics
- Client tracking (IP addresses, user agents)
- Hourly request patterns
- Recent tool call history

### Firebase Setup

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for complete setup instructions.

**Quick setup:**
```bash
# On VPS
cd /opt/mcp-servers/grabmaps
mkdir -p .credentials
nano .credentials/firebase-service-account.json  # Paste your Firebase service account JSON

# Copy to Docker volume
docker volume create grabmaps_firebase-credentials
docker run --rm \
  -v grabmaps_firebase-credentials:/credentials \
  -v $(pwd)/.credentials:/source:ro \
  alpine cp /source/firebase-service-account.json /credentials/

# Fix permissions
docker run --rm \
  -v grabmaps_firebase-credentials:/credentials \
  alpine chown -R 1001:1001 /credentials/

# Restart
docker compose down
docker compose up -d --build
```

### Viewing Analytics

- **Dashboard**: `https://mcp.techmavie.digital/grabmaps/analytics/dashboard`
- **JSON API**: `https://mcp.techmavie.digital/grabmaps/analytics`
- **Firebase Console**: https://console.firebase.google.com/ → Your Project → Realtime Database

### Firebase Data Structure

```
mcp-analytics/
  └── mcp-grabmaps/
      ├── serverStartTime: "2026-01-06T..."
      ├── totalRequests: 123
      ├── totalToolCalls: 45
      ├── requestsByMethod: {...}
      ├── requestsByEndpoint: {...}
      ├── toolCalls: {...}
      ├── recentToolCalls: [...]
      ├── clientsByIp: {...}
      ├── clientsByUserAgent: {...}
      ├── hourlyRequests: {...}
      └── lastUpdated: 1704470400000
```

---

## Important Notes for AI Models

### Supported Countries

GrabMaps **ONLY** supports the following eight countries in Southeast Asia:

- Malaysia (MYS)
- Singapore (SGP)
- Thailand (THA)
- Myanmar (MMR)
- Cambodia (KHM)
- Vietnam (VNM)
- Philippines (PHL)
- Indonesia (IDN)

AI models should not attempt to use GrabMaps for locations outside these countries as results will be inaccurate or non-existent.

### Country Code Requirements

When using the Places API functions, AI models **MUST** analyze the user's query to determine the appropriate country and include the three-letter ISO country code in all requests:

```json
{
  "query": "City Square Mall",
  "country": "SGP"  // SGP for Singapore, MYS for Malaysia, THA for Thailand, etc.
}
```

Examples of country codes:
- Singapore: SGP
- Malaysia: MYS
- Thailand: THA
- Indonesia: IDN
- Philippines: PHL
- Vietnam: VNM

Including the country code is critical for returning accurate search results.

This approach allows you to test the Places and Routes functionality without needing to set up map visualization components.

### Example API Calls

#### Forward Geocoding

```javascript
const response = await fetch('http://localhost:3000/searchPlaceIndexForText', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'KLCC, Kuala Lumpur',
    country: 'my',
    maxResults: 5
  })
});

const data = await response.json();
console.log(data);
```

#### Calculate Route

```javascript
const response = await fetch('http://localhost:3000/calculateRoute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    origin: {
      longitude: 101.6942371,
      latitude: 3.1516964
    },
    destination: {
      longitude: 101.7113,
      latitude: 3.1421
    },
    travelMode: 'Car'
  })
});

const data = await response.json();
console.log(data);
```

## Integrating with AI Models

This MCP server can be integrated with AI models that support the Model Context Protocol. Example integration with an AI model:

```javascript
// Example of how an AI model would use this MCP server
const result = await mcpClient.call('grabmaps', 'searchPlaceIndexForText', {
  query: 'KLCC, Kuala Lumpur',
  country: 'my'
});

// The AI model can then use the result in its response
console.log(`The coordinates of KLCC are: ${result.results[0].coordinates.latitude}, ${result.results[0].coordinates.longitude}`);
```

## AWS Location Service Setup

Before using this MCP server, you need to set up the following resources in AWS Location Service:

1. Create a Place Index with GrabMaps as the data provider
2. Create a Map with GrabMaps as the data provider
3. Create a Route Calculator with GrabMaps as the data provider

### Map Component Limitations and Recommended Approach

The Maps API components have certain limitations when used through the MCP server:

- Map tiles returned by the `getMapTile` endpoint are binary data encoded as base64 strings
- Font stacks for `getMapGlyphs` must match those supported by GrabMaps via AWS Location Service
- Sprite filenames for `getMapSprites` must follow specific regex patterns
- Maximum zoom levels are restricted (typically max zoom 14)

**Recommended Approach:**
- For Maps: Use direct integration with GrabMaps via MapLibre GL and AWS Location Service as shown in the official demo
- For Places and Routes: Use the MCP server through the Smithery playground or direct API calls

This separation allows for optimal performance and visualization while still leveraging the MCP server for Places and Routes functionality.

## Official GrabMaps MapLibre GL Demo

A comprehensive demo using the official GrabMaps integration with MapLibre GL is included in the `examples/official-map-demo` directory. This demo provides a complete testing interface for all GrabMaps components:

- **Places API**: Forward/reverse geocoding and place details
- **Maps API**: Map tiles, style descriptors, sprites, and glyphs
- **Routes API**: Route calculation and route matrix

The demo features a tabbed interface for easy testing of different components and provides detailed feedback for each API call.

### Key Features

- Interactive map using official GrabMaps map tiles via MapLibre GL
- Tabbed interface for testing different GrabMaps components
- Comprehensive testing of all API endpoints
- Configurable API key, region, and resource names
- Visual display of routes, search results, and map components

To run the demo:

```bash
# Start the MCP server
npm start

# Then open examples/official-map-demo/index.html in your browser
```

See the [Official Map Demo README](examples/official-map-demo/README.md) for setup and usage instructions.

## Testing

A comprehensive test suite is included in the `tests` directory to verify all endpoints are working correctly. For detailed testing instructions, examples, and troubleshooting tips, please refer to the [TESTING.md](./tests/TESTING.md) file.

To run the tests:

```bash
# Start the MCP server in one terminal
npm start

# Run the test suite in another terminal
node tests/test-suite.js
```

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
