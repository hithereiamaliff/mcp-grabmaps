import { Place as AwsPlace } from '@aws-sdk/client-location';

export interface TimeZone {
  Name: string;
  Offset?: number;
}

// Extended AWS Location Service types with correct property definitions
export interface ExtendedPlace extends AwsPlace {
  Address?: Record<string, string>;
  TimeZone?: TimeZone;
}
