'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { BookingTable } from '@/components/dashboard/booking-table';
import { BookingDialog } from '@/components/dashboard/booking-dialog';
import { BookingDetailDrawer } from '@/components/dashboard/booking-detail-drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Calendar as CalendarIcon, RefreshCw, XCircle } from 'lucide-react';
import { DatePicker, Tabs, Tag as AntTag } from 'antd';
import { bookingService } from '@/services/bookingService';
import { Booking } from '@/types';

const { RangePicker } = DatePicker;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // Match tabs selection
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<any>(null); // For start date filtering
  
  // Dialogs and Drawers states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, searchQuery, statusFilter, paymentFilter, dateRange]);

  const applyFilters = () => {
    let filtered = bookings;

    // Apply search filter (Mã booking, Tour, Khách hàng, Email)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          `#bkg-${booking.id.toLowerCase()}`.includes(q) ||
          booking.id.toLowerCase().includes(q) ||
          booking.tourName?.toLowerCase().includes(q) ||
          booking.userName?.toLowerCase().includes(q) ||
          booking.userEmail?.toLowerCase().includes(q)
      );
    }

    // Apply status filter matching tab selection (supports case insensitivity)
    if (statusFilter && statusFilter !== 'ALL') {
      filtered = filtered.filter((booking) => {
        const bStatus = String(booking.status).toUpperCase();
        const fStatus = statusFilter.toUpperCase();
        // Support matching 'PENDING_APPROVAL', 'PENDING' etc with 'PENDING' tab
        if (fStatus === 'PENDING') {
          return bStatus.startsWith('PENDING');
        }
        return bStatus === fStatus;
      });
    }

    // Apply payment status filter
    if (paymentFilter) {
      filtered = filtered.filter((booking) => {
        const bPayStatus = String(booking.paymentStatus).toUpperCase();
        const fPayStatus = paymentFilter.toUpperCase();
        return bPayStatus === fPayStatus;
      });
    }

    // Apply Date Range filter (Lọc theo Ngày đặt bookingDate hoặc Ngày khởi hành startDate)
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day').toDate().getTime();
      const end = dateRange[1].endOf('day').toDate().getTime();
      
      filtered = filtered.filter((booking) => {
        // Match either bookingDate or startDate within range
        const bDate = booking.bookingDate ? new Date(booking.bookingDate).getTime() : 0;
        const sDate = booking.startDate ? new Date(booking.startDate).getTime() : 0;
        return (bDate >= start && bDate <= end) || (sDate >= start && sDate <= end);
      });
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
    setSelectedBooking(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  const handleViewDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleDetailClose = () => {
    setIsDetailOpen(false);
    setSelectedBooking(null);
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (selectedBooking) {
        // Update existing booking
        await bookingService.updateBooking(selectedBooking.id, formData);
        setBookings(
          bookings.map((b) =>
            b.id === selectedBooking.id
              ? { ...b, ...formData, updatedAt: new Date().toISOString() }
              : b
          )
        );
      } else {
        // Create new booking
        const response = await bookingService.createBooking(formData);
        if (response.success && response.data) {
          setBookings([response.data, ...bookings]);
        } else {
          alert('Lỗi: ' + (response.message || 'Không thể tạo đặt tour'));
        }
      }
      handleDialogClose();
    } catch (err) {
      console.error('Failed to save booking:', err);
      alert('Lỗi: Không thể lưu đặt tour. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate counts for each status
  const getCount = (statusKey: string) => {
    if (statusKey === 'ALL') return bookings.length;
    return bookings.filter((b) => {
      const bStatus = String(b.status).toUpperCase();
      if (statusKey === 'PENDING') return bStatus.startsWith('PENDING');
      return bStatus === statusKey;
    }).length;
  };

  const tabsItems = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ xác nhận', count: getCount('PENDING') },
    { key: 'AWAITING_PAYMENT', label: 'Chờ thanh toán', count: getCount('AWAITING_PAYMENT') },
    { key: 'CONFIRMED', label: 'Đã xác nhận', count: getCount('CONFIRMED') },
    { key: 'COMPLETED', label: 'Hoàn thành', count: getCount('COMPLETED') },
    { key: 'CANCELLED', label: 'Đã hủy', count: getCount('CANCELLED') },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Quản Lý Đặt Tour</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi, điều phối và xác nhận các giao dịch đặt phòng của khách hàng</p>
        </div>
      </div>

      {/* Toolbar & Filters Inside a Modern Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/70 p-5 mb-6 space-y-4">
        {/* Row 1: Single Line Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 w-full">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Mã đơn, tên khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all bg-slate-50/50 hover:bg-white text-slate-800"
              />
            </div>

            {/* Date Range Picker */}
            <div className="w-full sm:w-[260px] datepicker-range-wrapper">
              <RangePicker
                placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                className="w-full rounded-xl border-slate-200 py-2 hover:border-emerald-500 hover:bg-white focus:border-emerald-500 transition-all"
                style={{ height: '38px' }}
              />
            </div>

            {/* Payment Status Dropdown */}
            <div className="w-full sm:w-[180px]">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                title="Trạng thái thanh toán"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer h-[38px]"
              >
                <option value="">Tất cả thanh toán</option>
                <option value="Paid">Đã thanh toán</option>
                <option value="Unpaid">Chưa thanh toán</option>
                <option value="Refunded">Hoàn tiền</option>
              </select>
            </div>

            {/* Reset Button */}
            {(searchQuery || paymentFilter || dateRange || (statusFilter && statusFilter !== 'ALL')) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setPaymentFilter('');
                  setDateRange(null);
                  setStatusFilter('ALL');
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl px-3.5 h-9 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
              >
                <XCircle className="w-3.5 h-3.5" />
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {/* Create Booking Button */}
          <Button
            onClick={handleCreateBooking}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-5 active:scale-95 transition-all shadow-md shadow-emerald-100/50 h-[38px] border-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Thêm Đặt Tour
          </Button>
        </div>

        {/* Row 2: Tabs Filter */}
        <div className="border-t border-slate-100 pt-3">
          <Tabs
            activeKey={statusFilter}
            onChange={(key) => setStatusFilter(key)}
            className="booking-status-tabs"
            items={tabsItems.map((tab) => ({
              key: tab.key,
              label: (
                <span className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider select-none py-1">
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <AntTag color={tab.key === 'PENDING' ? 'warning' : tab.key === 'AWAITING_PAYMENT' ? 'orange' : 'default'} className="m-0 border-0 font-extrabold text-[9px] px-1.5 py-0.2 rounded-full shrink-0">
                      {tab.count}
                    </AntTag>
                  )}
                </span>
              ),
            }))}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && !bookings.length && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-sm text-amber-700 font-semibold">
            ⚠️ {error} - Hiển thị dữ liệu mẫu để minh họa
          </p>
        </div>
      )}

      {/* Bookings Table */}
      <div className="mb-6">
        <BookingTable
          bookings={filteredBookings}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onViewDetail={handleViewDetail}
          isLoading={isLoading}
        />
      </div>

      {/* Booking Dialog */}
      <BookingDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleSubmit}
        booking={selectedBooking}
        isLoading={isSubmitting}
      />

      {/* Booking Detail Drawer */}
      <BookingDetailDrawer
        isOpen={isDetailOpen}
        onClose={handleDetailClose}
        booking={selectedBooking}
      />
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
