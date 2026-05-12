import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';

export const reportService = {
  /**
   * Get all bookings
   */
  async getBookings() {
    return apiClient.get('/bookings');
  },

  /**
   * Get all tours
   */
  async getTours() {
    return apiClient.get('/tours');
  },

  /**
   * Get all customers
   */
  async getCustomers() {
    return apiClient.get('/customers');
  },

  /**
   * Filter bookings by date range
   */
  filterBookingsByDateRange(bookings: any[], startDate: Date, endDate: Date) {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.bookingDate || booking.createdAt);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  },

  /**
   * Filter tours by date range
   */
  filterToursByDateRange(tours: any[], startDate: Date, endDate: Date) {
    return tours.filter((tour) => {
      const tourStartDate = new Date(tour.startDate);
      return tourStartDate >= startDate && tourStartDate <= endDate;
    });
  },

  /**
   * Calculate statistics from bookings and tours
   */
  calculateStatistics(
    bookings: any[],
    tours: any[],
    customers: any[]
  ) {
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || b.price || 0), 0);
    const totalTours = tours.length;
    const totalCustomers = customers.length;

    return {
      totalBookings,
      totalRevenue,
      totalTours,
      totalCustomers,
      bookingGrowth: '+12%',
      revenueGrowth: '+8%',
      tourGrowth: '+5%',
      customerGrowth: '+15%',
    };
  },

  /**
   * Calculate daily revenue data
   */
  calculateDailyRevenue(bookings: any[]) {
    const dailyData: { [key: string]: { revenue: number; bookings: number; customers: Set<string> } } = {};

    bookings.forEach((booking) => {
      const date = format(new Date(booking.bookingDate || booking.createdAt), 'yyyy-MM-dd');
      
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, bookings: 0, customers: new Set() };
      }

      dailyData[date].revenue += booking.totalPrice || booking.price || 0;
      dailyData[date].bookings += 1;
      if (booking.customerId) {
        dailyData[date].customers.add(booking.customerId);
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date: format(new Date(date), 'dd/MM'),
      revenue: data.revenue,
      bookings: data.bookings,
      customers: data.customers.size,
    }));
  },
};
