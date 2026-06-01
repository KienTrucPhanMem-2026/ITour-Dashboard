'use client';

import React, { useState } from 'react';
import { 
  Drawer, 
  Tag, 
  Tabs, 
  Space, 
  Avatar as AntAvatar, 
  Timeline, 
  Card as AntCard 
} from 'antd';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Activity, 
  Users, 
  CalendarDays,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Booking } from '@/types';

interface BookingDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

// Map styles for Booking status (supports both uppercase and title case)
const bookingStatusMap: Record<string, { label: string; color: string; antColor: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-amber-50 text-amber-700 border-amber-200', antColor: 'warning' },
  Pending: { label: 'Chờ xử lý', color: 'bg-amber-50 text-amber-700 border-amber-200', antColor: 'warning' },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', color: 'bg-orange-50 text-orange-700 border-orange-200', antColor: 'orange' },
  AwaitingPayment: { label: 'Chờ thanh toán', color: 'bg-orange-50 text-orange-700 border-orange-200', antColor: 'orange' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', antColor: 'success' },
  Confirmed: { label: 'Đã xác nhận', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', antColor: 'success' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-blue-50 text-blue-700 border-blue-200', antColor: 'processing' },
  Completed: { label: 'Hoàn thành', color: 'bg-blue-50 text-blue-700 border-blue-200', antColor: 'processing' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-200', antColor: 'error' },
  Cancelled: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-200', antColor: 'error' },
};

// Map styles for Payment status
const paymentStatusMap: Record<string, { label: string; color: string; antColor: string }> = {
  Paid: { label: 'Đã thanh toán', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', antColor: 'success' },
  PAID: { label: 'Đã thanh toán', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', antColor: 'success' },
  Unpaid: { label: 'Chưa thanh toán', color: 'bg-amber-50 text-amber-700 border-amber-200', antColor: 'warning' },
  UNPAID: { label: 'Chưa thanh toán', color: 'bg-amber-50 text-amber-700 border-amber-200', antColor: 'warning' },
  Refunded: { label: 'Hoàn tiền', color: 'bg-slate-100 text-slate-700 border-slate-200', antColor: 'default' },
  REFUNDED: { label: 'Hoàn tiền', color: 'bg-slate-100 text-slate-700 border-slate-200', antColor: 'default' },
};

// Helper to get initials
function getInitials(name?: string) {
  if (!name) return 'KH';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export function BookingDetailDrawer({ isOpen, onClose, booking }: BookingDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState('info');

  if (!booking) return null;

  const bStatus = bookingStatusMap[booking.status] || { label: booking.status, color: 'bg-slate-50 text-slate-600 border-slate-200', antColor: 'default' };
  const pStatus = paymentStatusMap[booking.paymentStatus || 'Unpaid'] || { label: booking.paymentStatus || 'Unpaid', color: 'bg-slate-50 text-slate-600 border-slate-200', antColor: 'default' };

  // Simulated Audit Log based on Booking attributes
  const generateAuditLogs = (b: Booking) => {
    const logs = [];
    const dateFormatted = b.bookingDate ? new Date(b.bookingDate) : new Date();
    
    logs.push({
      time: dateFormatted.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + dateFormatted.toLocaleDateString('vi-VN'),
      title: 'Đơn đặt chỗ được tạo thành công',
      description: `Khách hàng ${b.userName} tự đặt tour từ Website hoặc do nhân viên hỗ trợ nhập dữ liệu.`,
      color: 'blue'
    });

    if (b.paymentStatus === 'Paid' || b.paymentStatus === 'PAID') {
      const payTime = b.paymentDate ? new Date(b.paymentDate) : new Date(dateFormatted.getTime() + 15 * 60 * 1000);
      logs.push({
        time: payTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + payTime.toLocaleDateString('vi-VN'),
        title: 'Thanh toán thành công',
        description: `Hệ thống ghi nhận tiền chuyển khoản/Ví điện tử qua cổng thanh toán Momo hoặc xác nhận trực tiếp (Phương thức: ${b.paymentMethod || 'CASH'}).`,
        color: 'green'
      });
    }

    if (b.status === 'Confirmed' || (b.status as string) === 'CONFIRMED') {
      logs.push({
        time: new Date(dateFormatted.getTime() + 20 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(dateFormatted.getTime() + 20 * 60 * 1000).toLocaleDateString('vi-VN'),
        title: 'Xác nhận trạng thái Confirmed',
        description: 'Tài nguyên (chỗ trống trên xe, phòng khách sạn, vé vào cổng) đã được giữ thành công cho lịch khởi hành này.',
        color: 'green'
      });
    }

    if (b.status === 'Cancelled' || (b.status as string) === 'CANCELLED') {
      logs.push({
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
        title: 'Hủy đơn đặt chỗ',
        description: 'Hủy dịch vụ và giải phóng tài nguyên. Trạng thái chuyển đổi sang CANCELLED.',
        color: 'red'
      });
    }

    return logs;
  };

  const auditLogs = generateAuditLogs(booking);

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      width={680}
      closable={false}
      maskClosable={true}
      styles={{
        body: { padding: '24px', backgroundColor: '#f8fafc', overflowY: 'auto' },
        footer: { borderTop: '1px solid #f1f5f9', padding: '16px 24px', backgroundColor: '#ffffff', position: 'sticky', bottom: 0, zIndex: 10 }
      }}
      maskStyle={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
      title={
        <div className="flex items-center justify-between w-full py-2">
          <div className="flex items-center gap-4">
            <AntAvatar className="size-12 rounded-full border-2 border-white shadow-md bg-emerald-500 text-white font-extrabold flex items-center justify-center shrink-0">
              {getInitials(booking.userName)}
            </AntAvatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-slate-900 leading-tight">Mã đơn: #BKG-{booking.id.padStart(4, '0')}</h3>
                <Space size={4}>
                  <Tag color={bStatus.antColor} className="text-[10px] font-black uppercase border-0 px-2 py-0.5 rounded">
                    {bStatus.label}
                  </Tag>
                  <Tag color={pStatus.antColor} className="text-[10px] font-black uppercase border-0 px-2 py-0.5 rounded">
                    {pStatus.label}
                  </Tag>
                </Space>
              </div>
              <p className="text-xs text-slate-400 mt-1">Ngày đặt: {new Date(booking.bookingDate).toLocaleString('vi-VN')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-xl border border-slate-150 hover:bg-slate-50 transition-all shrink-0 w-9 h-9 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      }
      footer={
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-slate-200 font-bold px-5 active:scale-95 transition-all text-slate-600 h-9"
          >
            Đóng lại
          </Button>
        </div>
      }
    >
      {/* Dynamic Tabs */}
      <div className="bg-white rounded-2xl px-5 border border-slate-100 shadow-sm mb-6">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="booking-detail-tabs"
          items={[
            {
              key: 'info',
              label: (
                <span className="flex items-center gap-2 font-black text-xs uppercase tracking-wider py-1.5 select-none">
                  <User className="w-4 h-4" />
                  Thông tin khách hàng & Tour
                </span>
              )
            },
            {
              key: 'requests',
              label: (
                <span className="flex items-center gap-2 font-black text-xs uppercase tracking-wider py-1.5 select-none">
                  <FileText className="w-4 h-4" />
                  Yêu cầu & Tài chính
                </span>
              )
            },
            {
              key: 'logs',
              label: (
                <span className="flex items-center gap-2 font-black text-xs uppercase tracking-wider py-1.5 select-none">
                  <Activity className="w-4 h-4" />
                  Lịch sử thanh toán
                </span>
              )
            }
          ]}
        />
      </div>

      <div className="space-y-4">
        {activeTab === 'info' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Customer Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Thông Tin Khách Liên Hệ</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tên khách hàng</span>
                  <p className="font-bold text-slate-800 text-sm mt-1 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                    {booking.userName || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Số điện thoại</span>
                  <p className="font-semibold text-slate-800 text-sm mt-1 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 inline-flex items-center gap-1.5 w-full">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{booking.userPhone || 'N/A'}</span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Địa chỉ Email</span>
                  <p className="font-semibold text-slate-800 text-sm mt-1 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 inline-flex items-center gap-1.5 w-full">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{booking.userEmail || 'N/A'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Tour & Schedule Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Chi Tiết Lịch Trình Chuyến Đi</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tên Tour Sản Phẩm</span>
                  <p className="font-bold text-slate-900 text-sm mt-1 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                    {booking.tourName || 'N/A'}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Ngày Khởi Hành</span>
                    <p className="font-bold text-slate-800 text-xs mt-1 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 inline-flex items-center gap-1.5 w-full">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      {booking.startDate ? new Date(booking.startDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Điểm đến địa bàn</span>
                    <p className="font-bold text-slate-800 text-xs mt-1 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 inline-flex items-center gap-1.5 w-full">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {booking.destination || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Details */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Số Lượng Hành Khách</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Người lớn</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{booking.adults || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Trẻ em</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{booking.children || 0}</p>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Tổng cộng</span>
                  <p className="text-xl font-black text-emerald-700 mt-1">{booking.quantity || booking.numberOfPeople || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Financial Details */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Thông Tin Tài Chính & Thanh Toán</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm py-1.5">
                  <span className="text-slate-400 font-semibold">Đơn giá cơ bản (1 khách)</span>
                  <span className="font-bold text-slate-800">
                    {booking.unitPrice ? booking.unitPrice.toLocaleString('vi-VN') + ' ₫' : '0 ₫'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm py-1.5">
                  <span className="text-slate-400 font-semibold">Tổng cộng ban đầu</span>
                  <span className="font-bold text-slate-800">
                    {booking.totalPrice ? booking.totalPrice.toLocaleString('vi-VN') + ' ₫' : '0 ₫'}
                  </span>
                </div>
                {booking.discountAmount ? (
                  <div className="flex justify-between items-center text-sm py-1.5 text-rose-600 bg-rose-50/30 px-3 rounded-lg">
                    <span className="font-semibold">Khuyến mãi / Giảm giá</span>
                    <span className="font-bold">
                      - {booking.discountAmount.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                ) : null}
                
                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-base">
                  <span className="text-slate-900 font-black">Giá cuối cùng (Thành tiền)</span>
                  <span className="font-black text-emerald-600 text-lg tracking-tight">
                    {(booking.finalPrice || booking.totalPrice)?.toLocaleString('vi-VN') + ' ₫'}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Details */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Hình Thức & Trạng Thái Giao Dịch</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Phương thức thanh toán</span>
                  <p className="font-bold text-slate-800 text-sm mt-1 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 uppercase">
                    {booking.paymentMethod === 'CREDIT_CARD' ? 'Thẻ tín dụng' :
                     booking.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' :
                     booking.paymentMethod === 'E_WALLET' ? 'Ví điện tử' :
                     booking.paymentMethod || 'Tiền mặt'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Trạng thái xác nhận tiền</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black uppercase border border-transparent ${pStatus.color}`}>
                      {pStatus.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Request */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Yêu cầu đặc biệt của khách hàng</h4>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 text-slate-600 text-xs leading-relaxed italic">
                {booking.specialRequests || 'Không có ghi chú hoặc yêu cầu đặc biệt nào từ khách hàng.'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Nhật Ký Hành Trình Hóa Đơn (Audit Trail)</h4>
              </div>

              <div className="px-2 pt-2">
                <Timeline
                  items={auditLogs.map((log, idx) => ({
                    key: idx,
                    color: log.color,
                    children: (
                      <div className="text-xs space-y-1 pl-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-sm leading-none">{log.title}</span>
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded leading-none">
                            {log.time}
                          </span>
                        </div>
                        <p className="text-slate-500 leading-relaxed pt-0.5">{log.description}</p>
                      </div>
                    )
                  }))}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
