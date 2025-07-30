/**
 * Country detection utilities for GrabMaps MCP
 * Helps identify countries from search queries to improve search accuracy
 */

// Common country names and landmarks that might appear in queries
const countryKeywords: Record<string, string> = {
  // Southeast Asia (GrabMaps primary coverage)
  'malaysia': 'MYS',
  'kuala lumpur': 'MYS',
  'penang': 'MYS',
  'johor': 'MYS',
  'malacca': 'MYS',
  'kota kinabalu': 'MYS',
  'ipoh': 'MYS',
  'singapore': 'SGP',
  'jurong': 'SGP',
  'tampines': 'SGP',
  'changi': 'SGP',
  'sentosa': 'SGP',
  'orchard': 'SGP',
  'city square mall': 'SGP', // Adding City Square Mall as a Singapore landmark
  'indonesia': 'IDN',
  'jakarta': 'IDN',
  'bali': 'IDN',
  'bandung': 'IDN',
  'surabaya': 'IDN',
  'yogyakarta': 'IDN',
  'thailand': 'THA',
  'bangkok': 'THA',
  'phuket': 'THA',
  'chiang mai': 'THA',
  'songkhla': 'THA',
  'hat yai': 'THA',
  'pattaya': 'THA',
  'philippines': 'PHL',
  'manila': 'PHL',
  'cebu': 'PHL',
  'davao': 'PHL',
  'boracay': 'PHL',
  'vietnam': 'VNM',
  'hanoi': 'VNM',
  'ho chi minh': 'VNM',
  'da nang': 'VNM',
  'hue': 'VNM',
  'cambodia': 'KHM',
  'phnom penh': 'KHM',
  'angkor wat': 'KHM',
  'siem reap': 'KHM',
  'myanmar': 'MMR',
  'burma': 'MMR',
  'yangon': 'MMR',
  'mandalay': 'MMR',
  'laos': 'LAO',
  'vientiane': 'LAO',
  'luang prabang': 'LAO',
  'brunei': 'BRN',
  'bandar seri begawan': 'BRN',
  'timor-leste': 'TLS',
  'east timor': 'TLS',
  'dili': 'TLS'
};

// Special place names that can be mapped to countries
const specialPlaceMappings: Record<string, string> = {
  'songklanagarind hospital': 'THA',
  'petronas towers': 'MYS',
  'klcc': 'MYS',
  'gardens by the bay': 'SGP',
  'marina bay sands': 'SGP',
  'borobudur': 'IDN',
  'prambanan': 'IDN'
};

/**
 * Attempts to identify a country from a search query
 * @param query The search query text
 * @returns Two-letter country code if detected, null otherwise
 */
export const detectCountryFromQuery = (query: string): string | null => {
  // Convert query to lowercase for case-insensitive matching
  const lowerQuery = query.toLowerCase();
  
  // Check for country keywords in the query
  for (const [keyword, countryCode] of Object.entries(countryKeywords)) {
    if (lowerQuery.includes(keyword)) {
      return countryCode;
    }
  }

  // Check for specific place name patterns
  for (const [placeName, countryCode] of Object.entries(specialPlaceMappings)) {
    if (lowerQuery.includes(placeName)) {
      return countryCode;
    }
  }

  // No country detected
  return null;
};

/**
 * Enhances response data with suggestions about country codes
 * @param data The response data object
 * @param query The original search query
 * @param detectedCountry Country code that was detected from the query (if any)
 * @param specifiedCountry Country code that was explicitly specified in the request (if any)
 * @returns Enhanced data object with suggestions
 */
export const enhanceResponseWithCountrySuggestions = (
  data: any, 
  query: string, 
  detectedCountry: string | undefined, 
  specifiedCountry: string | undefined
): any => {
  // Create a copy of the data to avoid mutation
  const enhancedData = { ...data };
  
  // Create the correct format example
  let formatExample: string;
  if (detectedCountry) {
    formatExample = `{
  "query": "${query}",
  "country": "${detectedCountry}"
}`;
  } else {
    formatExample = `{
  "query": "${query}",
  "country": "[COUNTRY_CODE]"  // SG for Singapore, MY for Malaysia, TH for Thailand, etc.
}`;
  }

  // Always include AI instructions in the response
  enhancedData.AI_MODEL_INSTRUCTION = {
    critical: true,
    instruction: "AI MODELS MUST ALWAYS INCLUDE COUNTRY CODE IN REQUESTS",
    message: detectedCountry && !specifiedCountry
      ? `This query is for a location in ${detectedCountry}. Future requests MUST include 'country: "${detectedCountry}"'`
      : "AI models MUST analyze user queries to determine the country and ALWAYS include the country code parameter",
    supportedCountries: "GrabMaps ONLY supports: Malaysia (MYS), Singapore (SGP), Thailand (THA), Myanmar (MMR), Cambodia (KHM), Vietnam (VNM), Philippines (PHL), and Indonesia (IDN). Searches outside these countries will not return accurate results.",
    correctFormat: formatExample,
    examples: [
      { 
        userQuery: "Where is City Square Mall?", 
        correctRequest: `{ "query": "City Square Mall", "country": "SGP" }` 
      },
      { 
        userQuery: "Find restaurants in Bangkok", 
        correctRequest: `{ "query": "restaurants in Bangkok", "country": "THA" }` 
      },
      { 
        userQuery: "Hotels near KLCC", 
        correctRequest: `{ "query": "Hotels near KLCC", "country": "MYS" }` 
      }
    ]
  };
  
  // Add a user-friendly note as well
  enhancedData.Note = "For more accurate search results, please specify the country when searching for places.";
  
  return enhancedData;
};
