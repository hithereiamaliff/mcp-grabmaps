# GrabMaps MCP Visualization Demo

This is a simple demo application that shows how to visualize GrabMaps data using the MCP server. It demonstrates:

1. Searching for places using the Places API
2. Displaying search results on a map
3. Calculating and displaying routes between two points

## Setup

1. Make sure your GrabMaps MCP server is running on `http://localhost:3000`
2. Open `index.html` in a web browser

## How to Use

1. Enter a place name in the search box (e.g., "KLCC, Kuala Lumpur") and click "Search"
2. Click on a search result to set it as the origin point
3. Click on another search result to calculate a route between the two points

## Technical Details

This demo uses:
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides/) for map rendering
- Fetch API to communicate with the GrabMaps MCP server

## Notes

- The demo uses a default Mapbox style for the base map since the GrabMaps style descriptor may not contain all necessary components for visualization
- You'll need an internet connection to load the Mapbox GL JS library and styles
- For a production application, you should replace the placeholder Mapbox token with a valid one or implement a custom style using the GrabMaps tiles

## Customization

To use actual GrabMaps tiles instead of Mapbox:
1. Implement a custom style using the style descriptor from `/getMapStyleDescriptor`
2. Create a custom source that fetches tiles from `/getMapTile`
3. Implement custom sprite and glyph handling using `/getMapSprites` and `/getMapGlyphs`
