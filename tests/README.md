# GrabMaps MCP Server Tests

This directory contains test files for the GrabMaps MCP server.

## Test Files

- `test-suite.js` - Comprehensive test suite that runs all tests
- `test-places-api.js` - Standalone test for Places API endpoints
- `test-maps-api.js` - Standalone test for Maps API endpoints
- `test-routes-api.js` - Standalone test for Routes API endpoints

## Running Tests

You can run the tests in two ways:

### Using npm

```bash
# Start the MCP server in one terminal
npm start

# Run the test suite in another terminal
npm test
```

### Running individual test files

```bash
# Start the MCP server in one terminal
npm start

# Run a specific test file in another terminal
node tests/test-places-api.js
node tests/test-maps-api.js
node tests/test-routes-api.js
```

## Documentation

For detailed testing instructions, examples, and troubleshooting tips, please refer to the [TESTING.md](./TESTING.md) file.
