// Simple test script for GrabMaps MCP server Routes API
// Using CommonJS syntax with node-fetch v2
const fetch = require('node-fetch');

async function testRoutesAPI() {
  try {
    console.log('Testing calculateRoute endpoint...');
    
    // Using coordinates for two locations in Kuala Lumpur
    const response = await fetch('http://localhost:3000/calculateRoute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    console.log('Route calculation results:');
    console.log(`Total distance: ${data.distance} km`);
    console.log(`Total duration: ${data.duration} seconds`);
    console.log(`Number of legs: ${data.legs ? data.legs.length : 0}`);
    console.log(`Geometry points: ${data.geometry ? data.geometry.length : 0}`);
    
    return data;
  } catch (error) {
    console.error('Error testing Routes API:', error);
  }
}

testRoutesAPI();
