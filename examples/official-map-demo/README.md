# GrabMaps Official Integration Demo

This demo showcases the integration of GrabMaps using the official MapLibre GL JS library and AWS Location Service. It provides a comprehensive testing interface for all GrabMaps components (Places, Maps, Routes) via the MCP server.

## Features

### Places API
- Forward geocoding (place search by text)
- Reverse geocoding (find places at a specific location)
- Place details retrieval

### Maps API
- Interactive map display using official GrabMaps tiles
- Map style descriptor testing
- Map tile testing with configurable zoom and coordinates
- Map sprites testing
- Map glyphs testing

### Routes API
- Route calculation between selected places
- Route matrix calculation
- Visual route display on map

## Setup

1. Make sure the MCP server is running on `http://localhost:3000`
2. Open `index.html` in a web browser
3. Navigate to the Setup tab
4. Enter your GrabMaps API key (or use the default one provided)
5. Configure region and resource names as needed
6. Click "Initialize Map" to load the map

## Usage

### Places Tab
1. Search for places using the search box
2. Click anywhere on the map to perform reverse geocoding
3. Click on search results to view place details
4. Select two places to calculate a route between them

### Maps Tab
1. Test the style descriptor to view the map style JSON
2. Test map tiles with specific z/x/y coordinates
3. Test map sprites to view icon images and sprite data
4. Test map glyphs with configurable font stack and Unicode range

### Routes Tab
1. Calculate routes between selected places
2. View route information (distance, duration)
3. Test route matrix calculation between multiple origins and destinations
4. Clear routes using the "Clear Route" button

## Technical Details

This demo uses:

- MapLibre GL JS v3.x for map rendering
- AWS Location Service for GrabMaps integration
- MCP server endpoints for all GrabMaps components
- Tabbed interface for better organization of features
- Coordinate display for precise location information

## Configuration Options

- **API Key**: Your GrabMaps API key
- **Region**: The AWS region (e.g., ap-southeast-5 for Malaysia, ap-southeast-1 for Singapore)
- **Map Name**: The AWS Location Service map resource name (default: explore.map.Grab)
- **Place Index Name**: The AWS Location Service place index resource name (default: explore.place.Grab)
- **Route Calculator Name**: The AWS Location Service route calculator resource name (default: explore.route-calculator.Grab)

## Notes

- This demo requires an internet connection to access GrabMaps services
- A valid API key is required for all functionality
- The map displays coordinates at the bottom left as you move your mouse
- Clicking on the map will add a marker and perform reverse geocoding
- The demo is designed to test all aspects of the GrabMaps MCP server integration
- Uses official GrabMaps map tiles and styling using the recommended MapLibre GL integration through your MCP server

For production use, you should:
1. Secure your API keys
2. Add error handling for network issues
3. Optimize the map loading process
