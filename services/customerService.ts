import { apiClient } from '@/lib/api-client';
import { User, ApiResponse } from '@/types';

/**
 * Customer Service - Handles all customer-related API calls
 * Communicates with Spring Boot backend at /api/customers
 */
class CustomerService {
  private endpoint = '/customers';

  /**
   * Transform backend customer data to match frontend User type
   */
  private transformCustomer(data: any): User {
    return {
      id: data.id || '',
      name: data.fullName || data.userName || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      city: '',
      country: '',
      profileImage: '',
      totalBookings: data.bookings?.length || 0,
      totalSpent: 0,
      joinDate: data.createdAt || new Date().toISOString(),
      status: (data.active ? 'Active' : 'Inactive') as any,
      createdAt: data.createdAt || '',
      updatedAt: data.updatedAt || '',
    };
  }

  /**
   * Get all customers
   */
  async getCustomers(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<any[]>(`${this.endpoint}`, { params });

    if (response.success && Array.isArray(response.data)) {
      const transformedCustomers = response.data.map(customer => this.transformCustomer(customer));
      return {
        ...response,
        data: transformedCustomers,
      };
    }

    return response;
  }

  /**
   * Get a single customer by ID
   */
  async getCustomerById(id: string): Promise<ApiResponse<User>> {
    const response = await apiClient.get<any>(`${this.endpoint}/${id}`);

    if (response.success && response.data) {
      return {
        ...response,
        data: this.transformCustomer(response.data),
      };
    }

    return response;
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<User>> {
    const response = await apiClient.post<any>(`${this.endpoint}`, data);

    if (response.success && response.data) {
      return {
        ...response,
        data: this.transformCustomer(response.data),
      };
    }

    return response;
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.put<any>(`${this.endpoint}/${id}`, data);

    if (response.success && response.data) {
      return {
        ...response,
        data: this.transformCustomer(response.data),
      };
    }

    return response;
  }

  /**
   * Delete a customer by ID
   */
  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Search customers by name
   */
  async searchCustomersByName(name: string): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<any[]>(`${this.endpoint}/search/${name}`);

    if (response.success && Array.isArray(response.data)) {
      const transformedCustomers = response.data.map(customer => this.transformCustomer(customer));
      return {
        ...response,
        data: transformedCustomers,
      };
    }

    return response;
  }

  /**
   * Get customers by status
   */
  async getCustomersByStatus(status: string): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<any[]>(`${this.endpoint}/status/${status}`);

    if (response.success && Array.isArray(response.data)) {
      const transformedCustomers = response.data.map(customer => this.transformCustomer(customer));
      return {
        ...response,
        data: transformedCustomers,
      };
    }

    return response;
  }

  /**
   * Update customer status
   */
  async updateCustomerStatus(
    id: string,
    status: 'Active' | 'Inactive' | 'Suspended'
  ): Promise<ApiResponse<User>> {
    const data = { status };
    return this.updateCustomer(id, data as any);
  }
}

export const customerService = new CustomerService();
