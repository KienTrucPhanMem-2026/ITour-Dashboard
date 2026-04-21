import { apiClient } from '@/lib/api-client';
import { Tour, ApiResponse, ListResponse } from '@/types';

/**
 * Tour Service - Handles all tour-related API calls
 */
class TourService {
  private endpoint = '/tours';

  /**
   * Get all tours with optional pagination and filtering
   */
  async getTours(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    destination?: string;
  }): Promise<ApiResponse<ListResponse<Tour>>> {
    return apiClient.get<ListResponse<Tour>>(`${this.endpoint}`, { params });
  }

  /**
   * Get a single tour by ID
   */
  async getTourById(id: string): Promise<ApiResponse<Tour>> {
    return apiClient.get<Tour>(`${this.endpoint}/${id}`);
  }

  /**
   * Create a new tour
   */
  async createTour(data: Omit<Tour, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Tour>> {
    return apiClient.post<Tour>(`${this.endpoint}`, data);
  }

  /**
   * Update an existing tour
   */
  async updateTour(id: string, data: Partial<Tour>): Promise<ApiResponse<Tour>> {
    return apiClient.put<Tour>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Delete a tour
   */
  async deleteTour(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }

  /**
   * Update tour status
   */
  async updateTourStatus(
    id: string,
    status: 'Active' | 'Pending' | 'Completed' | 'Cancelled'
  ): Promise<ApiResponse<Tour>> {
    return apiClient.patch<Tour>(`${this.endpoint}/${id}/status`, { status });
  }

  /**
   * Archive a tour
   */
  async archiveTour(id: string): Promise<ApiResponse<Tour>> {
    return this.updateTourStatus(id, 'Completed');
  }
}

export const tourService = new TourService();
