import { ApiResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(endpoint, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  /**
   * Fetch wrapper with error handling
   */
  async request<T = any>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;
    
    const url = this.buildUrl(endpoint, params);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    try {
      const response = await fetch(url, {
        credentials: 'include',
        ...fetchOptions,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: data.message || `HTTP ${response.status}`,
          error: data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data,
        status: response.status,
        message: 'Success',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        status: 0,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }

  /**
   * GET request
   */
  get<T = any>(endpoint: string, options: FetchOptions = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  post<T = any>(endpoint: string, body?: any, options: FetchOptions = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  put<T = any>(endpoint: string, body?: any, options: FetchOptions = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  delete<T = any>(endpoint: string, options: FetchOptions = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * PATCH request
   */
  patch<T = any>(endpoint: string, body?: any, options: FetchOptions = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const apiClient = new ApiClient();
