import { apiClient } from '@/lib/api-client';
import { User, ApiResponse, ListResponse } from '@/types';

/**
 * User Service - Handles all user/customer-related API calls
 */
class UserService {
  private endpoint = '/users';

  /**
   * Get all customers/users with optional pagination and filtering
   */
  async getCustomers(params?: {
    page?: number;
    pageSize?: number;
    status?: 'Active' | 'Inactive' | 'Suspended';
    search?: string;
  }): Promise<ApiResponse<ListResponse<User>>> {
    return apiClient.get<ListResponse<User>>(`${this.endpoint}`, { params });
  }

  /**
   * Get a single user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    return apiClient.get<User>(`${this.endpoint}/${id}`);
  }

  /**
   * Create a new user
   */
  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<User>> {
    return apiClient.post<User>(`${this.endpoint}`, data);
  }

  /**
   * Update user information
   */
  async updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put<User>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }

  /**
   * Update user status
   */
  async updateUserStatus(
    id: string,
    status: 'Active' | 'Inactive' | 'Suspended'
  ): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`${this.endpoint}/${id}/status`, { status });
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return apiClient.get<User[]>(`${this.endpoint}/search`, {
      params: { q: query },
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(id: string): Promise<ApiResponse<{
    totalBookings: number;
    totalSpent: number;
    avgRating?: number;
    completedTours: number;
  }>> {
    return apiClient.get(`${this.endpoint}/${id}/stats`);
  }
}

export const userService = new UserService();
