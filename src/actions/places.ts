import { 
  SearchPlaceIndexForTextCommand,
  SearchPlaceIndexForPositionCommand,
  SearchPlaceIndexForSuggestionsCommand,
  GetPlaceCommand
} from '@aws-sdk/client-location';
import { createLocationClient, getPlaceIndexName, mapCountryCode, DEFAULT_BIAS_POSITION } from '../utils/aws-client.js';
import { ExtendedPlace } from '../types/aws-location.js';
import { detectCountryFromQuery, enhanceResponseWithCountrySuggestions } from '../utils/country-detection.js';

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

const formatPlace = (place: ExtendedPlace) => {
  if (!place) return null;
  const point = place.Geometry?.Point;
  return {
    Label: place.Label || '',
    Geometry: point ? { Point: [point[0], point[1]] } : {},
    AddressNumber: place.AddressNumber,
    Street: place.Street,
    Municipality: place.Municipality,
    SubRegion: place.SubRegion,
    Region: place.Region,
    Country: place.Country,
    PostalCode: place.PostalCode,
    Interpolated: place.Interpolated,
    TimeZone: place.TimeZone,
    UnitType: place.UnitType,
    UnitNumber: place.UnitNumber,
  };
};

// Country detection is now handled by the utility in ../utils/country-detection.js

// Places Actions implementation
export const placeActions = {
  // Search for places by text query
  searchPlaceIndexForText: async (params: SearchPlaceParams) => {
    try {
      const client = createLocationClient();
      const placeIndex = getPlaceIndexName();
      
      const { query, country, maxResults = 10, language } = params;
      
      // If country is not specified, try to detect it from the query
      let detectedCountry = country;
      if (!detectedCountry) {
        const detected = detectCountryFromQuery(query);
        if (detected) {
          detectedCountry = detected;
          console.log(`Detected country from query: ${detected}`);
        }
      }
      
      const filterCountries = detectedCountry ? [mapCountryCode(detectedCountry)] : undefined;
      
      const command = new SearchPlaceIndexForTextCommand({
        IndexName: placeIndex,
        Text: query,
        BiasPosition: DEFAULT_BIAS_POSITION,
        FilterCountries: filterCountries,
        MaxResults: maxResults,
        Language: language
      });
      
      const response = await client.send(command);
      
      const results = response.Results?.map((result: any) => {
        if (!result.Place) return null;
        return {
          Place: formatPlace(result.Place as ExtendedPlace),
          Distance: result.Distance,
          Relevance: result.Relevance,
          PlaceId: result.PlaceId,
        };
      }).filter(Boolean);

      // Enhance response with country suggestions
      const enhancedData = enhanceResponseWithCountrySuggestions(
        { Summary: response.Summary, Results: results },
        query,
        detectedCountry,
        country
      );
      
      return { content: [{ type: 'text' as const, text: JSON.stringify(enhancedData, null, 2) }] };
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
      
      const results = response.Results?.map((result: any) => {
        if (!result.Place) return null;
        return {
          Place: formatPlace(result.Place as ExtendedPlace),
          Distance: result.Distance,
          PlaceId: result.PlaceId,
        };
      }).filter(Boolean);

      const data = { Summary: response.Summary, Results: results };
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
      
      // If country is not specified, try to detect it from the query
      let detectedCountry = country;
      if (!detectedCountry) {
        const detected = detectCountryFromQuery(query);
        if (detected) {
          detectedCountry = detected;
          console.log(`Detected country from query: ${detected}`);
        }
      }
      
      const filterCountries = detectedCountry ? [mapCountryCode(detectedCountry)] : undefined;
      
      const command = new SearchPlaceIndexForSuggestionsCommand({
        IndexName: placeIndex,
        Text: query,
        BiasPosition: DEFAULT_BIAS_POSITION,
        FilterCountries: filterCountries,
        MaxResults: maxResults,
        Language: language
      });
      
      const response = await client.send(command);
      
      const results = response.Results?.map((result: any) => {
        if (!result.PlaceId || !result.Text) return null;
        return { Text: result.Text, PlaceId: result.PlaceId };
      }).filter(Boolean);

      // Enhance response with country suggestions
      const enhancedData = enhanceResponseWithCountrySuggestions(
        { Summary: response.Summary, Results: results },
        query,
        detectedCountry,
        country
      );
      
      return { content: [{ type: 'text' as const, text: JSON.stringify(enhancedData, null, 2) }] };
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

      const data = { Place: formatPlace(response.Place as ExtendedPlace) };
      
      // Add a reminder about country codes for future queries
      const enhancedData = { 
        ...data,
        Note: "For place searches, remember to include a country code when possible for more accurate results."
      };
      
      return { content: [{ type: 'text' as const, text: JSON.stringify(enhancedData, null, 2) }] };
    } catch (error) {
      console.error('Error getting place details:', error);
      throw new Error(`Failed to get place details: ${(error as Error).message}`);
    }
  }
};
