'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Input, DatePicker, Card, Tag, Drawer, Button, Select, Space, Tooltip, Progress, message, Avatar, Empty, Popconfirm } from 'antd';
import { SearchOutlined, CalendarOutlined, PhoneOutlined, MailOutlined, PlusOutlined, CloseOutlined, CheckCircleOutlined, UserOutlined, ClockCircleOutlined, CarOutlined } from '@ant-design/icons';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { apiClient } from '@/lib/api-client';
import dayjs from 'dayjs';

interface BookingReviewData {
  bookingId: string;
  customerId: string;
  customerName: string;
  tourId: string;
  tourName: string;
  tourImage?: string;
  tourScheduleId: string;
  adults: number;
  children: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  paymentMethod: string;
  status: 'PENDING' | 'AWAITING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';
  paymentStatus: string;
  bookingDate: string;
  expireAt: string;
  paymentUrl?: string | null;
  note?: string;
  departureDate?: string;
  startDate?: string;
  endDate?: string;
  tourGuideId?: string;
  tourGuideName?: string;
  tourGuidePhone?: string;
  licensePlate?: string;
  startDestinationId?: string;
}

interface TourGuideOption {
  id: string;
  fullName: string;
  phone: string;
  email: string;
}

interface VehicleOption {
  id: string;
  type: string;
  seatCount: number;
  description?: string;
  transportCompany?: {
    id: string;
    name: string;
    location?: {
      id: string;
      name?: string;
    } | null;
  } | null;
}

const formatVehicleLabel = (v: any) => {
  let typeLabel = 'Xe';
  if (v.seatCount === 9) {
    return 'Limousine 9 chỗ';
  } else if (v.seatCount === 16) {
    return 'Xe 16 chỗ';
  } else if (v.seatCount === 29) {
    return 'Xe 29 chỗ';
  } else if (v.seatCount === 35) {
    return 'Xe 35 chỗ';
  } else if (v.seatCount === 45) {
    return 'Xe 45 chỗ';
  }

  const typeLower = (v.type || '').toLowerCase();
  if (typeLower.includes('limousine')) {
    typeLabel = 'Limousine';
  } else if (typeLower.includes('bus') || typeLower.includes('khách')) {
    typeLabel = 'Xe khách';
  } else if (typeLower.includes('car') || typeLower.includes('con') || typeLower.includes('ô tô')) {
    typeLabel = 'Xe ô tô';
  } else if (typeLower.includes('minivan') || typeLower.includes('du lịch')) {
    typeLabel = 'Xe du lịch';
  } else {
    typeLabel = v.type || 'Xe';
  }
  return `${typeLabel} ${v.seatCount} chỗ`;
};

