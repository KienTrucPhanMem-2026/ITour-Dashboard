'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { BookingTable } from '@/components/dashboard/booking-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { bookingService } from '@/services/bookingService';
import { Booking } from '@/types';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bookingService.getBookings({
        page: 1,
        pageSize: 10,
      });

      if (response.success && response.data) {
        setBookings(response.data.items);
      } else {
        setError(response.message || 'Failed to fetch bookings');
        // Set mock data as fallback
        setBookings(mockBookings);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      // Set mock data as fallback
      setBookings(mockBookings);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, status: Booking['status']) => {
    try {
      await bookingService.updateStatus(bookingId, status);
      // Update local state
      setBookings(
        bookings.map((b) =>
          b.id === bookingId ? { ...b, status } : b
        )
      );
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  const handleCreateBooking = () => {
    // TODO: Open create booking modal/dialog
    console.log('Create booking clicked');
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Bookings</h1>
            <p className="text-slate-500 mt-2">Manage and track all reservations</p>
          </div>
          <Button
            onClick={handleCreateBooking}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && !bookings.length && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-sm text-amber-700">
            {error} - Displaying mock data for demonstration
          </p>
        </div>
      )}

      {/* Bookings Table */}
      <div>
        <BookingTable
          bookings={bookings}
          onStatusChange={handleStatusChange}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}

// Mock data as fallback
const mockBookings: Booking[] = [
  {
    id: '1',
    tourId: '1',
    tourName: 'Bali Beach Paradise',
    destination: 'Bali, Indonesia',
    userId: 'u1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    numberOfPeople: 2,
    totalPrice: 2598,
    status: 'Confirmed',
    bookingDate: '2024-02-01T10:00:00Z',
    startDate: '2024-03-15T00:00:00Z',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: '2',
    tourId: '2',
    tourName: 'Paris City Tour',
    destination: 'Paris, France',
    userId: 'u2',
    userName: 'Jane Smith',
    userEmail: 'jane@example.com',
    numberOfPeople: 3,
    totalPrice: 4797,
    status: 'Pending',
    bookingDate: '2024-02-05T14:30:00Z',
    startDate: '2024-03-20T00:00:00Z',
    createdAt: '2024-02-05T14:30:00Z',
    updatedAt: '2024-02-05T14:30:00Z',
  },
  {
    id: '3',
    tourId: '3',
    tourName: 'Tokyo Adventure',
    destination: 'Tokyo, Japan',
    userId: 'u3',
    userName: 'Mike Johnson',
    userEmail: 'mike@example.com',
    numberOfPeople: 1,
    totalPrice: 1899,
    status: 'Confirmed',
    bookingDate: '2024-02-10T09:15:00Z',
    startDate: '2024-04-10T00:00:00Z',
    createdAt: '2024-02-10T09:15:00Z',
    updatedAt: '2024-02-10T09:15:00Z',
  },
  {
    id: '4',
    tourId: '4',
    tourName: 'New York Explorer',
    destination: 'New York, USA',
    userId: 'u4',
    userName: 'Sarah Williams',
    userEmail: 'sarah@example.com',
    numberOfPeople: 4,
    totalPrice: 3996,
    status: 'Cancelled',
    bookingDate: '2024-02-03T11:45:00Z',
    startDate: '2024-03-25T00:00:00Z',
    createdAt: '2024-02-03T11:45:00Z',
    updatedAt: '2024-02-08T16:20:00Z',
  },
  {
    id: '5',
    tourId: '5',
    tourName: 'Safari Expedition',
    destination: 'Kenya, Africa',
    userId: 'u5',
    userName: 'Robert Brown',
    userEmail: 'robert@example.com',
    numberOfPeople: 2,
    totalPrice: 4998,
    status: 'Completed',
    bookingDate: '2024-01-20T13:00:00Z',
    startDate: '2024-02-28T00:00:00Z',
    createdAt: '2024-01-20T13:00:00Z',
    updatedAt: '2024-03-05T15:30:00Z',
  },
];
