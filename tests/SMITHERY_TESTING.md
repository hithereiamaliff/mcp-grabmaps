# Testing GrabMaps MCP Server - Smithery Testing Guide

This document provides examples for testing the GrabMaps MCP server using the Smithery playground.

> **Important**: GrabMaps only supports eight countries in Southeast Asia: Malaysia (MYS), Singapore (SGP), Thailand (THA), Myanmar (MMR), Cambodia (KHM), Vietnam (VNM), Philippines (PHL), and Indonesia (IDN). Testing with locations outside these countries will not yield accurate results.

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

**Note on Country Codes**: For all Places API calls, it's strongly recommended to include the appropriate 3-letter ISO country code in your requests. This ensures more accurate search results. The MCP server will attempt to detect the country from the query if not specified, but explicit specification is more reliable.

### Search Places by Text

```json
{
  "method": "searchPlaceIndexForText",
  "params": {
    "query": "KLCC, Kuala Lumpur",
    "country": "MYS",
    "placeIndexName": "explore.place.Grab",
    "maxResults": 5
  }
}
```

**Important**: Always include the `country` parameter with the appropriate 3-letter ISO country code for more accurate search results. Examples:
- Malaysia: `MYS`
- Singapore: `SGP`
- Thailand: `THA`
- Indonesia: `IDN`
- Philippines: `PHL`
- Vietnam: `VNM`

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

**Note**: While `getPlace` doesn't require a country code (as it uses a specific place ID), the initial search to obtain the place ID should include a country code for best results.

## Testing Routes API

**Note**: Unlike Places API, Routes API doesn't require country codes as it works with precise coordinates.

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
    "routeCalculatorName": "explore.route-calculator.Grab",
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
    "routeCalculatorName": "explore.route-calculator.Grab",
    "travelMode": "Car"
  }
}
```

## Notes on Maps API

The Maps API components are best used directly through the official GrabMaps integration with MapLibre GL, as demonstrated in the `examples/official-map-demo` directory. The MCP server has some limitations when handling map tiles, sprites, and glyphs due to AWS Location Service constraints.

For map visualization, we recommend using the direct integration approach shown in the official demo.
