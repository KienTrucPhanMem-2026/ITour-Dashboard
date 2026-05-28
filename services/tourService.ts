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
      schedules: Array.isArray(data.schedules) ? data.schedules : [],
      itinerary: Array.isArray(data.itinerary) ? data.itinerary : [],
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
    const response = await apiClient.get<any>(`${this.endpoint}`, { params });
    
    if (!response.success) {
      return response;
    }

    let toursData: any[] = [];
    
    // Handle different backend response formats
    if (Array.isArray(response.data)) {
      // Direct array response: [tour1, tour2, ...]
      toursData = response.data;
    } else if (response.data && typeof response.data === 'object') {
      // Wrapped response - check for common wrapper fields
      if (Array.isArray(response.data.data)) {
        toursData = response.data.data;
      } else if (Array.isArray(response.data.content)) {
        toursData = response.data.content;
      } else if (Array.isArray(response.data.tours)) {
        toursData = response.data.tours;
      }
    }
    const transformedTours = toursData.map(tour => {
      const transformed = this.transformTour(tour);
      return transformed;
    });
    return {
      ...response,
      data: transformedTours,
    };
  }

  /**
   * Get a single tour by ID
   */
  async getTourById(id: string): Promise<ApiResponse<Tour>> {
    const response = await apiClient.get<any>(`${this.endpoint}/${id}`);
    
    
    if (response.success && response.data) {
      const transformed = this.transformTour(response.data);
      return {
        ...response,
        data: transformed,
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
   * Update an existing tour (partial update using PATCH)
   */
  async updateTour(id: string, data: Partial<Tour>): Promise<ApiResponse<Tour>> {
    
    // Use PATCH instead of PUT to allow partial updates
    const response = await apiClient.patch<any>(`${this.endpoint}/${id}`, data);
    
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
    status: string
  ): Promise<ApiResponse<Tour>> {
    const data = { status };
    return this.updateTour(id, data as any);
  }

  /**
   * Disable a tour
   */
  async disableTour(id: string): Promise<ApiResponse<Tour>> {
    return this.updateTourStatus(id, 'INACTIVE');
  }

  /**
   * Add image to tour
   */
  async addTourImage(id: string, imageFile: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    return apiClient.post<any>(`${this.endpoint}/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Delete image from tour
   */
  async deleteTourImage(tourId: string, imageId?: string): Promise<ApiResponse<void>> {
    const url = imageId 
      ? `${this.endpoint}/${tourId}/images/${imageId}`
      : `${this.endpoint}/${tourId}/images`;
    
    return apiClient.delete<void>(url);
  }

  /**
   * Update single tour schedule
   */
  async updateTourSchedule(id: string, schedule: any): Promise<ApiResponse<any>> {
    console.log('🗓️ Updating single schedule:', id, schedule);
    const response = await apiClient.patch<any>(`/tour-schedules/${id}`, schedule);
    console.log('🗓️ Update schedule response:', response);
    return response;
  }

  /**
   * Update tour schedules - batch
   */
  async updateTourSchedules(schedules: any[]): Promise<ApiResponse<any>> {
    console.log('🗓️ Updating tour schedules:', schedules);
    const response = await apiClient.patch<any>('/tour-schedules', schedules);
    console.log('🗓️ Update schedules response:', response);
    return response;
  }

  /**
   * Archive a tour (mark as completed)
   */
  async archiveTour(id: string): Promise<ApiResponse<Tour>> {
    return this.updateTourStatus(id, 'COMPLETED');
  }

  /**
   * Create tour itinerary (location)
   */
  async createTourItinerary(payload: any): Promise<ApiResponse<any>> {
    console.log('➕ Creating tour itinerary:', payload);
    const response = await apiClient.post<any>('/tour-locations', payload);
    console.log('➕ Create itinerary response:', response);
    return response;
  }

  /**
   * Update single tour itinerary (location)
   */
  async updateTourItinerary(id: string, itinerary: any): Promise<ApiResponse<any>> {
    console.log('🗓️ Updating single itinerary:', id, itinerary);
    const response = await apiClient.patch<any>(`/tour-locations/${id}`, itinerary);
    console.log('🗓️ Update itinerary response:', response);
    return response;
  }

  /**
   * Delete tour itinerary (location)
   */
  async deleteTourItinerary(id: string): Promise<ApiResponse<any>> {
    console.log('🗑️ Deleting itinerary:', id);
    const response = await apiClient.delete<any>(`/tour-locations/${id}`);
    console.log('🗑️ Delete itinerary response:', response);
    return response;
  }
}

export const tourService = new TourService();
