'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { reportService } from '@/services/reportService';

interface BookingReportProps {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  isLoading: boolean;
}

interface BookingData {
  id: string;
  bookingCode: string;
  customerName: string;
  tourName: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  paymentStatus: 'Paid' | 'Unpaid' | 'Refunded';
  amount: number;
  bookingDate: string;
  numberOfPeople: number;
}

export function BookingReport({ dateRange, isLoading }: BookingReportProps) {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!dateRange.startDate || !dateRange.endDate) return;

      setLoading(true);
      try {
        // Fetch bookings và tours
        const [bookingsRes, toursRes] = await Promise.all([
          reportService.getBookings(),
          reportService.getTours(),
        ]);

        if (!bookingsRes.success || !toursRes.success) {
          console.error('Failed to fetch bookings or tours');
          setLoading(false);
          return;
        }

        const allBookings = bookingsRes.data || [];
        const allTours = toursRes.data || [];

        // Create tour name map for quick lookup (tourId -> name)
        const tourMap = new Map<string, string>(allTours.map((tour: any) => [tour.id, tour.name]));

        // Filter by date range
        const filteredBookings = reportService.filterBookingsByDateRange(
          allBookings,
          dateRange.startDate,
          dateRange.endDate
        );

        // Transform API data to match BookingData interface
        const transformedBookings: BookingData[] = filteredBookings.map((b: any) => {
          // Normalize status - convert from API format to our format
          const apiStatus = b.status || 'PENDING';
          let status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' = 'Pending';
          
          if (apiStatus.toUpperCase() === 'CONFIRMED') status = 'Confirmed';
          else if (apiStatus.toUpperCase() === 'COMPLETED') status = 'Completed';
          else if (apiStatus.toUpperCase() === 'CANCELLED') status = 'Cancelled';
          else status = 'Pending';

          // Normalize payment status
          const apiPaymentStatus = b.paymentStatus || 'UNPAID';
          let paymentStatus: 'Paid' | 'Unpaid' | 'Refunded' = 'Unpaid';
          
          if (apiPaymentStatus.toUpperCase() === 'PAID') paymentStatus = 'Paid';
          else if (apiPaymentStatus.toUpperCase() === 'REFUNDED') paymentStatus = 'Refunded';
          else paymentStatus = 'Unpaid';

          // Calculate number of people (adults + children)
          const numberOfPeople = (b.adults || 0) + (b.children || 0) || b.quantity || 1;

          // Get tour name from tour map using tour id
          const tourId = b.tour;
          const tourName = tourId ? (tourMap.get(tourId) || 'Unknown') : 'Unknown';

          return {
            id: b.id,
            bookingCode: b.id || `BK${b.id}`,
            customerName: b.customer?.fullName || b.customerName || 'Unknown',
            tourName: tourName || 'Unknown',
            status,
            paymentStatus,
            amount: b.finalPrice || b.totalPrice || 0,
            bookingDate: b.bookingDate || b.createdAt || new Date().toISOString(),
            numberOfPeople,
          };
        });

        setBookings(transformedBookings);
        const total = transformedBookings.reduce((sum, item) => sum + item.amount, 0);
        setTotalAmount(total);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [dateRange]);

  const getStatusColor = (status: BookingData['status']) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: BookingData['paymentStatus']) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Unpaid':
        return 'bg-red-100 text-red-800';
      case 'Refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'Confirmed': 'Xác nhận',
      'Completed': 'Hoàn thành',
      'Pending': 'Chờ xử lý',
      'Cancelled': 'Hủy',
    };
    return labels[status] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'Paid': 'Đã thanh toán',
      'Unpaid': 'Chưa thanh toán',
      'Refunded': 'Hoàn tiền',
    };
    return labels[status] || status;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Báo cáo đặt tour</h3>
          <div className="text-right">
            <p className="text-sm text-slate-500">Tổng doanh thu</p>
            <p className="text-2xl font-bold text-slate-900">${totalAmount.toLocaleString()}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đặt tour</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Tour</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead className="text-center">Số người</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thanh toán</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading || isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    Không có dữ liệu đặt tour trong khoảng thời gian này
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium text-slate-900">
                      {booking.bookingCode}
                    </TableCell>
                    <TableCell>{booking.customerName}</TableCell>
                    <TableCell>{booking.tourName}</TableCell>
                    <TableCell>
                      {format(new Date(booking.bookingDate), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-center">{booking.numberOfPeople}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${booking.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                        {getPaymentStatusLabel(booking.paymentStatus)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center text-sm text-slate-600 pt-4 border-t">
          <p>Tổng số đặt tour: <span className="font-semibold text-slate-900">{bookings.length}</span></p>
          <p>Trung bình mỗi đặt tour: <span className="font-semibold text-slate-900">${bookings.length > 0 ? Math.round(totalAmount / bookings.length) : 0}</span></p>
        </div>
      </div>
    </Card>
  );
}
