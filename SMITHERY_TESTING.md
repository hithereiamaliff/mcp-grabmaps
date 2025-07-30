# Testing GrabMaps MCP in Smithery Playground

This guide explains how to test the GrabMaps MCP server in the Smithery playground, focusing on the Places and Routes APIs.

## Prerequisites

1. Make sure the GrabMaps MCP server is running on port 3000:
   ```
   npm run dev
   ```

2. Open the Smithery playground at: https://smithery.ai/playground

## Connecting to Your MCP Server

1. In the Smithery playground, click on "Connect to MCP"
2. Enter your local MCP server URL: `http://localhost:3000`
3. Click "Connect"

## Testing Places API

### Search Places by Text

```json
{
  "method": "searchPlaceIndexForText",
  "params": {
    "text": "KLCC, Kuala Lumpur",
    "placeIndexName": "explore.place.Grab",
    "maxResults": 5
  }
}
```

### Search Places by Position (Reverse Geocoding)

```json
{
  "method": "searchPlaceIndexForPosition",
  "params": {
    "position": [101.6942, 3.1516],
    "placeIndexName": "explore.place.Grab",
    "maxResults": 5
  }
}
```

### Get Place Details

```json
{
  "method": "getPlace",
  "params": {
    "placeId": "PLACE_ID_FROM_SEARCH_RESULTS",
    "placeIndexName": "explore.place.Grab"
  }
}
```

## Testing Routes API

### Calculate Route

```json
{
  "method": "calculateRoute",
  "params": {
    "origin": {
      "longitude": 101.6942,
      "latitude": 3.1516
    },
    "destination": {
      "longitude": 101.7068,
      "latitude": 3.1587
    },
    "routeCalculatorName": "explore.route.Grab",
    "travelMode": "Car"
  }
}
```

### Calculate Route Matrix

```json
{
  "method": "calculateRouteMatrix",
  "params": {
    "departurePositions": [
      [101.6942, 3.1516],
      [101.6867, 3.1577]
    ],
    "destinationPositions": [
      [101.7068, 3.1587],
      [101.6983, 3.1349]
    ],
    "routeCalculatorName": "explore.route.Grab",
    "travelMode": "Car"
  }
}
```

## Notes on Maps API

The Maps API components are best used directly through the official GrabMaps integration with MapLibre GL, as demonstrated in the `examples/official-map-demo` directory. The MCP server has some limitations when handling map tiles, sprites, and glyphs due to AWS Location Service constraints.

For map visualization, we recommend using the direct integration approach shown in the official demo.
