import { apiClient } from '@/lib/api-client';
import { Booking, BookingStatus, ApiResponse, ListResponse } from '@/types';

/**
 * Booking Service - Handles all booking-related API calls
 */
class BookingService {
  private endpoint = '/bookings';

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
    return apiClient.get<ListResponse<Booking>>(`${this.endpoint}`, { params });
  }

  /**
   * Get a single booking by ID
   */
  async getBookingById(id: string): Promise<ApiResponse<Booking>> {
    return apiClient.get<Booking>(`${this.endpoint}/${id}`);
  }

  /**
   * Get bookings for a specific user
   */
  async getUserBookings(userId: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<ListResponse<Booking>>> {
    return apiClient.get<ListResponse<Booking>>(`/users/${userId}/bookings`, { params });
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
