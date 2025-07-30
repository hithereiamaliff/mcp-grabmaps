import { 
  SearchPlaceIndexForTextCommand,
  SearchPlaceIndexForPositionCommand,
  SearchPlaceIndexForSuggestionsCommand,
  GetPlaceCommand
} from '@aws-sdk/client-location';
import { createLocationClient, getPlaceIndexName, mapCountryCode, DEFAULT_BIAS_POSITION } from '../utils/aws-client.js';
import { ExtendedPlace, TimeZone } from '../types/aws-location.js';

// Define types for our MCP actions
type SearchPlaceParams = {
  query: string;
  country?: string;
  maxResults?: number;
  language?: string;
};

type SearchByPositionParams = {
  longitude: number;
  latitude: number;
  maxResults?: number;
  language?: string;
};

type SearchSuggestionsParams = {
  query: string;
  country?: string;
  maxResults?: number;
  language?: string;
};

type GetPlaceParams = {
  placeId: string;
  language?: string;
};

// Places Actions implementation
export const placeActions = {
  // Search for places by text query
  searchPlaceIndexForText: async (params: SearchPlaceParams) => {
    try {
      const client = createLocationClient();
      const placeIndex = getPlaceIndexName();
      
      const { query, country, maxResults = 10, language } = params;
      
      // Prepare filter countries if provided
      const filterCountries = country ? [mapCountryCode(country)] : undefined;
      
      const command = new SearchPlaceIndexForTextCommand({
        IndexName: placeIndex,
        Text: query,
        BiasPosition: DEFAULT_BIAS_POSITION,
        FilterCountries: filterCountries,
        MaxResults: maxResults,
        Language: language
      });
      
      const response = await client.send(command);
      
      const data = {
        results: response.Results?.map((result: any) => {
          if (!result.Place) return null;
          const { Place: place, PlaceId, Distance, Relevance } = result;
          const point = place.Geometry?.Point;
          if (!point || point.length < 2) return null;
          
          return {
            placeId: PlaceId || '',
            name: place.Label || '',
            address: place.Address || {},
            coordinates: { latitude: point[1], longitude: point[0] },
            categories: place.Categories || [],
            distance: Distance,
            relevance: Relevance
          };
        }).filter(Boolean) || []
      };
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      console.error('Error searching place index for text:', error);
      throw new Error(`Failed to search places: ${(error as Error).message}`);
    }
  },
  
  // Search for places by position (reverse geocoding)
  searchPlaceIndexForPosition: async (params: SearchByPositionParams) => {
    try {
      const client = createLocationClient();
      const placeIndex = getPlaceIndexName();
      
      const { longitude, latitude, maxResults = 10, language } = params;
      
      const command = new SearchPlaceIndexForPositionCommand({
        IndexName: placeIndex,
        Position: [longitude, latitude],
        MaxResults: maxResults,
        Language: language
      });
      
      const response = await client.send(command);
      
      const data = {
        results: response.Results?.map((result: any) => {
          if (!result.Place) return null;
          const { Place: place, PlaceId, Distance } = result;
          const point = place.Geometry?.Point;
          if (!point || point.length < 2) return null;
          
          return {
            placeId: PlaceId || '',
            name: place.Label || '',
            address: place.Address || {},
            coordinates: { latitude: point[1], longitude: point[0] },
            categories: place.Categories || [],
            distance: Distance
          };
        }).filter(Boolean) || []
      };
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      console.error('Error searching place index for position:', error);
      throw new Error(`Failed to reverse geocode: ${(error as Error).message}`);
    }
  },
  
  // Get place suggestions based on partial text input
  searchPlaceIndexForSuggestions: async (params: SearchSuggestionsParams) => {
    try {
      const client = createLocationClient();
      const placeIndex = getPlaceIndexName();
      
      const { query, country, maxResults = 10, language } = params;
      
      const filterCountries = country ? [mapCountryCode(country)] : undefined;
      
      const command = new SearchPlaceIndexForSuggestionsCommand({
        IndexName: placeIndex,
        Text: query,
        BiasPosition: DEFAULT_BIAS_POSITION,
        FilterCountries: filterCountries,
        MaxResults: maxResults,
        Language: language
      });
      
      const response = await client.send(command);
      
      const data = {
        suggestions: response.Results?.map((result: any) => {
          if (!result.PlaceId || !result.Text) return null;
          return { placeId: result.PlaceId, text: result.Text };
        }).filter(Boolean) || []
      };
      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      console.error('Error searching place index for suggestions:', error);
      throw new Error(`Failed to get place suggestions: ${(error as Error).message}`);
    }
  },
  
  // Get place details by place ID
  getPlace: async (params: GetPlaceParams) => {
    try {
      const client = createLocationClient();
      const placeIndex = getPlaceIndexName();
      
      const { placeId, language } = params;
      
      const command = new GetPlaceCommand({
        IndexName: placeIndex,
        PlaceId: placeId,
        Language: language
      });
      
      const response = await client.send(command);
      
      if (!response.Place) {
        throw new Error('Place not found');
      }

      const place = response.Place as ExtendedPlace;
      const point = place.Geometry?.Point;

      const data = {
        placeId: placeId,
        name: place.Label || '',
        address: place.Address || {},
        coordinates: point ? { latitude: point[1], longitude: point[0] } : {},
        categories: place.Categories || [],
        timeZone: place.TimeZone || null,
        postalCode: place.Address?.PostalCode || null
      };

      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      console.error('Error getting place details:', error);
      throw new Error(`Failed to get place details: ${(error as Error).message}`);
    }
  }
};
