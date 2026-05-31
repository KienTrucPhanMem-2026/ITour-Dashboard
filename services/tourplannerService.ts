import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types';

export interface Staff {
  id: string;
  userName: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  dateOfBirth: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tour Planner Service
 */
class TourPlannerService {
  private endpoint = '/tour-planners';

  private transformTourPlanner(data: any): Staff {
    return {
      id: data.id || '',
      userName: data.userName || '',
      fullName: data.fullName || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      dateOfBirth: data.dateOfBirth || '',
      isActive: data.isActive !== false,
      createdAt: data.createdAt || '',
      updatedAt: data.updatedAt || '',
    };
  }

  async getTourPlanners(): Promise<ApiResponse<Staff[]>> {
    const response = await apiClient.get<any[]>(`${this.endpoint}`);

    if (response.success && Array.isArray(response.data)) {
      const transformedData = response.data.map(item => this.transformTourPlanner(item));
      return { ...response, data: transformedData };
    }

    return response;
  }

  async getTourPlannerById(id: string): Promise<ApiResponse<Staff>> {
    const response = await apiClient.get<any>(`${this.endpoint}/${id}`);

    if (response.success && response.data) {
      return { ...response, data: this.transformTourPlanner(response.data) };
    }

    return response;
  }

  async createTourPlanner(data: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Staff>> {
    const response = await apiClient.post<any>(`${this.endpoint}`, data);

    if (response.success && response.data) {
      return { ...response, data: this.transformTourPlanner(response.data) };
    }

    return response;
  }

  async updateTourPlanner(id: string, data: Partial<Staff>): Promise<ApiResponse<Staff>> {
    const response = await apiClient.put<any>(`${this.endpoint}/${id}`, data);

    if (response.success && response.data) {
      return { ...response, data: this.transformTourPlanner(response.data) };
    }

    return response;
  }

  async deleteTourPlanner(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }
}

export const tourplannerService = new TourPlannerService();
