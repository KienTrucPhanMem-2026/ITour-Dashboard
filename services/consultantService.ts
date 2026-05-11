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
 * Consultant Service
 */
class ConsultantService {
  private endpoint = '/consultants';

  private transformConsultant(data: any): Staff {
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

  async getConsultants(): Promise<ApiResponse<Staff[]>> {
    const response = await apiClient.get<any[]>(`${this.endpoint}`);

    if (response.success && Array.isArray(response.data)) {
      const transformedData = response.data.map(item => this.transformConsultant(item));
      return { ...response, data: transformedData };
    }

    return response;
  }

  async getConsultantById(id: string): Promise<ApiResponse<Staff>> {
    const response = await apiClient.get<any>(`${this.endpoint}/${id}`);

    if (response.success && response.data) {
      return { ...response, data: this.transformConsultant(response.data) };
    }

    return response;
  }

  async createConsultant(data: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Staff>> {
    const response = await apiClient.post<any>(`${this.endpoint}`, data);

    if (response.success && response.data) {
      return { ...response, data: this.transformConsultant(response.data) };
    }

    return response;
  }

  async updateConsultant(id: string, data: Partial<Staff>): Promise<ApiResponse<Staff>> {
    const response = await apiClient.put<any>(`${this.endpoint}/${id}`, data);

    if (response.success && response.data) {
      return { ...response, data: this.transformConsultant(response.data) };
    }

    return response;
  }

  async deleteConsultant(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }
}

export const consultantService = new ConsultantService();
