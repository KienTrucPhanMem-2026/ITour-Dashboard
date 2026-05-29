import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types';

interface Vehicle {
  id?: string;
  type: string;
  seatCount: number;
  description: string;
  transportCompanyId: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Generate Vehicle ID using UUID v4
 */
function generateVehicleId(): string {
  return `V_${crypto.randomUUID()}`;
}

class VehicleService {
  private endpoint = '/vehicles';

  /**
   * Get all vehicles
   */
  async getVehicles(): Promise<ApiResponse<Vehicle[]>> {
    console.log('🚌 Fetching vehicles...');
    const response = await apiClient.get<Vehicle[]>(this.endpoint);
    console.log('🚌 Vehicles loaded:', response.data?.length || 0);
    return response;
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(id: string): Promise<ApiResponse<Vehicle>> {
    return apiClient.get<Vehicle>(`${this.endpoint}/${id}`);
  }

  /**
   * Create new vehicle
   */
  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Vehicle>> {
    const vehicleWithId: Vehicle = {
      ...vehicle,
      id: generateVehicleId(),
    };
    console.log('➕ Creating vehicle with ID:', vehicleWithId.id, 'Data:', vehicle);
    const response = await apiClient.post<Vehicle>(this.endpoint, vehicleWithId);
    console.log('✅ Vehicle created:', response.data?.id);
    return response;
  }

  /**
   * Update vehicle
   */
  async updateVehicle(id: string, vehicle: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    return apiClient.put<Vehicle>(`${this.endpoint}/${id}`, vehicle);
  }

  /**
   * Delete vehicle
   */
  async deleteVehicle(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }
}

export const vehicleService = new VehicleService();
