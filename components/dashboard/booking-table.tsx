'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, MapPin, Calendar } from 'lucide-react';
import { Booking } from '@/types';

interface BookingTableProps {
  bookings: Booking[];
  onStatusChange?: (bookingId: string, status: any) => void;
  onEdit?: (booking: Booking) => void;
  onViewDetail?: (booking: Booking) => void;
  isLoading?: boolean;
}

// Map styles for Booking status (supports both uppercase and title case)
const bookingStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  Pending: { label: 'Chờ xử lý', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  AwaitingPayment: { label: 'Chờ thanh toán', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Confirmed: { label: 'Đã xác nhận', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  Completed: { label: 'Hoàn thành', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  Cancelled: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

function StatusBadge({ status }: { status: Booking['status'] }) {
  const info = bookingStatusMap[status] || { label: status, color: 'bg-slate-50 text-slate-700 border-slate-200' };
  return (
    <Badge variant="outline" className={`${info.color} border font-semibold rounded-lg text-[10px] px-2 py-0.5 uppercase`}>
      {info.label}
    </Badge>
  );
}

// Map styles for Payment status
const paymentStatusMap: Record<string, { label: string; color: string }> = {
  Paid: { label: 'Đã thanh toán', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PAID: { label: 'Đã thanh toán', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Unpaid: { label: 'Chưa thanh toán', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  UNPAID: { label: 'Chưa thanh toán', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  Refunded: { label: 'Hoàn tiền', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  REFUNDED: { label: 'Hoàn tiền', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

function PaymentStatusBadge({ status }: { status?: string }) {
  const displayStatus = status || 'Unpaid';
  const info = paymentStatusMap[displayStatus] || { label: displayStatus, color: 'bg-slate-50 text-slate-700 border-slate-200' };
  return (
    <Badge variant="outline" className={`${info.color} border text-[10px] font-semibold rounded-lg px-2 py-0.5 uppercase`}>
      {info.label}
    </Badge>
  );
}

export function BookingTable({ bookings, onStatusChange, onEdit, onViewDetail, isLoading }: BookingTableProps) {
  return (
    <Card className="rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/70 overflow-hidden bg-white">
      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center bg-slate-50/50">
            <p className="text-slate-500 font-medium animate-pulse">Đang tải đặt tour...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50">
            <p className="text-slate-400 font-medium">Không tìm thấy đặt tour nào</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600">
                <th className="px-6 py-4.5 text-left text-xs font-black uppercase tracking-wider">Mã & Khách hàng</th>
                <th className="px-6 py-4.5 text-left text-xs font-black uppercase tracking-wider">Tour & Lịch trình</th>
                <th className="px-6 py-4.5 text-left text-xs font-black uppercase tracking-wider">Hành khách</th>
                <th className="px-6 py-4.5 text-right text-xs font-black uppercase tracking-wider pr-8">Tổng tiền</th>
                <th className="px-6 py-4.5 text-left text-xs font-black uppercase tracking-wider">Trạng thái Kép</th>
                <th className="px-6 py-4.5 text-center text-xs font-black uppercase tracking-wider w-[80px]">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((booking) => {
                const bookingCode = `#BKG-${booking.id.padStart(4, '0')}`;
                return (
                  <tr key={booking.id} className="hover:bg-slate-50/50 transition-all group">
                    {/* Column 1: Mã & Khách hàng */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-900 text-sm tracking-tight block">
                          {bookingCode}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-tight">{booking.userName || 'N/A'}</p>
                          <div className="text-[10px] text-slate-400 font-bold mt-1 space-y-0.5">
                            {booking.userPhone && booking.userPhone !== 'N/A' && (
                              <span className="inline-block text-slate-600 font-extrabold bg-slate-100/60 px-1.5 py-0.5 rounded mr-1">
                                📞 {booking.userPhone}
                              </span>
                            )}
                            <span className="block text-slate-400 font-medium">{booking.userEmail || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Tour & Lịch trình */}
                    <td className="px-6 py-4">
                      <div className="space-y-1.5 max-w-[240px]">
                        <p className="font-bold text-slate-800 text-sm leading-snug line-clamp-1 group-hover:text-emerald-600 transition-colors" title={booking.tourName}>
                          {booking.tourName || 'N/A'}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>KH: {booking.startDate ? new Date(booking.startDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Column 3: Số lượng khách */}
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-slate-700">
                        <span>{booking.adults || 0} Người lớn</span>
                        {booking.children ? (
                          <span className="text-slate-400">, {booking.children} Trẻ em</span>
                        ) : (
                          <span className="text-slate-400">, 0 Trẻ em</span>
                        )}
                      </div>
                    </td>

                    {/* Column 4: Tổng tiền (Tài chính) */}
                    <td className="px-6 py-4 text-right pr-8">
                      <span className="font-black text-slate-900 text-sm tracking-tight">
                        {((booking.finalPrice || booking.totalPrice) || 0).toLocaleString('vi-VN') + ' ₫'}
                      </span>
                    </td>

                    {/* Column 5: Trạng thái Kép */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col xs:flex-row gap-1 items-start">
                        <PaymentStatusBadge status={booking.paymentStatus} />
                        <StatusBadge status={booking.status} />
                      </div>
                    </td>

                    {/* Column 6: Hành động */}
                    <td className="px-6 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-100 active:scale-95 transition-all">
                            <MoreHorizontal className="w-4 h-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl p-1.5 shadow-lg border border-slate-100 min-w-[150px]">
                          <DropdownMenuItem 
                            onClick={() => onViewDetail?.(booking)}
                            className="rounded-lg font-semibold text-xs py-1.5 cursor-pointer"
                          >
                            Xem Chi Tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onEdit?.(booking)}
                            className="rounded-lg font-semibold text-xs py-1.5 cursor-pointer"
                          >
                            Chỉnh Sửa
                          </DropdownMenuItem>
                          {booking.status === 'Pending' && onStatusChange && (
                            <DropdownMenuItem 
                              onClick={() => onStatusChange(booking.id, 'Confirmed')}
                              className="rounded-lg font-semibold text-xs py-1.5 cursor-pointer text-emerald-600 hover:text-emerald-700"
                            >
                              Xác nhận Booking
                            </DropdownMenuItem>
                          )}
                          {booking.status !== 'Cancelled' && booking.status !== 'Completed' && onStatusChange && (
                            <DropdownMenuItem 
                              onClick={() => onStatusChange(booking.id, 'Cancelled')} 
                              className="rounded-lg font-semibold text-xs py-1.5 cursor-pointer text-rose-600 hover:text-rose-700"
                            >
                              Hủy Booking
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        <div className="px-6 py-4.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <p className="text-xs font-bold text-slate-400 select-none">Hiển thị {bookings.length} giao dịch đặt tour</p>
        </div>
      )}
    </Card>
  );
}
