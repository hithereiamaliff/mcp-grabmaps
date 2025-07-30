require('dotenv').config();

console.log('Checking required environment variables:');
const requiredVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'GRABMAPS_API_KEY',
  'PLACE_INDEX_NAME',
  'MAP_NAME',
  'ROUTE_CALCULATOR_NAME'
];

const results = {};
for (const varName of requiredVars) {
  const value = process.env[varName];
  results[varName] = {
    set: !!value,
    value: value ? `${value.substring(0, 5)}...` : 'Not set'
  };
}

console.log(JSON.stringify(results, null, 2));
