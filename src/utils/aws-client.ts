import { LocationClient } from '@aws-sdk/client-location';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const validateEnv = () => {
  const requiredVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'GRABMAPS_API_KEY',
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Create AWS Location client
export const createLocationClient = (): LocationClient => {
  validateEnv();
  
  return new LocationClient({
    region: process.env.AWS_REGION || 'ap-southeast-5',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }
  });
};

// Get Place Index name
export const getPlaceIndexName = (): string => {
  return process.env.PLACE_INDEX_NAME || 'explore.place.Grab';
};

// Get Map name
export const getMapName = (): string => {
  return process.env.MAP_NAME || 'explore.map.Grab';
};

// Get Route Calculator name
export const getRouteCalculatorName = (): string => {
  return process.env.ROUTE_CALCULATOR_NAME || 'explore.route-calculator.Grab';
};

// Helper for country code mapping (2-letter to 3-letter ISO)
export const mapCountryCode = (code: string): string => {
  const countryMap: Record<string, string> = {
    'my': 'MYS', // Malaysia
    'sg': 'SGP', // Singapore
    'id': 'IDN', // Indonesia
    'ph': 'PHL', // Philippines
    'th': 'THA', // Thailand
    'vn': 'VNM', // Vietnam
    'mm': 'MMR', // Myanmar
    'la': 'LAO', // Laos
    'kh': 'KHM', // Cambodia
    'bn': 'BRN', // Brunei
    'tl': 'TLS', // Timor-Leste
  };
  
  return countryMap[code.toLowerCase()] || code.toUpperCase();
};

// Default bias position (Kuala Lumpur coordinates)
export const DEFAULT_BIAS_POSITION = [101.6942371, 3.1516964];
