# GrabMaps MCP Server Testing Documentation

This document provides information on how to test the GrabMaps MCP server and verify that all endpoints are working correctly.

> **Important**: GrabMaps only supports eight countries in Southeast Asia. Testing with locations outside these countries will not yield accurate results:
> 
> - 🇲🇾 Malaysia (MYS)
> - 🇸🇬 Singapore (SGP)
> - 🇹🇭 Thailand (THA)
> - 🇲🇲 Myanmar (MMR)
> - 🇰🇭 Cambodia (KHM)
> - 🇻🇳 Vietnam (VNM)
> - 🇵🇭 Philippines (PHL)
> - 🇮🇩 Indonesia (IDN)

## Test Suite

A comprehensive test suite is included in the `test-suite.js` file. This test suite covers all the endpoints provided by the GrabMaps MCP server and verifies that they are working correctly.

### Running the Test Suite

To run the test suite, make sure the server is running in one terminal:

```bash
# Terminal 1: Start the server
npm start
```

Then, in another terminal, run the test suite:

```bash
# Terminal 2: Run the test suite
node test-suite.js
```

### Test Results

The test suite will output the results of each test, including:

- Server metadata
- Places API endpoint tests
- Maps API endpoint tests
- Routes API endpoint tests

A successful test run should show "All tests completed successfully!" at the end.

## Individual Test Scripts

In addition to the comprehensive test suite, individual test scripts are provided for testing specific API categories:

### Places API Test

```bash
node test-places-api.js
```

Tests the `searchPlaceIndexForText` endpoint with a query for "Kuala Lumpur".

### Maps API Test

```bash
node test-maps-api.js
```

Tests the `getMapStyleDescriptor` endpoint to retrieve map style information.

### Routes API Test

```bash
node test-routes-api.js
```

Tests the `calculateRoute` endpoint with origin and destination coordinates in Kuala Lumpur.

## Known Issues

- If country code is not specified in place search requests, the system will attempt to detect the country from the query, but this may not always be accurate.
- Map rendering functionality is not directly available through the MCP server. To view and use maps, use the AWS Location Service console or visit the GrabMaps data coverage explorer at https://grabmaps.grab.com/explore-data-coverage.

## Manual Testing

You can also test the endpoints manually using tools like curl, Postman, or any HTTP client:

### Example: Testing searchPlaceIndexForText with curl

```bash
curl -X POST http://localhost:3000/searchPlaceIndexForText \
  -H "Content-Type: application/json" \
  -d '{"query": "KLCC, Kuala Lumpur", "country": "MYS", "maxResults": 5}'
```

**Note**: Always include the `country` parameter with the appropriate 3-letter ISO country code (e.g., "MYS" for Malaysia, "SGP" for Singapore, "THA" for Thailand) for more accurate search results.

### Example: Testing calculateRoute with curl

```bash
curl -X POST http://localhost:3000/calculateRoute \
  -H "Content-Type: application/json" \
  -d '{"origin": {"longitude": 101.6942371, "latitude": 3.1516964}, "destination": {"longitude": 101.7113399, "latitude": 3.1579208}, "travelMode": "Car"}'
```

## Troubleshooting

If you encounter issues with the tests:

1. Verify that your AWS credentials are correctly set in the `.env` file
2. Check that the AWS Location Service resources (Place Index, Map, Route Calculator) are properly configured
3. Ensure that the server is running on the expected port (default: 3000)
4. Check the server logs for any error messages
5. Make sure you're using the correct 3-letter ISO country codes (e.g., "MYS" for Malaysia, "SGP" for Singapore, "THA" for Thailand)

For more detailed information on the API endpoints and their parameters, refer to the README.md file.
