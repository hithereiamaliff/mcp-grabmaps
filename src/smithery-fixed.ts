/**
 * GrabMaps MCP Server - Smithery Implementation
 * Provides Places and Routes API tools for Model Context Protocol
 */

// Import required dependencies
import dotenv from 'dotenv';
import { placeActions } from './actions/places.js';
import { routeActions } from './actions/routes.js';

// Define types for tool parameters
type SearchPlaceTextParams = {
  query: string;
  country?: string;
  maxResults?: number;
  language?: string;
};

type SearchPlacePositionParams = {
  longitude: number;
  latitude: number;
  maxResults?: number;
  language?: string;
};

type GetPlaceParams = {
  placeId: string;
  language?: string;
};

type RouteParams = {
  origin: {
    longitude: number;
    latitude: number;
  };
  destination: {
    longitude: number;
    latitude: number;
  };
  waypoints?: Array<{
    longitude: number;
    latitude: number;
  }>;
  travelMode?: 'Car' | 'Truck' | 'Walking' | 'Bicycle' | 'Motorcycle';
  departureTime?: string;
  avoidTolls?: boolean;
  avoidFerries?: boolean;
  distanceUnit?: 'Kilometers' | 'Miles';
};

type RouteMatrixParams = {
  departurePositions: number[][];
  destinationPositions: number[][];
  travelMode?: 'Car' | 'Truck' | 'Walking' | 'Bicycle' | 'Motorcycle';
  departureTime?: string;
  distanceUnit?: 'Kilometers' | 'Miles';
};

// Load environment variables
dotenv.config();

// Define the MCP server
const createServer = () => {
  // Server metadata
  const serverInfo = {
    name: 'grabmaps',
    description: 'GrabMaps API integration for Model Context Protocol',
    version: '1.0.0'
  };

  // Define tool schemas
  const tools = [
    // Places API tools
    {
      name: 'searchPlaceIndexForText',
      description: 'Search for places using text query',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          country: { type: 'string', description: 'Country code filter' },
          maxResults: { type: 'number', description: 'Maximum results to return' },
          language: { type: 'string', description: 'Language code' }
        },
        required: ['query']
      },
      handler: async (params: SearchPlaceTextParams) => {
        try {
          console.log('Executing searchPlaceIndexForText with params:', params);
          const result = await placeActions.searchPlaceIndexForText(params);
          return result;
        } catch (error) {
          console.error('Error in searchPlaceIndexForText:', error);
          throw error;
        }
      }
    },
    {
      name: 'searchPlaceIndexForPosition',
      description: 'Search for places by coordinates (reverse geocoding)',
      parameters: {
        type: 'object',
        properties: {
          longitude: { type: 'number', description: 'Longitude coordinate' },
          latitude: { type: 'number', description: 'Latitude coordinate' },
          maxResults: { type: 'number', description: 'Maximum results to return' },
          language: { type: 'string', description: 'Language code' }
        },
        required: ['longitude', 'latitude']
      },
      handler: async (params: SearchPlacePositionParams) => {
        try {
          console.log('Executing searchPlaceIndexForPosition with params:', params);
          const result = await placeActions.searchPlaceIndexForPosition(params);
          return result;
        } catch (error) {
          console.error('Error in searchPlaceIndexForPosition:', error);
          throw error;
        }
      }
    },
    {
      name: 'searchPlaceIndexForSuggestions',
      description: 'Get place suggestions based on partial text input',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Partial text input' },
          country: { type: 'string', description: 'Country code filter' },
          maxResults: { type: 'number', description: 'Maximum results to return' },
          language: { type: 'string', description: 'Language code' }
        },
        required: ['query']
      },
      handler: async (params: SearchPlaceTextParams) => {
        try {
          console.log('Executing searchPlaceIndexForSuggestions with params:', params);
          const result = await placeActions.searchPlaceIndexForSuggestions(params);
          return result;
        } catch (error) {
          console.error('Error in searchPlaceIndexForSuggestions:', error);
          throw error;
        }
      }
    },
    {
      name: 'getPlace',
      description: 'Get place details by place ID',
      parameters: {
        type: 'object',
        properties: {
          placeId: { type: 'string', description: 'ID of the place to retrieve' },
          language: { type: 'string', description: 'Language code' }
        },
        required: ['placeId']
      },
      handler: async (params: GetPlaceParams) => {
        try {
          console.log('Executing getPlace with params:', params);
          const result = await placeActions.getPlace(params);
          return result;
        } catch (error) {
          console.error('Error in getPlace:', error);
          throw error;
        }
      }
    },
    
    // Routes API tools
    {
      name: 'calculateRoute',
      description: 'Calculate a route between two points',
      parameters: {
        type: 'object',
        properties: {
          origin: {
            type: 'object',
            properties: {
              longitude: { type: 'number' },
              latitude: { type: 'number' }
            }
          },
          destination: {
            type: 'object',
            properties: {
              longitude: { type: 'number' },
              latitude: { type: 'number' }
            }
          },
          travelMode: { 
            type: 'string',
            enum: ['Car', 'Truck', 'Walking', 'Bicycle', 'Motorcycle']
          },
          distanceUnit: { 
            type: 'string',
            enum: ['Kilometers', 'Miles']
          }
        },
        required: ['origin', 'destination']
      },
      handler: async (params: RouteParams) => {
        try {
          console.log('Executing calculateRoute with params:', params);
          const result = await routeActions.calculateRoute(params);
          return result;
        } catch (error) {
          console.error('Error in calculateRoute:', error);
          throw error;
        }
      }
    },
    {
      name: 'calculateRouteMatrix',
      description: 'Calculate routes between multiple origins and destinations',
      parameters: {
        type: 'object',
        properties: {
          departurePositions: { 
            type: 'array',
            items: {
              type: 'array',
              items: { type: 'number' }
            }
          },
          destinationPositions: { 
            type: 'array',
            items: {
              type: 'array',
              items: { type: 'number' }
            }
          },
          travelMode: { 
            type: 'string',
            enum: ['Car', 'Truck', 'Walking', 'Bicycle', 'Motorcycle']
          }
        },
        required: ['departurePositions', 'destinationPositions']
      },
      handler: async (params: RouteMatrixParams) => {
        try {
          console.log('Executing calculateRouteMatrix with params:', params);
          const result = await routeActions.calculateRouteMatrix(params);
          return result;
        } catch (error) {
          console.error('Error in calculateRouteMatrix:', error);
          throw error;
        }
      }
    }
  ];

  // Return the server configuration
  return {
    serverInfo,
    tools
  };
};

// Export the server creation function
export default function() {
  return createServer();
}
