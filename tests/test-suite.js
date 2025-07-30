// Comprehensive test suite for GrabMaps MCP server
const fetch = require('node-fetch');

// Base URL for the MCP server
const BASE_URL = 'http://localhost:3000';

// Test runner function
async function runTests() {
  console.log('Starting GrabMaps MCP Server Test Suite...');
  console.log('=========================================');
  
  try {
    // Test server root endpoint
    await testServerRoot();
    
    // Test Places API endpoints
    await testPlacesAPI();
    
    // Test Maps API endpoints
    await testMapsAPI();
    
    // Test Routes API endpoints
    await testRoutesAPI();
    
    console.log('=========================================');
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

// Test server root endpoint
async function testServerRoot() {
  console.log('\n📋 Testing Server Root Endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Server metadata received:');
    console.log(`   Name: ${data.name}`);
    console.log(`   Version: ${data.version}`);
    console.log(`   Available Actions: ${data.actions ? data.actions.length : 0}`);
    
    return data;
  } catch (error) {
    console.error('❌ Error testing server root:', error);
    throw error;
  }
}

// Test Places API endpoints
async function testPlacesAPI() {
  console.log('\n📋 Testing Places API Endpoints...');
  
  // Test searchPlaceIndexForText
  try {
    console.log('\n🔍 Testing searchPlaceIndexForText...');
    const response = await fetch(`${BASE_URL}/searchPlaceIndexForText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Kuala Lumpur',
        maxResults: 3
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Search results received:');
    console.log(`   Results count: ${data.results ? data.results.length : 0}`);
    if (data.results && data.results.length > 0) {
      console.log(`   First result: ${data.results[0].name}`);
    }
  } catch (error) {
    console.error('❌ Error testing searchPlaceIndexForText:', error);
  }
  
  // Test searchPlaceIndexForPosition
  try {
    console.log('\n🔍 Testing searchPlaceIndexForPosition...');
    const response = await fetch(`${BASE_URL}/searchPlaceIndexForPosition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        longitude: 101.6942371,
        latitude: 3.1516964,
        maxResults: 3
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Reverse geocoding results received:');
    console.log(`   Results count: ${data.results ? data.results.length : 0}`);
    if (data.results && data.results.length > 0) {
      console.log(`   First result: ${data.results[0].name}`);
    }
  } catch (error) {
    console.error('❌ Error testing searchPlaceIndexForPosition:', error);
  }
  
  // Test searchPlaceIndexForSuggestions
  try {
    console.log('\n🔍 Testing searchPlaceIndexForSuggestions...');
    const response = await fetch(`${BASE_URL}/searchPlaceIndexForSuggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Kuala',
        maxResults: 5
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Suggestions received:');
    console.log(`   Suggestions count: ${data.suggestions ? data.suggestions.length : 0}`);
    if (data.suggestions && data.suggestions.length > 0) {
      console.log(`   First suggestion: ${data.suggestions[0].text}`);
    }
  } catch (error) {
    console.error('❌ Error testing searchPlaceIndexForSuggestions:', error);
  }
  
  // Test getPlace
  try {
    console.log('\n🔍 Testing getPlace...');
    // First get a placeId from search
    const searchResponse = await fetch(`${BASE_URL}/searchPlaceIndexForText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'KLCC', maxResults: 1 }),
    });
    
    if (!searchResponse.ok) {
      throw new Error(`HTTP error! Status: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    if (!searchData.results || searchData.results.length === 0) {
      throw new Error('No search results to get placeId');
    }
    
    const placeId = searchData.results[0].placeId;
    console.log(`   Using placeId: ${placeId}`);
    
    const response = await fetch(`${BASE_URL}/getPlace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Place details received:');
    console.log(`   Place name: ${data.name}`);
    console.log(`   Coordinates: ${data.coordinates.latitude}, ${data.coordinates.longitude}`);
  } catch (error) {
    console.error('❌ Error testing getPlace:', error);
  }
}

// Test Maps API endpoints
async function testMapsAPI() {
  console.log('\n📋 Testing Maps API Endpoints...');
  
  // Test getMapStyleDescriptor
  try {
    console.log('\n🗺️ Testing getMapStyleDescriptor...');
    const response = await fetch(`${BASE_URL}/getMapStyleDescriptor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Map style descriptor received');
    console.log(`   Version: ${data.version || 'N/A'}`);
    console.log(`   Name: ${data.name || 'N/A'}`);
    console.log(`   Sources: ${data.sources ? Object.keys(data.sources).length : 0}`);
    console.log(`   Layers: ${data.layers ? data.layers.length : 0}`);
  } catch (error) {
    console.error('❌ Error testing getMapStyleDescriptor:', error);
  }
  
  // Test getMapTile
  try {
    console.log('\n🗺️ Testing getMapTile...');
    const response = await fetch(`${BASE_URL}/getMapTile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        z: 15,
        x: 25905,
        y: 14333,
        format: 'png'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Map tile received');
    console.log(`   Tile data length: ${data.tileBase64 ? data.tileBase64.length : 0} characters`);
  } catch (error) {
    console.error('❌ Error testing getMapTile:', error);
  }
}

// Test Routes API endpoints
async function testRoutesAPI() {
  console.log('\n📋 Testing Routes API Endpoints...');
  
  // Test calculateRoute
  try {
    console.log('\n🚗 Testing calculateRoute...');
    const response = await fetch(`${BASE_URL}/calculateRoute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: {
          longitude: 101.6942371,
          latitude: 3.1516964
        },
        destination: {
          longitude: 101.7113399,
          latitude: 3.1579208
        },
        travelMode: 'Car',
        distanceUnit: 'Kilometers'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Route calculation results:');
    console.log(`   Total distance: ${data.distance} km`);
    console.log(`   Total duration: ${data.duration} seconds`);
    console.log(`   Number of legs: ${data.legs ? data.legs.length : 0}`);
    console.log(`   Geometry points: ${data.geometry ? data.geometry.length : 0}`);
  } catch (error) {
    console.error('❌ Error testing calculateRoute:', error);
  }
  
  // Test calculateRouteMatrix
  try {
    console.log('\n🚗 Testing calculateRouteMatrix...');
    const response = await fetch(`${BASE_URL}/calculateRouteMatrix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origins: [
          { longitude: 101.6942371, latitude: 3.1516964 },
          { longitude: 101.7113399, latitude: 3.1579208 }
        ],
        destinations: [
          { longitude: 101.7113399, latitude: 3.1579208 },
          { longitude: 101.6942371, latitude: 3.1516964 }
        ],
        travelMode: 'Car',
        distanceUnit: 'Kilometers'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Route matrix calculation results:');
    console.log(`   Matrix dimensions: ${data.summary.originCount}x${data.summary.destinationCount}`);
    console.log(`   Matrix data: ${data.routeMatrix ? data.routeMatrix.length : 0} rows`);
  } catch (error) {
    console.error('❌ Error testing calculateRouteMatrix:', error);
  }
}

// Run all tests
runTests();
