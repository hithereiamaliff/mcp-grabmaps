// Simple test script for GrabMaps MCP server Places API
// Using CommonJS syntax with node-fetch v2
const fetch = require('node-fetch');

async function testPlacesAPI() {
  try {
    console.log('Testing searchPlaceIndexForText endpoint...');
    const response = await fetch('http://localhost:3000/searchPlaceIndexForText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'Kuala Lumpur',
        maxResults: 5
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Search results:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Error testing Places API:', error);
  }
}

testPlacesAPI();
