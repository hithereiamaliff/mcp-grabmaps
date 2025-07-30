# GrabMaps MCP Server Testing Documentation

This document provides information on how to test the GrabMaps MCP server and verify that all endpoints are working correctly.

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

- The `getMapTile` endpoint may return a 500 error if the tile coordinates are invalid or if there's an issue with the AWS Location Service.
- The map style descriptor may return empty sources and layers if the map style is not properly configured in AWS Location Service.

## Manual Testing

You can also test the endpoints manually using tools like curl, Postman, or any HTTP client:

### Example: Testing searchPlaceIndexForText with curl

```bash
curl -X POST http://localhost:3000/searchPlaceIndexForText \
  -H "Content-Type: application/json" \
  -d '{"query": "KLCC, Kuala Lumpur", "maxResults": 5}'
```

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

For more detailed information on the API endpoints and their parameters, refer to the README.md file.