export default function TourPlannerBookingsPage() {
  const [bookings, setBookings] = useState<BookingReviewData[]>([]);
  const [tourGuides, setTourGuides] = useState<TourGuideOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Drawer review state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingReviewData | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<string>('none');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('none');
  const [adjustedPrice, setAdjustedPrice] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch bookings
      const bookingsRes = await apiClient.get<any[]>('/bookings');
      if (bookingsRes.success && Array.isArray(bookingsRes.data)) {
        const mapped: BookingReviewData[] = bookingsRes.data.map((b: any) => ({
          ...b,
          bookingId: b.bookingId || b.id || '',
          customerName: b.customerName || b.customer?.fullName || 'Khách hàng',
          tourName: b.tourName || b.tour?.name || 'Tour riêng',
          startDestinationId: b.startDestinationId || b.tour?.startDestination?.id || '',
        }));

        // Filter: only show PENDING and AWAITING_PAYMENT private bookings
        const filtered = mapped.filter(
          (b) => b.status === 'PENDING' || b.status === 'AWAITING_PAYMENT'
        );
        setBookings(filtered);
      }

      // 2. Fetch all tour guides
      const guidesRes = await apiClient.get<TourGuideOption[]>('/tour-guides');
      if (guidesRes.success && Array.isArray(guidesRes.data)) {
        setTourGuides(guidesRes.data);
      }

      // 3. Fetch all vehicles
      const vehiclesRes = await apiClient.get<VehicleOption[]>('/vehicles');
      if (vehiclesRes.success && Array.isArray(vehiclesRes.data)) {
        setVehicles(vehiclesRes.data);
      }
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi tải dữ liệu từ máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered Bookings for Kanban Board
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        !searchQuery.trim() ||
        b.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tourName.toLowerCase().includes(searchQuery.toLowerCase());

      let matchDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const start = dateRange[0].startOf('day');
        const end = dateRange[1].endOf('day');
        const depDate = b.departureDate ? dayjs(b.departureDate) : null;
        if (depDate) {
          matchDate = depDate.isAfter(start) && depDate.isBefore(end);
        } else {
          matchDate = false;
        }
      }

      return matchSearch && matchDate;
    });
  }, [bookings, searchQuery, dateRange]);

  const pendingBookings = useMemo(() => {
    return filteredBookings.filter((b) => b.status === 'PENDING');
  }, [filteredBookings]);

  const awaitingPaymentBookings = useMemo(() => {
    return filteredBookings.filter((b) => b.status === 'AWAITING_PAYMENT');
  }, [filteredBookings]);

  // Group vehicles by transport company and filter by booking start destination
  const groupedVehicleOptions = useMemo(() => {
    const filtered = selectedBooking && selectedBooking.startDestinationId
      ? vehicles.filter((v) => v.transportCompany?.location?.id === selectedBooking.startDestinationId)
      : vehicles;

    const groups: Record<string, VehicleOption[]> = {};
    filtered.forEach((v) => {
      const companyName = v.transportCompany?.name || 'Nhà xe chưa xác định';
      if (!groups[companyName]) {
        groups[companyName] = [];
      }
      groups[companyName].push(v);
    });

    return groups;
  }, [vehicles, selectedBooking]);

  // Open action drawer for review
  const handleOpenReview = (booking: BookingReviewData) => {
    setSelectedBooking(booking);
    setSelectedGuideId(booking.tourGuideId || 'none');
    // Map license plate or fetch original vehicle id from booking schedule
    setSelectedVehicleId('none');

    // Find matching vehicle by matching properties or default if not explicit
    if (booking.licensePlate) {
      // Find matching vehicle
      const hashMatch = vehicles.find((v) => {
        let hash = 0;
        for (let i = 0; i < v.id.length; i++) {
          hash = v.id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const val1 = Math.abs(hash % 900) + 100;
        const val2 = Math.abs(hash % 90) + 10;
        const plate = `51B-${val1}.${val2}`;
        return plate === booking.licensePlate;
      });
      if (hashMatch) {
        setSelectedVehicleId(hashMatch.id);
      }
    }

    setAdjustedPrice(booking.finalPrice);
    setIsDrawerOpen(true);
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, bookingId: string) => {
    e.dataTransfer.setData('bookingId', bookingId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: 'PENDING' | 'AWAITING_PAYMENT' | 'CANCELLED') => {
    e.preventDefault();
    const bookingId = e.dataTransfer.getData('bookingId');
    const booking = bookings.find((b) => b.bookingId === bookingId);
    if (!booking) return;

    if (booking.status === targetStatus) return;

    if (targetStatus === 'AWAITING_PAYMENT') {
      // Prompt user to complete allocations in drawer
      handleOpenReview(booking);
      message.info('Vui lòng gán tài nguyên trước khi duyệt sang cột Chờ thanh toán!');
    } else if (targetStatus === 'CANCELLED') {
      // Direct Cancel with confirm
      try {
        const res = await apiClient.put(`/bookings/${bookingId}/review`, {
          status: 'CANCELLED',
        });
        if (res.success) {
          message.success(`Đã hủy đặt tour #${bookingId} thành công!`);
          fetchAllData();
        } else {
          message.error(`Không thể hủy: ${res.message}`);
        }
      } catch (err) {
        console.error(err);
        message.error('Lỗi khi cập nhật trạng thái');
      }
    } else if (targetStatus === 'PENDING') {
      // Revert back to pending
      try {
        const res = await apiClient.put(`/bookings/${bookingId}/review`, {
          status: 'PENDING',
        });
        if (res.success) {
          message.success(`Đã hoàn lại trạng thái Mới yêu cầu cho #${bookingId}!`);
          fetchAllData();
        } else {
          message.error(`Không thể cập nhật: ${res.message}`);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleApprove = async () => {
    if (!selectedBooking) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/bookings/${selectedBooking.bookingId}/review`, {
        tourGuideId: selectedGuideId === 'none' ? null : selectedGuideId,
        vehicleId: selectedVehicleId === 'none' ? null : selectedVehicleId,
        finalPrice: adjustedPrice,
        status: 'AWAITING_PAYMENT',
      });

      if (res.success) {
        message.success('Đã phê duyệt và phát hành link thanh toán!');
        setIsDrawerOpen(false);
        fetchAllData();
      } else {
        message.error(`Duyệt thất bại: ${res.message}`);
      }
    } catch (err) {
      console.error(err);
      message.error('Lỗi kết nối khi gửi yêu cầu duyệt');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await apiClient.put(`/bookings/${bookingId}/review`, {
        status: 'CANCELLED',
      });
      if (res.success) {
        message.success('Đã từ chối và hủy yêu cầu thành công!');
        setIsDrawerOpen(false);
        fetchAllData();
      } else {
        message.error(res.message || 'Lỗi khi từ chối yêu cầu');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedBooking) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/bookings/${selectedBooking.bookingId}/review`, {
        tourGuideId: selectedGuideId === 'none' ? null : selectedGuideId,
        vehicleId: selectedVehicleId === 'none' ? null : selectedVehicleId,
        finalPrice: adjustedPrice,
        status: selectedBooking.status, // Keep current status
      });

      if (res.success) {
        message.success('Đã lưu nháp phân phối tài nguyên thành công!');
        setIsDrawerOpen(false);
        fetchAllData();
      } else {
        message.error(`Lưu thất bại: ${res.message}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Helper to render remaining time warning
  const renderRemainingTime = (expireAt: string) => {
    const now = dayjs();
    const exp = dayjs(expireAt);
    const diffHours = exp.diff(now, 'hour');
    const diffMinutes = exp.diff(now, 'minute') % 60;

    if (diffHours < 0) {
      return { label: 'Đã quá hạn', percent: 100, color: 'bg-rose-500', isExpired: true };
    }

    const totalHours = 24; // Standard 24h deadline
    const remainingPercent = Math.max(0, Math.min(100, (diffHours / totalHours) * 100));

    if (diffHours <= 3) {
      return {
        label: `Khẩn cấp: ${diffHours}h ${diffMinutes}m`,
        percent: remainingPercent,
        color: 'bg-rose-600 animate-pulse',
        isExpired: false,
        tagColor: 'red',
      };
    }

    return {
      label: `Còn lại: ${diffHours}h ${diffMinutes}m`,
      percent: remainingPercent,
      color: 'bg-amber-500',
      isExpired: false,
      tagColor: 'orange',
    };
  };

  // Helper to calculate days until departure
  const renderDaysUntilDeparture = (depDateStr?: string) => {
    if (!depDateStr) return null;
    const now = dayjs().startOf('day');
    const dep = dayjs(depDateStr).startOf('day');
    const days = dep.diff(now, 'day');

    if (days < 0) {
      return <Tag color="default">Đã khởi hành</Tag>;
    } else if (days <= 3) {
      return <Tag color="red" className="animate-bounce">Khởi hành sau {days} ngày</Tag>;
    } else if (days <= 7) {
      return <Tag color="orange">Khởi hành sau {days} ngày</Tag>;
    }
    return <Tag color="green">Khởi hành sau {days} ngày</Tag>;
  };

  return (
    <DashboardLayout>
      {/* Header Control Panel */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Điều Hành Tour Private
            <span className="text-sm font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
              {pendingBookings.length} Yêu cầu mới
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Quản trị tiến trình điều phối hướng dẫn viên, đầu xe và giá phụ thu cho các đơn đặt Tour riêng từ khách hàng.
          </p>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <Input
            placeholder="Tìm mã đơn, tên khách..."
            prefix={<SearchOutlined className="text-slate-400 mr-1.5" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 border-slate-300 rounded-lg text-xs w-60"
            allowClear
          />
          <DatePicker.RangePicker
            placeholder={['Từ ngày đi', 'Đến ngày đi']}
            value={dateRange}
            onChange={(dates: any) => setDateRange(dates)}
            className="h-10 border-slate-300 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Column 1: PENDING */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'PENDING')}
          className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/80">
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Mới Yêu Cầu (PENDING)
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
              {pendingBookings.length}
            </span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[700px] pr-1">
            {pendingBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-300 rounded-xl bg-white/50">
                <Empty description="Không có yêu cầu chờ xử lý" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ) : (
              pendingBookings.map((b) => (
                <div
                  key={b.bookingId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, b.bookingId)}
                  onClick={() => handleOpenReview(b)}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                  style={{
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04), inset 0 2px 4px 0 rgba(255, 255, 255, 0.90)',
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono font-extrabold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      #{b.bookingId}
                    </span>
                    {renderDaysUntilDeparture(b.departureDate)}
                  </div>

                  <h4 className="font-extrabold text-slate-800 text-sm mb-1 leading-snug line-clamp-2">
                    {b.tourName}
                  </h4>

                  <div className="space-y-1.5 text-xs text-slate-500 mb-3 border-t border-slate-100 pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Khách hàng:</span>
                      <span className="font-bold text-slate-700">
                        {b.customerName} • {b.adults} Lớn, {b.children} Trẻ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ngày xuất phát:</span>
                      <span className="font-bold text-slate-700 inline-flex items-center gap-1">
                        <CalendarOutlined className="text-slate-400" />
                        {b.departureDate ? dayjs(b.departureDate).format('DD/MM/YYYY') : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1.5">
                      <CarOutlined className="text-slate-400 text-xs" />
                      <span className="text-[10px] text-slate-500">Xe: {b.licensePlate || 'Chưa gán'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">HDV:</span>
                      {b.tourGuideName ? (
                        <Tooltip title={`HDV: ${b.tourGuideName}`}>
                          <Avatar size={20} className="bg-emerald-500 text-[10px] font-bold">
                            {b.tourGuideName.charAt(0).toUpperCase()}
                          </Avatar>
                        </Tooltip>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-500 border border-dashed border-rose-300 rounded px-1.5 bg-rose-50/50">
                          [ + ]
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: AWAITING_PAYMENT */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'AWAITING_PAYMENT')}
          className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/80">
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Chờ Thanh Toán (AWAITING_PAYMENT)
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
              {awaitingPaymentBookings.length}
            </span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[700px] pr-1">
            {awaitingPaymentBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-300 rounded-xl bg-white/50">
                <Empty description="Không có đơn chờ thanh toán" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            ) : (
              awaitingPaymentBookings.map((b) => {
                const timer = renderRemainingTime(b.expireAt);
                return (
                  <div
                    key={b.bookingId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, b.bookingId)}
                    onClick={() => handleOpenReview(b)}
                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                    style={{
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04), inset 0 2px 4px 0 rgba(255, 255, 255, 0.90)',
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono font-extrabold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        #{b.bookingId}
                      </span>
                      {renderDaysUntilDeparture(b.departureDate)}
                    </div>

                    <h4 className="font-extrabold text-slate-800 text-sm mb-1 leading-snug line-clamp-2">
                      {b.tourName}
                    </h4>

                    <div className="space-y-1.5 text-xs text-slate-500 mb-3 border-t border-slate-100 pt-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Khách hàng:</span>
                        <span className="font-bold text-slate-700">{b.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tổng thu chốt:</span>
                        <span className="font-bold text-emerald-600">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.finalPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar đếm ngược 24h */}
                    <div className="mb-3.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 mb-1">
                        <span className="flex items-center gap-1">
                          <ClockCircleOutlined className="text-slate-400" />
                          Hạn thanh toán
                        </span>
                        <span className={timer.isExpired ? 'text-rose-500' : 'text-slate-600'}>
                          {timer.label}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${timer.color}`}
                          style={{ width: `${timer.percent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-1.5">
                        <CarOutlined className="text-slate-400 text-xs" />
                        <span className="text-[10px] text-slate-500">Xe: {b.licensePlate || 'Chưa gán'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">HDV:</span>
                        {b.tourGuideName ? (
                          <Tooltip title={`HDV: ${b.tourGuideName}`}>
                            <Avatar size={20} className="bg-emerald-500 text-[10px] font-bold">
                              {b.tourGuideName.charAt(0).toUpperCase()}
                            </Avatar>
                          </Tooltip>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-500">Chưa gán</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: DRAG TO CANCEL */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'CANCELLED')}
          className="bg-rose-50/40 p-4 rounded-2xl border border-dashed border-rose-300 min-h-[500px] flex flex-col items-center justify-center transition-all duration-200 group hover:bg-rose-50"
        >
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto text-rose-600 text-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm border border-rose-200">
              <CloseOutlined />
            </div>
            <div>
              <h3 className="font-extrabold text-rose-800 text-base">Từ Chối / Hủy Đơn</h3>
              <p className="text-xs text-rose-600/80 max-w-[200px] mx-auto mt-1">
                Kéo thả thẻ vào đây để từ chối hoặc hủy đơn nhanh giải phóng xe & hướng dẫn viên.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <span className="font-mono font-extrabold bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-sm">
              #{selectedBooking?.bookingId}
            </span>
            <span className="text-slate-800 font-bold">Phân phối điều hành Tour</span>
          </div>
        }
        width={600}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        bodyStyle={{
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
        }}
        footer={
          <div className="flex justify-between items-center py-3 px-4 bg-slate-50 border-t border-slate-200">
            <Popconfirm
              title="Bạn có chắc chắn muốn hủy yêu cầu đặt tour này?"
              onConfirm={() => selectedBooking && handleCancelBooking(selectedBooking.bookingId)}
              okText="Đồng ý hủy"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button danger className="rounded-lg h-10 font-bold">
                Từ chối / Hủy
              </Button>
            </Popconfirm>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveDraft}
                disabled={saving}
                className="rounded-lg h-10 font-semibold"
              >
                Lưu nháp phân phối
              </Button>
              <Button
                type="primary"
                onClick={handleApprove}
                loading={saving}
                icon={<CheckCircleOutlined />}
                className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600 rounded-lg h-10 font-bold text-white shadow-sm flex items-center gap-1 px-5"
              >
                Duyệt & Bắn Link Thanh Toán
              </Button>
            </div>
          </div>
        }
        footerStyle={{ padding: 0 }}
      >
        {selectedBooking && (
          <div className="space-y-6">
            {/* Section 1: Customer Info */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                Thông tin Khách hàng & Yêu cầu
              </h3>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400 text-xs block">Khách hàng đại diện</span>
                  <span className="font-extrabold text-slate-800">{selectedBooking.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Số lượng thành viên</span>
                  <span className="font-bold text-slate-700">
                    {selectedBooking.adults} Người lớn, {selectedBooking.children} Trẻ em
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Mã Tour đặt</span>
                  <span className="font-bold text-slate-700">{selectedBooking.tourId}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block">Ngày khởi hành</span>
                  <span className="font-bold text-slate-700 inline-flex items-center gap-1.5">
                    <CalendarOutlined className="text-emerald-500" />
                    {selectedBooking.departureDate ? dayjs(selectedBooking.departureDate).format('DD/MM/YYYY') : '—'}
                  </span>
                </div>
              </div>

              {/* Call Control */}
              <div className="flex gap-2 pt-2">
                <Button
                  icon={<PhoneOutlined />}
                  onClick={() => window.open(`tel:${selectedBooking.tourGuidePhone || '1900'}`)}
                  className="flex-1 rounded-lg border-emerald-200 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50/50"
                >
                  Gọi điện cho khách
                </Button>
                <Button
                  icon={<MailOutlined />}
                  type="text"
                  className="rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600"
                >
                  Gửi Mail chốt lại
                </Button>
              </div>

              {/* Special Notes */}
              <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-100 text-xs text-amber-800 mt-2">
                <span className="font-bold block mb-1">📌 Ghi chú yêu cầu đặc biệt từ khách hàng:</span>
                <p className="italic leading-relaxed">{selectedBooking.note || 'Không có yêu cầu đặc biệt nào ghi nhận.'}</p>
              </div>
            </div>

            {/* Section 2: Resource Allocation */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                Điều phối Tài nguyên & Phụ thu
              </h3>

              {/* Chọn Hướng dẫn viên */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Chọn Hướng dẫn viên (Guide)</label>
                <Select
                  value={selectedGuideId}
                  onChange={(val) => setSelectedGuideId(val)}
                  className="w-full h-10 text-sm"
                  dropdownStyle={{ borderRadius: '8px' }}
                >
                  <Select.Option value="none">— Chưa gán (Bỏ trống) —</Select.Option>
                  {tourGuides.map((g) => (
                    <Select.Option key={g.id} value={g.id}>
                      {g.fullName} ({g.phone})
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* Chọn Xe */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Chọn Xe phục vụ (Vehicle)</label>
                <Select
                  value={selectedVehicleId}
                  onChange={(val) => setSelectedVehicleId(val)}
                  className="w-full h-10 text-sm"
                  dropdownStyle={{ borderRadius: '8px' }}
                >
                  <Select.Option value="none">— Chưa gán (Bỏ trống) —</Select.Option>
                  {Object.keys(groupedVehicleOptions).length === 0 ? (
                    <Select.Option value="none" disabled>— Không tìm thấy xe đối tác tại Điểm khởi hành của Tour —</Select.Option>
                  ) : (
                    Object.entries(groupedVehicleOptions).map(([companyName, list]) => (
                      <Select.OptGroup key={companyName} label={companyName}>
                        {list.map((v) => (
                          <Select.Option key={v.id} value={v.id}>
                            {formatVehicleLabel(v)}
                          </Select.Option>
                        ))}
                      </Select.OptGroup>
                    ))
                  )}
                </Select>
              </div>

              {/* Điều chỉnh Giá */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Tổng tiền chốt cuối cùng (đã gồm phụ thu)</label>
                <Input
                  type="number"
                  value={adjustedPrice}
                  onChange={(e) => setAdjustedPrice(parseFloat(e.target.value) || 0)}
                  className="h-10 border-slate-300 rounded-lg text-sm font-bold text-emerald-600 font-mono"
                  prefix={<span className="text-slate-400 text-xs font-bold mr-1">VNĐ</span>}
                />
                <p className="text-[10px] text-slate-400">
                  Giá gốc: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBooking.finalPrice)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </DashboardLayout>
  );
}
