// Simple test script for GrabMaps MCP server Maps API
// Using CommonJS syntax with node-fetch v2
const fetch = require('node-fetch');

async function testMapsAPI() {
  try {
    console.log('Testing getMapStyleDescriptor endpoint...');
    const response = await fetch('http://localhost:3000/getMapStyleDescriptor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // No specific parameters needed for style descriptor
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Map style descriptor received:');
    console.log(`Version: ${data.version}`);
    console.log(`Name: ${data.name}`);
    console.log(`Has ${data.sources ? Object.keys(data.sources).length : 0} sources`);
    console.log(`Has ${data.layers ? data.layers.length : 0} layers`);
    
    return data;
  } catch (error) {
    console.error('Error testing Maps API:', error);
  }
}

testMapsAPI();
