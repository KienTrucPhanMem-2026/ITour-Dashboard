import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types';

interface Location {
  id?: string;
  name: string;
  type: string;
  description: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Generate Location ID using UUID v4
 */
function generateLocationId(): string {
  return `L_${crypto.randomUUID()}`;
}

class LocationService {
  private endpoint = '/locations';

  /**
   * Get all locations
   */
  async getLocations(): Promise<ApiResponse<Location[]>> {
    console.log('📍 Fetching locations...');
    const response = await apiClient.get<Location[]>(this.endpoint);
    console.log('📍 Locations loaded:', response.data?.length || 0);
    return response;
  }

  /**
   * Get location by ID
   */
  async getLocationById(id: string): Promise<ApiResponse<Location>> {
    return apiClient.get<Location>(`${this.endpoint}/${id}`);
  }

  /**
   * Create new location
   */
  async createLocation(location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Location>> {
    const locationWithId: Location = {
      ...location,
      id: generateLocationId(),
    };
    console.log('➕ Creating location with ID:', locationWithId.id, 'Data:', location);
    const response = await apiClient.post<Location>(this.endpoint, locationWithId);
    console.log('✅ Location created:', response.data?.id);
    return response;
  }

  /**
   * Update location
   */
  async updateLocation(id: string, location: Partial<Location>): Promise<ApiResponse<Location>> {
    return apiClient.put<Location>(`${this.endpoint}/${id}`, location);
  }

  /**
   * Delete location
   */
  async deleteLocation(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }
}

export const locationService = new LocationService();
