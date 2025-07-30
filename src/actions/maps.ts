import { 
  GetMapTileCommand,
  GetMapStyleDescriptorCommand,
  GetMapGlyphsCommand,
  GetMapSpritesCommand
} from '@aws-sdk/client-location';
import { createLocationClient, getMapName } from '../utils/aws-client.js';

// Define types for our MCP actions
type GetMapTileParams = {
  x: number;
  y: number;
  z: number;
  mapName?: string;
};

type GetMapStyleParams = {
  format?: string;
  mapName?: string;
};

type GetMapGlyphsParams = {
  fontStack?: string;
  unicodeRange?: string;
  fontRange?: string; // Alternative name used by frontend
  mapName?: string;
  // Allow for different casing in parameters
  FontStack?: string;
  FontUnicodeRange?: string;
};

type GetMapSpritesParams = {
  fileName?: string;
  mapName?: string;
  // Allow for different casing in parameters
  FileName?: string;
};

// Maps Actions implementation
export const mapActions = {
  // Get map tile for rendering
  getMapTile: async (params: GetMapTileParams) => {
    try {
      const client = createLocationClient();
      const mapName = getMapName();
      
      const { x, y, z } = params;
      
      const command = new GetMapTileCommand({
        MapName: mapName,
        X: x.toString(),
        Y: y.toString(),
        Z: z.toString()
      });
      
      const response = await client.send(command);
      
      // Convert the Blob to base64 for easier transmission
      let base64Image = '';
      if (response.Blob instanceof Uint8Array) {
        // If Blob is already a Uint8Array, convert directly to base64
        base64Image = Buffer.from(response.Blob).toString('base64');
      }
      
      return {
        mapTile: base64Image,
        contentType: response.ContentType || 'image/png'
      };
    } catch (error) {
      console.error('Error getting map tile:', error);
      throw new Error(`Failed to get map tile: ${(error as Error).message}`);
    }
  },
  
  // Get map sprites for icons and markers on maps
  getMapSprites: async (params: GetMapSpritesParams) => {
    try {
      const client = createLocationClient();
      const mapName = params.mapName || getMapName();
      
      // Handle different parameter naming conventions
      const fileName = params.fileName || (params as any).FileName || 'sprites';
      
      // Ensure we have the correct file extension
      let formattedFileName = fileName;
      if (!formattedFileName.endsWith('.png') && !formattedFileName.endsWith('.json')) {
        formattedFileName = `${formattedFileName}.png`;
      }
      
      console.log(`Getting map sprites with fileName: ${formattedFileName}, mapName: ${mapName}`);
      
      const command = new GetMapSpritesCommand({
        MapName: mapName,
        FileName: formattedFileName
      });
      
      const response = await client.send(command);
      
      // Convert the sprite data to base64
      let base64Sprite = '';
      let spriteJson = null;
      
      if (response.Blob instanceof Uint8Array) {
        base64Sprite = Buffer.from(response.Blob).toString('base64');
      }
      
      // If this is a JSON file, parse it
      if (fileName.endsWith('.json') && response.Blob) {
        try {
          const text = new TextDecoder().decode(response.Blob);
          spriteJson = JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing sprite JSON:', parseError);
        }
      }
      
      return {
        blob: base64Sprite,
        json: spriteJson,
        contentType: response.ContentType || 'image/png'
      };
    } catch (error) {
      console.error('Error getting map sprites:', error);
      throw new Error(`Failed to get map sprites: ${(error as Error).message}`);
    }
  },
  
  // Get map style descriptor for map rendering
  getMapStyleDescriptor: async (params: GetMapStyleParams = {}) => {
    try {
      const client = createLocationClient();
      const mapName = getMapName();
      
      const { format = 'json' } = params;
      
      const command = new GetMapStyleDescriptorCommand({
        MapName: mapName
      });
      
      const response = await client.send(command);
      
      // Parse the map style descriptor
      let styleDescriptor = {};
      if (response.Blob instanceof Uint8Array) {
        const text = new TextDecoder().decode(response.Blob);
        try {
          styleDescriptor = JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing style descriptor JSON:', parseError);
          throw new Error(`Invalid style descriptor format: ${(parseError as Error).message}`);
        }
      }
      
      return {
        styleDescriptor
      };
    } catch (error) {
      console.error('Error getting map style descriptor:', error);
      throw new Error(`Failed to get map style: ${(error as Error).message}`);
    }
  },
  
  // Get map glyphs for text rendering on maps
  getMapGlyphs: async (params: GetMapGlyphsParams) => {
    try {
      const client = createLocationClient();
      const mapName = params.mapName || getMapName();
      
      // Handle different parameter naming conventions
      const fontStack = params.fontStack || (params as any).FontStack;
      const unicodeRange = params.unicodeRange || params.fontRange || (params as any).FontUnicodeRange;
      
      if (!fontStack || !unicodeRange) {
        throw new Error('Missing required parameters: fontStack and unicodeRange');
      }
      
      console.log(`Getting map glyphs with fontStack: ${fontStack}, unicodeRange: ${unicodeRange}`);
      
      // Ensure unicodeRange ends with .pbf as required by the API
      let formattedUnicodeRange = unicodeRange;
      if (!formattedUnicodeRange.endsWith('.pbf')) {
        formattedUnicodeRange = `${unicodeRange}.pbf`;
      }
      
      console.log(`Formatted unicode range: ${formattedUnicodeRange}`);
      
      const command = new GetMapGlyphsCommand({
        MapName: mapName,
        FontStack: fontStack,
        FontUnicodeRange: formattedUnicodeRange
      });
      
      const response = await client.send(command);
      
      // Convert the glyph data to base64
      let base64Glyphs = '';
      if (response.Blob instanceof Uint8Array) {
        base64Glyphs = Buffer.from(response.Blob).toString('base64');
      }
      
      return {
        glyphs: base64Glyphs,
        contentType: response.ContentType || 'application/octet-stream'
      };
    } catch (error) {
      console.error('Error getting map glyphs:', error);
      throw new Error(`Failed to get map glyphs: ${(error as Error).message}`);
    }
  },
  

};
