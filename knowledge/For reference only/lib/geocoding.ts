
import { logInfo, logError } from "@/lib/logger";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  locationName: string;
  country?: string;
  confidence?: number;
}

// Mock geocoding service for development
export class GeocodingService {
  private static readonly MOCK_DATA: Record<string, GeocodingResult> = {
    'paris': {
      latitude: 48.8566,
      longitude: 2.3522,
      locationName: 'Paris, France',
      country: 'France',
      confidence: 0.95
    },
    'london': {
      latitude: 51.5074,
      longitude: -0.1278,
      locationName: 'London, UK',
      country: 'United Kingdom',
      confidence: 0.95
    },
    'new york': {
      latitude: 40.7128,
      longitude: -74.0060,
      locationName: 'New York, NY, USA',
      country: 'United States',
      confidence: 0.95
    },
    'default': {
      latitude: 0,
      longitude: 0,
      locationName: 'Unknown Location',
      country: 'Unknown',
      confidence: 0.1
    }
  };

  static async geocodeLocation(locationName: string): Promise<GeocodingResult> {
    try {
      logInfo("Starting geocoding request", { 
        details: { locationName } 
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const key = locationName.toLowerCase().trim();
      const result = this.MOCK_DATA[key] || this.MOCK_DATA['default'];

      logInfo("Geocoding completed", { 
        details: { 
          locationName, 
          latitude: result.latitude, 
          longitude: result.longitude,
          confidence: result.confidence 
        }
      });

      return result;
    } catch (error) {
      logError("Geocoding failed", { details: error });
      return this.MOCK_DATA['default'];
    }
  }

  static async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
    try {
      logInfo("Starting reverse geocoding", { 
        details: { latitude, longitude }
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simple mock reverse geocoding
      if (Math.abs(latitude - 48.8566) < 0.1 && Math.abs(longitude - 2.3522) < 0.1) {
        return this.MOCK_DATA['paris'];
      }
      if (Math.abs(latitude - 51.5074) < 0.1 && Math.abs(longitude + 0.1278) < 0.1) {
        return this.MOCK_DATA['london'];
      }
      if (Math.abs(latitude - 40.7128) < 0.1 && Math.abs(longitude + 74.0060) < 0.1) {
        return this.MOCK_DATA['new york'];
      }

      const result = {
        latitude,
        longitude,
        locationName: `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        country: 'Unknown',
        confidence: 0.5
      };

      logInfo("Reverse geocoding completed", { 
        details: { 
          latitude, 
          longitude, 
          locationName: result.locationName 
        }
      });

      return result;
    } catch (error) {
      logError("Reverse geocoding failed", { details: error });
      return {
        latitude,
        longitude,
        locationName: 'Unknown Location',
        country: 'Unknown',
        confidence: 0.1
      };
    }
  }

  static validateCoordinates(latitude: number, longitude: number): boolean {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }

  static formatCoordinates(latitude: number, longitude: number): string {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  static async searchLocations(query: string, limit: number = 5): Promise<GeocodingResult[]> {
    try {
      logInfo("Searching locations", { 
        details: { query, limit }
      });

      // Simple search through mock data
      const results = Object.values(this.MOCK_DATA)
        .filter(location => 
          location.locationName.toLowerCase().includes(query.toLowerCase()) ||
          (location.country && location.country.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, limit);

      if (results.length === 0) {
        results.push(this.MOCK_DATA['default']);
      }

      logInfo("Location search completed", { 
        details: { query, resultsCount: results.length }
      });

      return results;
    } catch (error) {
      logError("Location search failed", { details: error });
      return [this.MOCK_DATA['default']];
    }
  }
}

// Export individual functions for convenience
export const geocodeLocation = GeocodingService.geocodeLocation;
export const reverseGeocode = GeocodingService.reverseGeocode;
export const validateCoordinates = GeocodingService.validateCoordinates;
export const formatCoordinates = GeocodingService.formatCoordinates;
export const searchLocations = GeocodingService.searchLocations;
