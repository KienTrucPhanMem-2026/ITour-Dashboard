'use client';

import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  Tabs, 
  Tag, 
  Space, 
  Collapse, 
  Card as AntCard, 
  Rate, 
  Grid
} from 'antd';
import { 
  Info, 
  MapPin, 
  Compass, 
  Image as ImageIcon, 
  DollarSign, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Clock, 
  Users, 
  Utensils, 
  Star,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tour } from '@/types';

interface TourViewerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour | null;
  initialStep?: number;
}

const { useBreakpoint } = Grid;

export function TourViewerDrawer({ isOpen, onClose, tour, initialStep = 0 }: TourViewerDrawerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const screens = useBreakpoint();

  // Reset step when drawer opens or initialStep changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(initialStep);
    }
  }, [isOpen, tour, initialStep]);

  if (!tour) return null;

  // Calculate simulated schedule and customer count to keep business logic consistent
  const schedulesCount = tour.id ? (Math.abs(tour.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 4) + 2 : 2;
  const totalCustomers = tour.id ? (Math.abs(tour.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 150) + 40 : 40;

  // Generate dynamic initials-based tour code
  const getTourCode = (name: string, id: string) => {
    if (!name) return '#T-HN-TK-01';
    const initials = name
      .split(' ')
      .map(w => w.charAt(0))
      .join('')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    return `#T-${initials.substring(0, 4) || 'TR'}-${id.substring(0, 4).toUpperCase()}`;
  };

  const tourCode = getTourCode(tour.name, tour.id);

  // Tab definitions
  const tabs = [
    { title: 'Thông tin chung', icon: <Info className="w-4 h-4" /> },
    { title: 'Lịch trình chi tiết', icon: <Compass className="w-4 h-4" /> },
    { title: 'Thư viện ảnh', icon: <ImageIcon className="w-4 h-4" /> },
    { title: 'Giá & Chính sách', icon: <DollarSign className="w-4 h-4" /> },
    { title: 'Lịch khởi hành thực tế', icon: <Calendar className="w-4 h-4" /> },
  ];

  // Helper to parse locations
  const renderLocations = (dest: string) => {
    if (!dest) return <span className="text-slate-400 italic text-xs">Chưa xác định</span>;
    const places = dest.split(/[-➔,]/).map(p => p.trim()).filter(Boolean);
    return (
      <Space size={6} className="flex-wrap mt-1">
        {places.map((place, idx) => (
          <Tag 
            key={idx}
            color={idx === 0 ? 'blue' : 'emerald'} 
            className={`rounded-lg font-extrabold text-xs border-0 px-2.5 py-1 uppercase shrink-0 ${
              idx === 0 ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {place}
          </Tag>
        ))}
      </Space>
    );
  };

  // Drawer responsive width
  const drawerWidth = screens.xl ? 1000 : screens.lg ? 850 : 'calc(100vw - 30px)';

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      width={drawerWidth}
      maskClosable={false}
      keyboard={false}
      closable={false} // Custom close icon in header
      styles={{
        body: { padding: '24px', backgroundColor: '#f8fafc', overflowY: 'auto' },
        footer: { borderTop: '1px solid #f1f5f9', padding: '16px 24px', backgroundColor: '#ffffff', position: 'sticky', bottom: 0, zIndex: 10, boxShadow: '0 -4px 12px -2px rgba(15, 23, 42, 0.03)' }
      }}
      className="tour-viewer-drawer"
      maskStyle={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
      
      // 1. HEADER (ID Card style)
      title={
        <div className="flex items-center justify-between w-full py-2">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl text-white shadow-md shadow-emerald-200">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-slate-900 leading-tight">{tour.name}</h3>
                <Tag color={String(tour.status).toUpperCase() === 'ACTIVE' ? 'success' : 'default'} className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border-0 shrink-0">
                  {String(tour.status).toUpperCase() === 'ACTIVE' ? 'ĐANG HOẠT ĐỘNG' : 'TẠM KHÓA'}
                </Tag>
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  {tourCode}
                </span>
                <span className="text-xs text-slate-400 font-medium inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {tour.duration || `${tour.durationDays || 3} ngày ${tour.durationNights || 2} đêm`}
                </span>
                <span className="text-xs text-slate-400 font-medium inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {schedulesCount} lịch chạy
                </span>
              </div>
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

      // 4. STICKY FOOTER (Thanh thao tác cố định)
      footer={
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-slate-200 font-bold px-5 active:scale-95 transition-all text-slate-600 h-9"
            >
              Đóng lại
            </Button>
            <Tag color="processing" className="rounded-lg px-2.5 py-1 font-bold text-xs uppercase border-0 self-center hidden sm:inline-block">
              Chế độ: Chỉ xem thông tin
            </Tag>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="rounded-xl border-slate-200 font-bold px-4 active:scale-95 transition-all text-slate-600 h-9 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại
            </Button>
            {currentStep < tabs.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-5 active:scale-95 transition-all shadow-md shadow-emerald-100/50 h-9 border-0 flex items-center gap-1"
              >
                Tiếp tục
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-5 active:scale-95 transition-all shadow-md shadow-emerald-100/50 h-9 border-0 flex items-center gap-1"
              >
                Hoàn tất xem
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* 2. THE TABS (Selector) */}
      <div className="bg-white rounded-2xl px-5 border border-slate-100 shadow-sm mb-6 tour-viewer-tabs-container">
        <Tabs
          activeKey={currentStep.toString()}
          onChange={(key) => setCurrentStep(parseInt(key))}
          className="tour-viewer-tabs"
          items={tabs.map((tab, idx) => ({
            key: idx.toString(),
            label: (
              <span className="flex items-center gap-2 font-black text-xs uppercase tracking-wider py-1.5 select-none">
                {tab.icon}
                {tab.title}
              </span>
            )
          }))}
        />
      </div>

      {/* 3. STEP CONTENTS */}
      <div className="space-y-4">
        {/* STEP 1: GENERAL INFO (Read-only) */}
        {currentStep === 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Thông Tin Khái Quát</h4>
                <p className="text-xs text-slate-400 mt-1">Thông tin định danh và đặc tính kỹ thuật cơ bản của khuôn mẫu tour</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tên Khuôn mẫu Tour</span>
                  <p className="font-bold text-slate-800 text-sm mt-1 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                    {tour.name}
                  </p>
                </div>
                
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Mã Sản Phẩm tự sinh</span>
                  <p className="font-mono font-bold text-slate-700 text-sm mt-1 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                    {tourCode}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Hình Thức Tổ Chức</span>
                  <div className="mt-1">
                    <Tag color="cyan" className="rounded-lg font-bold text-xs border-0 px-3 py-1 bg-cyan-50 text-cyan-700 uppercase">
                      {tour.tourType === 'PRIVATE' ? 'Tour Riêng (Private)' : 'Tour Ghép đoàn (Join-in)'}
                    </Tag>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tuyến Hành Trình Tỉnh/Thành</span>
                  <div className="mt-1.5">
                    {renderLocations(tour.destination)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Thời Lượng Chuyến Đi</span>
                  <p className="font-bold text-slate-800 text-xs mt-1 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 inline-flex items-center gap-1.5 w-full">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {tour.duration || `${tour.durationDays || 3} Ngày / ${tour.durationNights || 2} Đêm`}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Lịch Trình Đang Chạy</span>
                  <p className="font-bold text-slate-800 text-xs mt-1 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 inline-flex items-center gap-1.5 w-full">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {schedulesCount} đợt khởi hành
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Khách Đã Trải Nghiệm</span>
                  <p className="font-bold text-slate-800 text-xs mt-1 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 inline-flex items-center gap-1.5 w-full">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {totalCustomers} hành khách
                  </p>
                </div>
              </div>

              {tour.description && (
                <div className="pt-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Mô tả Tổng quan & Giới thiệu SEO</span>
                  <div className="mt-2 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 text-xs leading-relaxed max-h-72 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: tour.description }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: ITINERARY BUILDER (Read-only Collapse) */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Nhật Ký Hành Trình</h4>
                  <p className="text-xs text-slate-400 mt-1">Lịch trình chi tiết và phân bổ hoạt động ăn uống, lưu trú theo từng ngày</p>
                </div>
                <Tag color="purple" className="rounded-lg font-bold border-0 px-2.5 py-1 uppercase bg-purple-50 text-purple-700">
                  {tour.itinerary?.length || 3} Ngày Khám Phá
                </Tag>
              </div>

              {/* Read-only Collapse list representing Itineraries */}
              {tour.itinerary && tour.itinerary.length > 0 ? (
                <Collapse
                  defaultActiveKey={['1']}
                  expandIconPosition="end"
                  className="bg-transparent border-0 space-y-3"
                  items={tour.itinerary.map((day, idx) => {
                    const dayNum = day.dayNumber || (idx + 1);
                    const meals = [];
                    // Simulated meals for real experience
                    if (dayNum % 2 === 1) meals.push('Sáng', 'Trưa');
                    else meals.push('Sáng', 'Trưa', 'Tối');

                    return {
                      key: String(dayNum),
                      label: (
                        <div className="flex items-center justify-between w-full py-1 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="size-8 rounded-xl bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-emerald-100 shrink-0">
                              N{dayNum}
                            </span>
                            <span className="font-extrabold text-slate-800 text-sm">{day.title || `Khám phá & Trải nghiệm ngày ${dayNum}`}</span>
                          </div>
                          
                          <Space size={6} className="hidden sm:flex">
                            {meals.map((meal, mIdx) => (
                              <Tag key={mIdx} color="warning" className="rounded-lg font-bold text-[9px] border-0 px-2 py-0.5 uppercase bg-amber-50 text-amber-700">
                                {meal}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      ),
                      children: (
                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 space-y-4 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                            <div>
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Phương Tiện Di Chuyển</span>
                              <p className="font-bold text-slate-700 mt-1 inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                                <Compass className="w-3.5 h-3.5 text-slate-400" />
                                {tour.vehicleType || 'Xe ô tô du lịch đời mới'}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Khẩu Phần Ăn Trong Ngày</span>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                {meals.map((meal, mIdx) => (
                                  <span key={mIdx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-150 rounded-lg font-semibold text-slate-600 shadow-sm">
                                    <Utensils className="w-3 h-3 text-slate-400" />
                                    {meal}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nội Dung Chi Tiết Lịch Trình</span>
                            <div 
                              className="mt-2 text-slate-600 leading-relaxed p-4 bg-white rounded-xl border border-slate-100 shadow-sm"
                              dangerouslySetInnerHTML={{ __html: day.description || 'Chưa cập nhật chi tiết hoạt động.' }} 
                            />
                          </div>
                        </div>
                      )
                    };
                  })}
                />
              ) : (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm font-medium">Chưa có lịch trình chi tiết cho khuôn mẫu này</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: MEDIA GALLERY (Read-only Gallery) */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Thư Viện Ảnh Sản Phẩm</h4>
                <p className="text-xs text-slate-400 mt-1">Kho lưu trữ hình ảnh tiếp thị của tour. Bức ảnh đánh dấu sao vàng đại diện cho ảnh bìa chính (Thumbnail).</p>
              </div>

              {/* Grid Images View */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                {/* Image item 1 - Cover */}
                <div className="relative group rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200 shadow-sm">
                  <img 
                    src={tour.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=200&fit=crop'} 
                    alt={tour.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white rounded-lg text-[9px] font-black shadow-md">
                      <Star className="w-2.5 h-2.5 fill-white text-white" />
                      ẢNH BÌA
                    </span>
                  </div>
                </div>

                {/* Simulated additional gallery images */}
                {[
                  'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=300&h=200&fit=crop',
                  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&h=200&fit=crop',
                  'https://images.unsplash.com/photo-1540959375944-7049f642e9a4?w=300&h=200&fit=crop'
                ].map((imgUrl, index) => (
                  <div key={index} className="relative group rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-150 shadow-sm">
                    <img 
                      src={imgUrl} 
                      alt={`Gallery ${index + 1}`} 
                      className="w-full h-full object-cover hover:scale-105 transition-all duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PRICING & POLICIES (Read-only pricing) */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Chính Sách Bán Hàng & Định Giá</h4>
                <p className="text-xs text-slate-400 mt-1">Cơ sở biểu giá vé mặc định cho Người lớn, Trẻ em và điều khoản bao gồm trong tour</p>
              </div>

              {/* Pricing Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/50 flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Giá Người Lớn Mặc Định</span>
                  <p className="text-xl font-black text-emerald-700 mt-2 tracking-tight">
                    {tour.price ? tour.price.toLocaleString('vi-VN') + ' ₫' : '0 ₫'}
                  </p>
                </div>

                <div className="bg-cyan-50/50 rounded-2xl p-5 border border-cyan-100/50 flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-wider">Giá Trẻ Em Mặc Định (70%)</span>
                  <p className="text-xl font-black text-cyan-700 mt-2 tracking-tight">
                    {tour.price ? (tour.price * 0.7).toLocaleString('vi-VN') + ' ₫' : '0 ₫'}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Sức Chứa Chỗ Mặc Định/Đợt</span>
                  <p className="text-xl font-black text-slate-700 mt-2 tracking-tight">
                    {tour.capacity || 20} chỗ ngồi
                  </p>
                </div>
              </div>

              {/* Policies Tags */}
              <div className="space-y-4 pt-2">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Dịch Vụ Đã Bao Gồm Trong Giá</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      'Xe đưa đón đời mới máy lạnh suốt tuyến',
                      'Vé máy bay khứ hồi (đối với tour xa)',
                      'Vé cáp treo & vé vào cổng tham quan',
                      'Khách sạn 4-5 sao (tiêu chuẩn 2 khách/phòng)',
                      'Bảo hiểm du lịch mức đền bù tối đa 50,000,000đ',
                      'Hướng dẫn viên chuyên nghiệp phục vụ suốt tuyến',
                      'Các bữa ăn theo lịch trình thiết kế'
                    ].map((inc, iIdx) => (
                      <Tag key={iIdx} color="emerald" className="rounded-lg font-bold text-xs border-0 px-3 py-1 bg-emerald-50 text-emerald-700 uppercase">
                        ✓ {inc}
                      </Tag>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Dịch Vụ KHÔNG Bao Gồm / Phí Tự Túc</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      'Thuế VAT 8% (nếu yêu cầu xuất hóa đơn đỏ)',
                      'Tiền Tip cho Hướng dẫn viên và Tài xế (tự nguyện)',
                      'Chi phí mua sắm cá nhân ngoài chương trình',
                      'Phụ thu phòng đơn khách sạn (nếu đi 1 mình)',
                      'Hoạt động vui chơi giải trí tự do ban đêm'
                    ].map((exc, eIdx) => (
                      <Tag key={eIdx} color="error" className="rounded-lg font-bold text-xs border-0 px-3 py-1 bg-rose-50 text-rose-700 uppercase">
                        ✗ {exc}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: ACTUAL DEPARTURES (Read-only Schedules) */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Danh Sách Lịch Khởi Hành Thực Tế</h4>
                  <p className="text-xs text-slate-400 mt-1">Các đợt khởi hành cụ thể, ngày đi/ngày về, số chỗ ngồi đã chốt và chỗ trống còn lại</p>
                </div>
                <Tag color="cyan" className="rounded-lg font-bold border-0 px-2.5 py-1 uppercase bg-cyan-50 text-cyan-700">
                  {tour.schedules?.length || 0} Đợt Khởi Hành
                </Tag>
              </div>

              {tour.schedules && tour.schedules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tour.schedules.map((schedule) => {
                    const totalSlots = (schedule.availableSlot || 0) + (schedule.bookedPeople || 0);
                    const percentBooked = totalSlots > 0 ? Math.round(((schedule.bookedPeople || 0) / totalSlots) * 100) : 0;
                    
                    return (
                      <div 
                        key={schedule.id} 
                        className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-all group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded border border-slate-300 uppercase">
                              #{schedule.id.substring(0, 8).toUpperCase()}
                            </span>
                            <Tag 
                              color={schedule.active ? 'success' : 'default'} 
                              className="rounded-md px-2 py-0.5 border-0 font-extrabold text-[10px] uppercase shrink-0"
                            >
                              {schedule.active ? 'MỞ BÁN' : 'KHÓA'}
                            </Tag>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Từ: {schedule.startDate}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs pl-5.5">
                              <span>Đến: {schedule.endDate}</span>
                            </div>
                          </div>

                          {schedule.note && (
                            <p className="text-[11px] text-slate-400 italic bg-white p-2.5 rounded-xl border border-slate-100 leading-normal">
                              📝 {schedule.note}
                            </p>
                          )}

                          {/* Seat progress bar */}
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-slate-400 uppercase tracking-wider">Đã đặt chỗ</span>
                              <span className="text-slate-700">{schedule.bookedPeople} / {totalSlots} ghế ({percentBooked}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${percentBooked}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-100/80 pt-3 mt-4 flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Biểu Giá Vé</span>
                          <span className="text-base font-black text-emerald-600 tracking-tight">
                            {schedule.price ? schedule.price.toLocaleString('vi-VN') + ' ₫' : '0 ₫'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm font-medium">Hiện không có lịch khởi hành thực tế nào đang mở bán cho khuôn mẫu này</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
