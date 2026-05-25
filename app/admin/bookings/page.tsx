'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { BookingTable } from '@/components/dashboard/booking-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import { bookingService } from '@/services/bookingService';
import { Booking } from '@/types';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, searchQuery, statusFilter, paymentFilter]);

  const applyFilters = () => {
    let filtered = bookings;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (booking) =>
          booking.tourName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    // Apply payment status filter
    if (paymentFilter) {
      filtered = filtered.filter((booking) => booking.paymentStatus === paymentFilter);
    }

    setFilteredBookings(filtered);
  };

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
            <h1 className="text-3xl font-bold text-slate-900">Quản Lý Đặt Tour</h1>
            <p className="text-slate-500 mt-2">Quản lý và theo dõi tất cả các đặt phòng</p>
          </div>
          <Button
            onClick={handleCreateBooking}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm Đặt Tour
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo tour, khách hàng hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-2 rounded-2xl border border-slate-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex gap-2 items-center">
            <Filter className="w-5 h-5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Lọc theo trạng thái"
              className="flex-1 px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Pending">Chờ xử lý</option>
              <option value="Confirmed">Xác nhận</option>
              <option value="Cancelled">Hủy bỏ</option>
              <option value="Completed">Hoàn thành</option>
            </select>
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            title="Lọc theo trạng thái thanh toán"
            className="px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tất cả thanh toán</option>
            <option value="Paid">Đã thanh toán</option>
            <option value="Unpaid">Chưa thanh toán</option>
            <option value="Refunded">Hoàn tiền</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && !bookings.length && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-sm text-amber-700">
            {error} - Hiển thị dữ liệu mẫu để minh họa
          </p>
        </div>
      )}

      {/* Bookings Table */}
      <div>
        <BookingTable
          bookings={filteredBookings}
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
    quantity: 2,
    adults: 2,
    children: 0,
    numberOfPeople: 2,
    unitPrice: 1299,
    totalPrice: 2598,
    discountAmount: 0,
    finalPrice: 2598,
    paymentMethod: 'CREDIT_CARD',
    paymentStatus: 'Paid',
    status: 'Confirmed',
    bookingDate: '2024-02-01T10:00:00Z',
    paymentDate: '2024-02-01T10:30:00Z',
    startDate: '2024-03-15T00:00:00Z',
    pointUsed: 0,
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
    quantity: 3,
    adults: 2,
    children: 1,
    numberOfPeople: 3,
    unitPrice: 1599,
    totalPrice: 4797,
    discountAmount: 300,
    finalPrice: 4497,
    paymentMethod: 'BANK_TRANSFER',
    paymentStatus: 'Unpaid',
    status: 'Pending',
    bookingDate: '2024-02-05T14:30:00Z',
    startDate: '2024-03-20T00:00:00Z',
    pointUsed: 100,
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
    quantity: 1,
    adults: 1,
    children: 0,
    numberOfPeople: 1,
    unitPrice: 1899,
    totalPrice: 1899,
    discountAmount: 0,
    finalPrice: 1899,
    paymentMethod: 'E_WALLET',
    paymentStatus: 'Paid',
    status: 'Confirmed',
    bookingDate: '2024-02-10T09:15:00Z',
    paymentDate: '2024-02-10T09:45:00Z',
    startDate: '2024-04-10T00:00:00Z',
    pointUsed: 50,
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
    quantity: 4,
    adults: 2,
    children: 2,
    numberOfPeople: 4,
    unitPrice: 999,
    totalPrice: 3996,
    discountAmount: 500,
    finalPrice: 3496,
    paymentMethod: 'CASH',
    paymentStatus: 'Unpaid',
    status: 'Cancelled',
    bookingDate: '2024-02-03T11:45:00Z',
    startDate: '2024-03-25T00:00:00Z',
    pointUsed: 0,
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
    quantity: 2,
    adults: 2,
    children: 0,
    numberOfPeople: 2,
    unitPrice: 2499,
    totalPrice: 4998,
    discountAmount: 0,
    finalPrice: 4998,
    paymentMethod: 'CREDIT_CARD',
    paymentStatus: 'Paid',
    status: 'Completed',
    bookingDate: '2024-01-20T13:00:00Z',
    paymentDate: '2024-01-20T13:30:00Z',
    startDate: '2024-02-28T00:00:00Z',
    pointUsed: 200,
    createdAt: '2024-01-20T13:00:00Z',
    updatedAt: '2024-03-05T15:30:00Z',
  },
];
