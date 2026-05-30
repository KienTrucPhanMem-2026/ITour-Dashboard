import { apiClient } from '@/lib/api-client';
import { Booking, BookingStatus, ApiResponse, ListResponse } from '@/types';

/**
 * Booking Service - Handles all booking-related API calls
 */
class BookingService {
  private endpoint = '/bookings';

  /**
   * Transform booking data from backend to frontend format
   */
  private transformBooking(data: any): Booking {
    return {
      id: data.id,
      tourId: data.tour?.id || '',
      tourName: data.tour?.name || 'N/A',
      destination: data.tour?.destination || 'N/A',
      userId: data.customer?.id || '',
      userName: data.customer?.fullName || 'N/A',
      userEmail: data.customer?.email || 'N/A',
      numberOfPeople: data.quantity || 0,
      quantity: data.quantity || 0,
      adults: data.adults || 0,
      children: data.children || 0,
      unitPrice: data.unitPrice || 0,
      totalPrice: data.totalPrice || 0,
      discountAmount: data.discountAmount || 0,
      finalPrice: data.finalPrice || 0,
      paymentMethod: data.paymentMethod || 'N/A',
      paymentStatus: data.paymentStatus || 'Unpaid',
      status: data.status || 'Pending',
      bookingDate: data.bookingDate || new Date().toISOString(),
      paymentDate: data.paymentDate,
      pointUsed: data.pointUsed || 0,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Get all bookings with optional pagination and filtering
   */
  async getBookings(params?: {
    page?: number;
    pageSize?: number;
    status?: BookingStatus;
    userId?: string;
    tourId?: string;
  }): Promise<ApiResponse<ListResponse<Booking>>> {
    try {
      console.log('Đang lấy dữ liệu booking... từ backend');
      const response = await apiClient.get<any>(`${this.endpoint}`, { params });
      
      if (response.success && response.data) {
        // Handle both direct array and paginated response
        const items = Array.isArray(response.data) 
          ? response.data 
          : response.data.items || response.data.content || [];
        
        const transformedItems = items.map((item: any) => this.transformBooking(item));
        
        const result: ListResponse<Booking> = {
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
      console.error('Error fetching bookings:', error);
      return { success: false, data: undefined, status: 500 };
    }
  }

  /**
   * Get a single booking by ID
   */
  async getBookingById(id: string): Promise<ApiResponse<Booking>> {
    try {
      const response = await apiClient.get<any>(`${this.endpoint}/${id}`);
      
      if (response.success && response.data) {
        return { success: true, data: this.transformBooking(response.data), status: response.status };
      }
      
      return { success: false, data: undefined, status: response.status };
    } catch (error) {
      console.error('Error fetching booking:', error);
      return { success: false, data: undefined, status: 500 };
    }
  }

  /**
   * Get bookings for a specific user
   */
  async getUserBookings(userId: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<ListResponse<Booking>>> {
    try {
      const response = await apiClient.get<any>(`/users/${userId}/bookings`, { params });
      
      if (response.success && response.data) {
        const items = Array.isArray(response.data) 
          ? response.data 
          : response.data.items || response.data.content || [];
        
        const transformedItems = items.map((item: any) => this.transformBooking(item));
        
        const result: ListResponse<Booking> = {
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
      console.error('Error fetching user bookings:', error);
      return { success: false, data: undefined, status: 500 };
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Booking>> {
    return apiClient.post<Booking>(`${this.endpoint}`, data);
  }

  /**
   * Update booking status
   */
  async updateStatus(id: string, status: BookingStatus): Promise<ApiResponse<Booking>> {
    return apiClient.patch<Booking>(`${this.endpoint}/${id}/status`, { status });
  }

  /**
   * Confirm a booking
   */
  async confirmBooking(id: string): Promise<ApiResponse<Booking>> {
    return this.updateStatus(id, 'Confirmed');
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(id: string): Promise<ApiResponse<Booking>> {
    return this.updateStatus(id, 'Cancelled');
  }

  /**
   * Update booking details
   */
  async updateBooking(id: string, data: Partial<Booking>): Promise<ApiResponse<Booking>> {
    return apiClient.put<Booking>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Delete a booking
   */
  async deleteBooking(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }
}

export const bookingService = new BookingService();
