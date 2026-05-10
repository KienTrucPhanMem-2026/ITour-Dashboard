import { apiClient } from '@/lib/api-client';
import { Tour, ApiResponse } from '@/types';

/**
 * Tour Service - Handles all tour-related API calls
 * Communicates with Spring Boot backend at /api/tours
 */
class TourService {
  private endpoint = '/tours';

  /**
   * Transform backend tour data to match frontend Tour type
   */
  private transformTour(data: any): Tour {
    return {
      id: data.id || '',
      name: data.name || '',
      destination: data.startDestination?.name || data.destination || '',
      description: data.description || '',
      image: 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=400&h=300&fit=crop',
      status: (data.status || 'Pending') as any,
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      duration: `${data.durationDays || 0} days ${data.durationNights || 0} nights`,
      capacity: data.maximumSlots || 0,
      booked: 0,
      price: typeof data.price === 'number' ? data.price : 0,
      createdAt: data.createdAt || '',
      updatedAt: data.updatedAt || '',
    };
  }

  /**
   * Get all tours
   */
  async getTours(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    destination?: string;
  }): Promise<ApiResponse<Tour[]>> {
    const response = await apiClient.get<any[]>(`${this.endpoint}`, { params });
    
    if (response.success && Array.isArray(response.data)) {
      const transformedTours = response.data.map(tour => this.transformTour(tour));
      return {
        ...response,
        data: transformedTours,
      };
    }
    
    return response;
  }

  /**
   * Get a single tour by ID
   */
  async getTourById(id: string): Promise<ApiResponse<Tour>> {
    const response = await apiClient.get<any>(`${this.endpoint}/${id}`);
    
    if (response.success && response.data) {
      return {
        ...response,
        data: this.transformTour(response.data),
      };
    }
    
    return response;
  }

  /**
   * Create a new tour
   */
  async createTour(data: Omit<Tour, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Tour>> {
    const response = await apiClient.post<any>(`${this.endpoint}`, data);
    
    if (response.success && response.data) {
      return {
        ...response,
        data: this.transformTour(response.data),
      };
    }
    
    return response;
  }

  /**
   * Update an existing tour
   */
  async updateTour(id: string, data: Partial<Tour>): Promise<ApiResponse<Tour>> {
    const response = await apiClient.put<any>(`${this.endpoint}/${id}`, data);
    
    if (response.success && response.data) {
      return {
        ...response,
        data: this.transformTour(response.data),
      };
    }
    
    return response;
  }

  /**
   * Delete a tour by ID
   */
  async deleteTour(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Find tour by name
   */
  async getTourByName(name: string): Promise<ApiResponse<Tour>> {
    const response = await apiClient.get<any>(`${this.endpoint}/name/${name}`);
    
    if (response.success && response.data) {
      return {
        ...response,
        data: this.transformTour(response.data),
      };
    }
    
    return response;
  }

  /**
   * Find tours by tour type
   */
  async getToursByType(tourType: string): Promise<ApiResponse<Tour[]>> {
    const response = await apiClient.get<any[]>(`${this.endpoint}/type/${tourType}`);
    
    if (response.success && Array.isArray(response.data)) {
      const transformedTours = response.data.map(tour => this.transformTour(tour));
      return {
        ...response,
        data: transformedTours,
      };
    }
    
    return response;
  }

  /**
   * Find tours by manager ID
   */
  async getToursByManagerId(managerId: string): Promise<ApiResponse<Tour[]>> {
    const response = await apiClient.get<any[]>(`${this.endpoint}/manager/${managerId}`);
    
    if (response.success && Array.isArray(response.data)) {
      const transformedTours = response.data.map(tour => this.transformTour(tour));
      return {
        ...response,
        data: transformedTours,
      };
    }
    
    return response;
  }

  /**
   * Find tours by tour planner ID
   */
  async getToursByTourPlannerId(tourPlannerId: string): Promise<ApiResponse<Tour[]>> {
    const response = await apiClient.get<any[]>(`${this.endpoint}/planner/${tourPlannerId}`);
    
    if (response.success && Array.isArray(response.data)) {
      const transformedTours = response.data.map(tour => this.transformTour(tour));
      return {
        ...response,
        data: transformedTours,
      };
    }
    
    return response;
  }

  /**
   * Find tours by status
   */
  async getToursByStatus(status: string): Promise<ApiResponse<Tour[]>> {
    const response = await apiClient.get<any[]>(`${this.endpoint}/status/${status}`);
    
    if (response.success && Array.isArray(response.data)) {
      const transformedTours = response.data.map(tour => this.transformTour(tour));
      return {
        ...response,
        data: transformedTours,
      };
    }
    
    return response;
  }

  /**
   * Search tours by name (case-insensitive)
   */
  async searchToursByName(name: string): Promise<ApiResponse<Tour[]>> {
    const response = await apiClient.get<any[]>(`${this.endpoint}/search/${name}`);
    
    if (response.success && Array.isArray(response.data)) {
      const transformedTours = response.data.map(tour => this.transformTour(tour));
      return {
        ...response,
        data: transformedTours,
      };
    }
    
    return response;
  }

  /**
   * Find tours within date range
   */
  async getToursByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Tour[]>> {
    const response = await apiClient.get<any[]>(`${this.endpoint}/date-range`, {
      params: { startDate, endDate },
    });
    
    if (response.success && Array.isArray(response.data)) {
      const transformedTours = response.data.map(tour => this.transformTour(tour));
      return {
        ...response,
        data: transformedTours,
      };
    }
    
    return response;
  }

  /**
   * Find tours within price range
   */
  async getToursByPriceRange(
    minPrice: number,
    maxPrice: number
  ): Promise<ApiResponse<Tour[]>> {
    const response = await apiClient.get<any[]>(`${this.endpoint}/price-range`, {
      params: { minPrice, maxPrice },
    });
    
    if (response.success && Array.isArray(response.data)) {
      const transformedTours = response.data.map(tour => this.transformTour(tour));
      return {
        ...response,
        data: transformedTours,
      };
    }
    
    return response;
  }

  /**
   * Find tours with rating greater than or equal to specified value
   */
  async getToursByRating(rating: number): Promise<ApiResponse<Tour[]>> {
    const response = await apiClient.get<any[]>(`${this.endpoint}/rating/${rating}`);
    
    if (response.success && Array.isArray(response.data)) {
      const transformedTours = response.data.map(tour => this.transformTour(tour));
      return {
        ...response,
        data: transformedTours,
      };
    }
    
    return response;
  }

  /**
   * Update tour status
   */
  async updateTourStatus(
    id: string,
    status: 'Active' | 'Pending' | 'Completed' | 'Cancelled'
  ): Promise<ApiResponse<Tour>> {
    const data = { status };
    return this.updateTour(id, data as any);
  }

  /**
   * Archive a tour (mark as completed)
   */
  async archiveTour(id: string): Promise<ApiResponse<Tour>> {
    return this.updateTourStatus(id, 'Completed');
  }
}

export const tourService = new TourService();
