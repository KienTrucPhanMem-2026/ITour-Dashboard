import { apiClient } from '@/lib/api-client';
import { Account, ApiResponse, ListResponse } from '@/types';

/**
 * Account Service - Handles all user account-related API calls
 */
class AccountService {
  private endpoint = '/users';

  /**
   * Transform user data from backend to Account format
   */
  private transformAccount(data: any): Account {
    return {
      id: data.id,
      userName: data.userName || 'N/A',
      fullName: data.fullName || 'N/A',
      email: data.email || 'N/A',
      phone: data.phone || '',
      address: data.address || '',
      dateOfBirth: data.dateOfBirth || '',
      role: data.role || 'USER',
      isActive: data.isActive !== false,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      branch: data.branch,
    };
  }

  /**
   * Get all accounts with optional pagination and filtering
   */
  async getAccounts(params?: {
    page?: number;
    pageSize?: number;
    role?: string;
  }): Promise<ApiResponse<ListResponse<Account>>> {
    try {
      console.log('Đang lấy dữ liệu tài khoản... từ backend');
      const response = await apiClient.get<any>(`${this.endpoint}`, { params });

      if (response.success && response.data) {
        // Handle both direct array and paginated response
        const items = Array.isArray(response.data)
          ? response.data
          : response.data.items || response.data.content || [];

        const transformedItems = items.map((item) => this.transformAccount(item));

        const result: ListResponse<Account> = {
          items: transformedItems,
          total: response.data.total || transformedItems.length,
          page: response.data.page || 1,
          pageSize: response.data.pageSize || transformedItems.length,
          totalPages: response.data.totalPages || 1,
        };

        return { success: true, data: result, status: response.status };
      }

      return { success: false, data: undefined, status: response.status };
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return { success: false, data: undefined, status: 500 };
    }
  }

  /**
   * Get a single account by ID
   */
  async getAccountById(id: string): Promise<ApiResponse<Account>> {
    try {
      const response = await apiClient.get<any>(`${this.endpoint}/${id}`);

      if (response.success && response.data) {
        return { success: true, data: this.transformAccount(response.data), status: response.status };
      }

      return { success: false, data: undefined, status: response.status };
    } catch (error) {
      console.error('Error fetching account:', error);
      return { success: false, data: undefined, status: 500 };
    }
  }

  /**
   * Search accounts by username or email
   */
  async searchAccounts(query: string): Promise<ApiResponse<Account[]>> {
    try {
      const accounts = await this.getAccounts();
      if (accounts.success && accounts.data) {
        const results = accounts.data.items.filter(
          (acc) =>
            acc.userName.toLowerCase().includes(query.toLowerCase()) ||
            acc.email.toLowerCase().includes(query.toLowerCase()) ||
            acc.fullName.toLowerCase().includes(query.toLowerCase())
        );
        return { success: true, data: results, status: 200 };
      }
      return { success: false, data: [], status: accounts.status };
    } catch (error) {
      console.error('Error searching accounts:', error);
      return { success: false, data: [], status: 500 };
    }
  }

  /**
   * Get accounts by role
   */
  async getAccountsByRole(role: string): Promise<ApiResponse<Account[]>> {
    try {
      const accounts = await this.getAccounts({ role });
      if (accounts.success && accounts.data) {
        return { success: true, data: accounts.data.items, status: 200 };
      }
      return { success: false, data: [], status: accounts.status };
    } catch (error) {
      console.error('Error fetching accounts by role:', error);
      return { success: false, data: [], status: 500 };
    }
  }

  /**
   * Update account status
   */
  async updateAccountStatus(id: string, isActive: boolean): Promise<ApiResponse<Account>> {
    try {
      const response = await apiClient.patch<any>(`${this.endpoint}/${id}`, {
        isActive,
      });

      if (response.success && response.data) {
        return { success: true, data: this.transformAccount(response.data), status: response.status };
      }

      return { success: false, data: undefined, status: response.status };
    } catch (error) {
      console.error('Error updating account status:', error);
      return { success: false, data: undefined, status: 500 };
    }
  }

  /**
   * Update account details
   */
  async updateAccount(id: string, data: Partial<Account>): Promise<ApiResponse<Account>> {
    try {
      const response = await apiClient.put<any>(`${this.endpoint}/${id}`, data);

      if (response.success && response.data) {
        return { success: true, data: this.transformAccount(response.data), status: response.status };
      }

      return { success: false, data: undefined, status: response.status };
    } catch (error) {
      console.error('Error updating account:', error);
      return { success: false, data: undefined, status: 500 };
    }
  }

  /**
   * Delete account
   */
  async deleteAccount(id: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await apiClient.delete(`${this.endpoint}/${id}`);
      return { success: response.success, data: { success: true }, status: response.status };
    } catch (error) {
      console.error('Error deleting account:', error);
      return { success: false, data: undefined, status: 500 };
    }
  }

  /**
   * Create new account
   */
  async createAccount(data: {
    userName: string;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    role?: string;
  }): Promise<ApiResponse<Account>> {
    try {
      const response = await apiClient.post<any>(`${this.endpoint}`, data);

      if (response.success && response.data) {
        return { success: true, data: this.transformAccount(response.data), status: response.status };
      }

      return { success: false, data: undefined, status: response.status };
    } catch (error) {
      console.error('Error creating account:', error);
      return { success: false, data: undefined, status: 500 };
    }
  }
}

export const accountService = new AccountService();
