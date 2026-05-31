'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, TrendingUp } from 'lucide-react';
import { Avatar as AntAvatar } from 'antd';

interface BookingReportProps {
  dateRange: { startDate: Date | null; endDate: Date | null };
  isLoading: boolean;
  statusFilter?: string | null;
}

interface BookingData {
  id: string;
  bookingCode: string;
  customerName: string;
  customerEmail?: string;
  tourName: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  paymentStatus: 'Paid' | 'Unpaid' | 'Refunded';
  amount: number;
  bookingDate: string;
  numberOfPeople: number;
}

const bookingStatusMap: Record<string, { label: string; cls: string }> = {
  Confirmed:        { label: 'Đã xác nhận',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CONFIRMED:        { label: 'Đã xác nhận',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Completed:        { label: 'Hoàn thành',     cls: 'bg-blue-50   text-blue-700   border-blue-200'     },
  COMPLETED:        { label: 'Hoàn thành',     cls: 'bg-blue-50   text-blue-700   border-blue-200'     },
  Pending:          { label: 'Chờ xử lý',      cls: 'bg-amber-50  text-amber-700  border-amber-200'    },
  PENDING:          { label: 'Chờ xử lý',      cls: 'bg-amber-50  text-amber-700  border-amber-200'    },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', cls: 'bg-orange-50 text-orange-700 border-orange-200'   },
  Cancelled:        { label: 'Đã hủy',         cls: 'bg-rose-50   text-rose-700   border-rose-200'     },
  CANCELLED:        { label: 'Đã hủy',         cls: 'bg-rose-50   text-rose-700   border-rose-200'     },
};

const paymentStatusMap: Record<string, { label: string; cls: string }> = {
  Paid:     { label: 'Đã TT',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PAID:     { label: 'Đã TT',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Unpaid:   { label: 'Chưa TT',     cls: 'bg-rose-50    text-rose-700    border-rose-200'    },
  UNPAID:   { label: 'Chưa TT',     cls: 'bg-rose-50    text-rose-700    border-rose-200'    },
  Refunded: { label: 'Hoàn tiền',   cls: 'bg-slate-100  text-slate-600   border-slate-200'   },
  REFUNDED: { label: 'Hoàn tiền',   cls: 'bg-slate-100  text-slate-600   border-slate-200'   },
};

function getInitials(name: string) {
  if (!name || name === 'Unknown') return 'KH';
  const parts = name.trim().split(/\s+/);
  return (parts.length === 1
    ? parts[0].substring(0, 2)
    : parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase();
}

const avatarColors = [
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
];

function getAvatarColor(name: string) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return avatarColors[sum % avatarColors.length];
}

export function BookingReport({ dateRange, isLoading, statusFilter }: BookingReportProps) {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!dateRange.startDate || !dateRange.endDate) return;
      setLoading(true);
      try {
        const [bookingsRes, toursRes] = await Promise.all([
          reportService.getBookings(),
          reportService.getTours(),
        ]);

        const allBookings = bookingsRes.data || [];
        const allTours = toursRes.data || [];
        const tourMap = new Map<string, string>(allTours.map((t: any) => [t.id, t.name]));

        const filteredBookings = reportService.filterBookingsByDateRange(
          allBookings,
          dateRange.startDate!,
          dateRange.endDate!
        );

        const transformed: BookingData[] = filteredBookings.map((b: any) => {
          const rawStatus = (b.status || 'PENDING').toUpperCase();
          let status: BookingData['status'] = 'Pending';
          if (rawStatus === 'CONFIRMED') status = 'Confirmed';
          else if (rawStatus === 'COMPLETED') status = 'Completed';
          else if (rawStatus === 'CANCELLED') status = 'Cancelled';

          const rawPay = (b.paymentStatus || 'UNPAID').toUpperCase();
          let paymentStatus: BookingData['paymentStatus'] = 'Unpaid';
          if (rawPay === 'PAID') paymentStatus = 'Paid';
          else if (rawPay === 'REFUNDED') paymentStatus = 'Refunded';

          const numberOfPeople = (b.adults || 0) + (b.children || 0) || b.quantity || 1;
          const tourId = b.tourId || b.tour;
          const tourName = (tourId && tourMap.get(tourId)) || b.tourName || 'Unknown';
          
          // Use real booking ID directly, padded for display
          const rawId = b.bookingId || b.id || '';
          const bookingCode = rawId ? `#BKG-${rawId.slice(-6).toUpperCase()}` : '#BKG-000000';

          return {
            id: rawId,
            bookingCode,
            customerName: b.customerName || b.customer?.fullName || 'Khách hàng',
            customerEmail: b.customerEmail || b.customer?.email,
            tourName,
            status,
            paymentStatus,
            amount: b.finalPrice || b.totalPrice || 0,
            bookingDate: b.bookingDate || b.createdAt || new Date().toISOString(),
            numberOfPeople,
          };
        });

        // Apply optional status filter from Donut chart cross-filtering
        const display = statusFilter
          ? transformed.filter((b) => {
              const label = bookingStatusMap[b.status]?.label || b.status;
              return label === statusFilter;
            })
          : transformed;

        setBookings(display);
        setTotalAmount(display.reduce((sum, item) => sum + item.amount, 0));
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [dateRange, statusFilter]);

  const isAnyLoading = loading || isLoading;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Giao dịch Đặt Tour Gần Đây
          </h3>
          {statusFilter && (
            <p className="text-xs text-blue-600 font-bold mt-1">
              Đang lọc: "{statusFilter}"
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng doanh thu</p>
          <p className="text-xl font-black text-emerald-600">
            {isAnyLoading ? '—' : totalAmount.toLocaleString('vi-VN') + ' ₫'}
          </p>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        {isAnyLoading ? (
          <div className="p-10 text-center">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-semibold">Đang tải dữ liệu...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm font-semibold">Không có giao dịch nào trong khoảng thời gian này</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-wider">Mã đơn & Khách hàng</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-wider">Tour</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-wider">Ngày đặt</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-wider">Khách</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-wider">Doanh thu</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((booking) => {
                const bStatus = bookingStatusMap[booking.status] || { label: booking.status, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
                const pStatus = paymentStatusMap[booking.paymentStatus] || { label: booking.paymentStatus, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
                const initials = getInitials(booking.customerName);
                const avatarCls = getAvatarColor(booking.customerName);

                return (
                  <tr key={booking.id} className="hover:bg-slate-50/40 transition-colors group">
                    {/* Col 1: Code + Customer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-extrabold border ${avatarCls}`}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-xs tracking-tight">{booking.bookingCode}</p>
                          <p className="text-[11px] font-semibold text-slate-600 mt-0.5">{booking.customerName}</p>
                          {booking.customerEmail && (
                            <p className="text-[10px] text-slate-400 font-medium">{booking.customerEmail}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Col 2: Tour */}
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors" title={booking.tourName}>
                        {booking.tourName}
                      </p>
                    </td>

                    {/* Col 3: Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
                        {format(new Date(booking.bookingDate), 'dd/MM/yyyy')}
                      </div>
                    </td>

                    {/* Col 4: Passengers */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs font-bold text-slate-700">
                        <Users className="w-3 h-3 text-slate-400" />
                        {booking.numberOfPeople}
                      </div>
                    </td>

                    {/* Col 5: Revenue */}
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-slate-900 text-sm tracking-tight">
                        {booking.amount.toLocaleString('vi-VN')} ₫
                      </span>
                    </td>

                    {/* Col 6: Dual Status */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${pStatus.cls}`}>
                          {pStatus.label}
                        </span>
                        <span className={`inline-flex text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${bStatus.cls}`}>
                          {bStatus.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {bookings.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400">
            {bookings.length} giao dịch &nbsp;·&nbsp;{' '}
            TB: <span className="text-slate-700">{Math.round(totalAmount / bookings.length).toLocaleString('vi-VN')} ₫</span>
          </p>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
            <TrendingUp className="w-3 h-3" />
            Tổng: {totalAmount.toLocaleString('vi-VN')} ₫
          </div>
        </div>
      )}
    </div>
  );
}
