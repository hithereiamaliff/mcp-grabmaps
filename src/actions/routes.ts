import {
  CalculateRouteCommand,
  CalculateRouteMatrixCommand,
  TravelMode,
  DistanceUnit,
} from '@aws-sdk/client-location';
import { createLocationClient, getRouteCalculatorName } from '../utils/aws-client.js';

// Define types for our MCP actions
type CalculateRouteParams = {
  origin: { longitude: number; latitude: number };
  destination: { longitude: number; latitude: number };
  waypoints?: Array<{ longitude: number; latitude: number }>;
  travelMode?: 'Car' | 'Truck' | 'Walking' | 'Bicycle' | 'Motorcycle';
  departureTime?: string;
  avoidTolls?: boolean;
  avoidFerries?: boolean;
  distanceUnit?: 'Kilometers' | 'Miles';
};

type CalculateRouteMatrixParams = {
  departurePositions: number[][];
  destinationPositions: number[][];
  travelMode?: 'Car' | 'Truck' | 'Walking' | 'Bicycle' | 'Motorcycle';
  departureTime?: string;
  distanceUnit?: 'Kilometers' | 'Miles';
};

// Helper function to convert travel mode to AWS format
const convertTravelMode = (mode: string): TravelMode => {
  const modeMap: Record<string, TravelMode> = {
    'Car': 'Car',
    'Truck': 'Truck',
    'Walking': 'Walking',
    'Bicycle': 'Bicycle',
    'Motorcycle': 'Motorcycle'
  };
  
  return modeMap[mode] || 'Car';
};

// Helper function to convert distance unit to AWS format
const convertDistanceUnit = (unit: string): DistanceUnit => {
  return unit === 'Miles' ? 'Miles' : 'Kilometers';
};

// Routes Actions implementation
export const routeActions = {
  // Calculate route between origin and destination
  calculateRoute: async (params: CalculateRouteParams) => {
    try {
      const client = createLocationClient();
      const routeCalculator = getRouteCalculatorName();

      const {
        origin,
        destination,
        waypoints = [],
        travelMode = 'Car',
        departureTime,
        avoidTolls = false,
        avoidFerries = false,
        distanceUnit = 'Kilometers',
      } = params;

      const departureTimeISO = departureTime ? new Date(departureTime).toISOString() : undefined;
      const formattedWaypoints = waypoints.map((wp) => [wp.longitude, wp.latitude]);

      const command = new CalculateRouteCommand({
        CalculatorName: routeCalculator,
        DeparturePosition: [origin.longitude, origin.latitude],
        DestinationPosition: [destination.longitude, destination.latitude],
        WaypointPositions: formattedWaypoints.length > 0 ? formattedWaypoints : undefined,
        TravelMode: convertTravelMode(travelMode),
        DepartureTime: departureTimeISO ? new Date(departureTimeISO) : undefined,
        IncludeLegGeometry: true,
        DistanceUnit: convertDistanceUnit(distanceUnit),
        CarModeOptions: {
          AvoidTolls: avoidTolls,
          AvoidFerries: avoidFerries,
        },
      });

      const response = await client.send(command);

      const data = {
        distance: response.Summary?.Distance,
        duration: response.Summary?.DurationSeconds,
        legs:
          response.Legs?.map((leg) => ({
            distance: leg.Distance,
            duration: leg.DurationSeconds,
            startPosition: leg.StartPosition,
            endPosition: leg.EndPosition,
            steps: leg.Steps,
          })) || [],
        geometry: response.Legs?.flatMap((leg) => leg.Geometry?.LineString || []) || [],
      };

      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      console.error('Error calculating route:', error);
      return { content: [{ type: 'text' as const, text: `Failed to calculate route: ${(error as Error).message}` }] };
    }
  },

  // Calculate route matrix between multiple origins and destinations
  calculateRouteMatrix: async (params: CalculateRouteMatrixParams) => {
    try {
      const client = createLocationClient();
      const routeCalculator = getRouteCalculatorName();

      const {
        departurePositions,
        destinationPositions,
        travelMode = 'Car',
        departureTime,
        distanceUnit = 'Kilometers',
      } = params;

      const departureTimeISO = departureTime ? new Date(departureTime).toISOString() : undefined;

      const command = new CalculateRouteMatrixCommand({
        CalculatorName: routeCalculator,
        DeparturePositions: departurePositions,
        DestinationPositions: destinationPositions,
        TravelMode: convertTravelMode(travelMode),
        DepartureTime: departureTimeISO ? new Date(departureTimeISO) : undefined,
        DistanceUnit: convertDistanceUnit(distanceUnit),
      });

      const response = await client.send(command);

      const routeMatrix =
        response.RouteMatrix?.map((row, rowIndex) =>
          row.map((cell, colIndex) => ({
            originIndex: rowIndex,
            destinationIndex: colIndex,
            distance: cell.Distance,
            durationSeconds: cell.DurationSeconds,
            error: cell.Error ? { code: cell.Error.Code, message: cell.Error.Message } : undefined,
          }))
        ) || [];

      const data = {
        routeMatrix: routeMatrix,
        summary: {
          originCount: departurePositions.length,
          destinationCount: destinationPositions.length,
          routeCount: response.Summary?.RouteCount || 0,
          errorCount: response.Summary?.ErrorCount || 0,
        },
      };

      return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      console.error('Error calculating route matrix:', error);
      return { content: [{ type: 'text' as const, text: `Failed to calculate route matrix: ${(error as Error).message}` }] };
    }
  },
};
