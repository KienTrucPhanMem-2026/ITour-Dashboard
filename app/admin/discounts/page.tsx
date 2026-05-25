'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter, 
  Percent, 
  Calendar, 
  Pencil, 
  Check, 
  X, 
  Tag, 
  Compass, 
  Info,
  DollarSign
} from 'lucide-react';
import { discountService } from '@/services/discountService';
import { apiClient } from '@/lib/api-client';
import { Discount, Tour } from '@/types';
import { toast, Toaster } from 'sonner';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [filteredDiscounts, setFilteredDiscounts] = useState<Discount[]>([]);
  const [allTours, setAllTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RUNNING' | 'UPCOMING' | 'ENDED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Dialog & Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'GENERAL' | 'SCOPE'>('GENERAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scope: specified tours state
  const [applyScope, setApplyScope] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedTourIds, setSelectedTourIds] = useState<string[]>([]);
  const [tourSearchQuery, setTourSearchQuery] = useState('');

  // General info state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    code: '',
    description: '',
    discountAmount: 0,
    discountType: 'PERCENT',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  useEffect(() => {
    fetchDiscounts();
    fetchTours();
  }, []);

  useEffect(() => {
    const now = new Date().getTime();
    let result = discounts;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q)
      );
    }

    // Status filter (Đang chạy, Sắp chạy, Đã kết thúc)
    if (statusFilter === 'RUNNING') {
      result = result.filter((d) => {
        const start = new Date(d.startDate).getTime();
        const end = new Date(d.endDate).getTime();
        return d.isActive && start <= now && end >= now;
      });
    } else if (statusFilter === 'UPCOMING') {
      result = result.filter((d) => {
        const start = new Date(d.startDate).getTime();
        return d.isActive && start > now;
      });
    } else if (statusFilter === 'ENDED') {
      result = result.filter((d) => {
        const end = new Date(d.endDate).getTime();
        return !d.isActive || end < now;
      });
    }

    // Type filter
    if (typeFilter) {
      result = result.filter((d) => d.discountType === typeFilter);
    }

    setFilteredDiscounts(result);
  }, [searchQuery, statusFilter, typeFilter, discounts]);

  const fetchDiscounts = async () => {
    setIsLoading(true);
    try {
      const response = await discountService.getDiscounts();
      if (response.success && response.data) {
        setDiscounts(response.data);
      } else {
        setDiscounts(mockDiscounts);
      }
    } catch (e) {
      console.error('Failed to load discounts', e);
      setDiscounts(mockDiscounts);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTours = async () => {
    try {
      const res = await apiClient.get<Tour[]>('/tours');
      if (res.success && res.data) {
        setAllTours(res.data);
      } else {
        setAllTours(mockTours);
      }
    } catch (e) {
      console.error('Failed to load tours for specify list', e);
      setAllTours(mockTours);
    }
  };

  const handleOpenCreate = () => {
    setSelectedDiscount(null);
    setFormData({
      id: '',
      name: '',
      code: '',
      description: '',
      discountAmount: 0,
      discountType: 'PERCENT',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
    });
    setApplyScope('ALL');
    setSelectedTourIds([]);
    setActiveFormTab('GENERAL');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (discount: Discount) => {
    setSelectedDiscount(discount);
    setFormData({
      id: discount.id,
      name: discount.name,
      code: discount.code,
      description: discount.description || '',
      discountAmount: discount.discountAmount,
      discountType: discount.discountType,
      startDate: discount.startDate,
      endDate: discount.endDate,
      isActive: discount.isActive,
    });

    // Simulate scope state retrieval from database associations
    // In itour, specific tour ids reside in discount.discountTours list
    const specificTours = (discount as any).discountTours || [];
    if (specificTours.length > 0) {
      setApplyScope('SPECIFIC');
      setSelectedTourIds(specificTours.map((st: any) => st.tourId || st.tour?.id).filter(Boolean));
    } else {
      setApplyScope('ALL');
      setSelectedTourIds([]);
    }

    setActiveFormTab('GENERAL');
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (discount: Discount) => {
    const updatedStatus = !discount.isActive;
    try {
      const res = await discountService.updateDiscount(discount.id, {
        ...discount,
        isActive: updatedStatus,
      });
      if (res.success) {
        setDiscounts((prev) =>
          prev.map((d) => (d.id === discount.id ? { ...d, isActive: updatedStatus } : d))
        );
        toast.success(`Đã ${updatedStatus ? 'bật' : 'tắt'} mã giảm giá thành công!`);
      } else {
        setDiscounts((prev) =>
          prev.map((d) => (d.id === discount.id ? { ...d, isActive: updatedStatus } : d))
        );
        toast.success(`Đã ${updatedStatus ? 'bật' : 'tắt'} mã giảm giá (Mô phỏng)!`);
      }
    } catch (e) {
      toast.error('Không thể cập nhật trạng thái hoạt động.');
    }
  };

  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'ITOUR-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code }));
    toast.success(`Đã sinh ngẫu nhiên mã code: ${code}`);
  };

  const handleTourCheckbox = (tourId: string) => {
    setSelectedTourIds((prev) =>
      prev.includes(tourId) ? prev.filter((id) => id !== tourId) : [...prev, tourId]
    );
  };

  const handleSelectAllTours = () => {
    if (selectedTourIds.length === filteredToursForSelect.length) {
      setSelectedTourIds([]);
    } else {
      setSelectedTourIds(filteredToursForSelect.map((t) => t.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Logic/Backend Validation rules ───────────────────────────────────────
    if (!formData.name || !formData.code || formData.discountAmount <= 0) {
      toast.error('Vui lòng nhập đầy đủ thông tin bắt buộc.');
      return;
    }

    const start = new Date(formData.startDate).getTime();
    const end = new Date(formData.endDate).getTime();
    if (end < start) {
      toast.error('Ngày kết thúc (endDate) không được nhỏ hơn ngày bắt đầu (startDate).');
      return;
    }

    if (formData.discountType === 'PERCENT' && formData.discountAmount > 100) {
      toast.error('Mức giảm phần trăm không được vượt quá 100%.');
      return;
    }

    setIsSubmitting(true);
    // Prepare payload with scope mappings for backend
    const simulatedToursMapping = applyScope === 'SPECIFIC'
      ? selectedTourIds.map((tourId) => ({ id: `dt-${tourId}`, tourId }))
      : [];
    const payload = {
      ...formData,
      discountTours: simulatedToursMapping,
    };

    try {
      if (selectedDiscount) {
        // Edit mode
        const res = await discountService.updateDiscount(selectedDiscount.id, payload);
        if (res.success && res.data) {
          setDiscounts((prev) =>
            prev.map((d) => (d.id === selectedDiscount.id ? res.data! : d))
          );
          toast.success('Cập nhật chương trình khuyến mãi thành công!');
        } else {
          // Fallback simulation
          const mockUpdated: Discount = {
            ...selectedDiscount,
            ...payload,
          };
          setDiscounts((prev) =>
            prev.map((d) => (d.id === selectedDiscount.id ? mockUpdated : d))
          );
          toast.success('Cập nhật chương trình khuyến mãi thành công (Mô phỏng)!');
        }
      } else {
        // Create mode
        const res = await discountService.createDiscount(payload);
        if (res.success && res.data) {
          setDiscounts((prev) => [...prev, res.data!]);
          toast.success('Tạo chương trình khuyến mãi mới thành công!');
        } else {
          // Fallback simulation
          const mockNew: Discount = {
            ...payload,
            id: payload.id || 'DISC-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          };
          setDiscounts((prev) => [...prev, mockNew]);
          toast.success('Tạo chương trình khuyến mãi mới thành công (Mô phỏng)!');
        }
      }
      setIsDialogOpen(false);
    } catch (e) {
      toast.error('Có lỗi xảy ra khi lưu chương trình.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (discount: Discount) => {
    const now = new Date().getTime();
    const start = new Date(discount.startDate).getTime();
    const end = new Date(discount.endDate).getTime();

    if (!discount.isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 fill-current" />
          Tạm khóa
        </span>
      );
    }

    if (end < now) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 fill-current animate-pulse" />
          Đã kết thúc
        </span>
      );
    }

    if (start > now) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 fill-current animate-pulse" />
          Sắp chạy
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 fill-current animate-pulse" />
        Đang chạy
      </span>
    );
  };

  const filteredToursForSelect = allTours.filter((t) =>
    t.name.toLowerCase().includes(tourSearchQuery.toLowerCase()) ||
    t.destination.toLowerCase().includes(tourSearchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Tag className="w-7 h-7 text-blue-600 fill-blue-600" />
              Khuyến mãi & Ưu đãi
            </h1>
            <p className="text-slate-500 mt-2">Quản lý chiết khấu, voucher và thiết lập phạm vi áp dụng cho từng Tour du lịch</p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl gap-2 font-bold px-5 py-6 shadow-md transition-all active:scale-95 shrink-0 self-start sm:self-center"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            Tạo Mã Giảm Giá
          </Button>
        </div>
      </div>

      {/* ══ SCREEN 1: Dashboard with Filter & Table ══ */}
      {/* Search and Filters */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search text input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 stroke-[2.5]" />
            <Input
              placeholder="Tìm kiếm mã giảm giá theo tên chương trình, mã code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 rounded-2xl border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-2 md:flex gap-3">
            {/* Status Filter selector */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-2xl px-3 bg-white">
              <Filter className="w-4 h-4 text-slate-500 fill-slate-500 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="py-2.5 bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer"
                title="Lọc trạng thái khuyến mãi"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="RUNNING">Đang chạy</option>
                <option value="UPCOMING">Sắp chạy</option>
                <option value="ENDED">Đã kết thúc / Khóa</option>
              </select>
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-2 border border-slate-200 rounded-2xl px-3 bg-white">
              <Percent className="w-4 h-4 text-slate-500 fill-slate-500 shrink-0" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="py-2.5 bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer"
                title="Lọc loại chiết khấu"
              >
                <option value="">Tất cả hình thức</option>
                <option value="PERCENT">Giảm phần trăm (%)</option>
                <option value="AMOUNT">Giảm tiền mặt (đ)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-100 rounded-3xl">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400 font-semibold">Đang tải danh sách khuyến mãi...</span>
        </div>
      ) : filteredDiscounts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm space-y-4">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-3xl mx-auto shadow-inner">
            🏷️
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-extrabold text-slate-800 text-base">Không tìm thấy mã khuyến mãi</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Vui lòng thay đổi từ khóa hoặc các bộ lọc trạng thái để hiển thị dữ liệu khuyến mãi.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-wider">
                  <th className="py-4 px-6">Tên chương trình</th>
                  <th className="py-4 px-6">Mã Code</th>
                  <th className="py-4 px-6">Mức giảm</th>
                  <th className="py-4 px-6">Thời gian áp dụng</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 text-sm">
                {filteredDiscounts.map((discount) => {
                  const isPercent = discount.discountType === 'PERCENT';
                  const now = new Date().getTime();
                  const end = new Date(discount.endDate).getTime();
                  const isExpired = end < now;

                  return (
                    <tr key={discount.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4.5 px-6">
                        <div className="min-w-[180px]">
                          <p className="font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {discount.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate max-w-[280px] mt-0.5" title={discount.description}>
                            {discount.description || 'Không có mô tả chi tiết.'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className="inline-block font-mono font-black text-xs uppercase px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 shadow-inner">
                          {discount.code}
                        </span>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className="font-black text-emerald-600 text-sm">
                          {isPercent
                            ? `${discount.discountAmount}%`
                            : `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discount.discountAmount)}`
                          }
                        </span>
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-bold min-w-[170px]">
                          <Calendar className="w-4 h-4 text-slate-400 fill-slate-400 shrink-0" />
                          <span>
                            {new Date(discount.startDate).toLocaleDateString('vi-VN')} - {new Date(discount.endDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        {getStatusBadge(discount)}
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="flex items-center justify-center gap-4">
                          {/* Toggle Switch */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold select-none">
                              {discount.isActive ? 'Bật' : 'Tắt'}
                            </span>
                            <button
                              onClick={() => handleToggleStatus(discount)}
                              className={`w-10 h-5.5 rounded-full relative transition-colors duration-200 focus:outline-none border shadow-inner shrink-0
                                ${discount.isActive 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'bg-slate-200 border-slate-200'}`}
                              title={discount.isActive ? 'Bật mã giảm giá' : 'Tắt mã giảm giá'}
                            >
                              <div
                                className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.5 left-0.5 transition-transform duration-200 shadow
                                  ${discount.isActive ? 'translate-x-4.5' : ''}`}
                              />
                            </button>
                          </div>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(discount)}
                            className="p-2 bg-white text-slate-500 border border-slate-200 rounded-xl hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-colors shadow-sm cursor-pointer"
                            title="Sửa thông tin chương trình"
                          >
                            <Pencil className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ SCREEN 2: Add / Edit Form Modal ══ */}
      {isDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsDialogOpen(false)}
        >
          <div
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 relative animate-in zoom-in-95 duration-200 text-left flex flex-col max-h-[90dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Tag className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-snug">
                    {selectedDiscount ? 'Cập Nhật Chương Trình Khuyến Mãi' : 'Thêm Chương Trình Khuyến Mãi Mới'}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    {selectedDiscount ? `Mã giảm giá đang sửa: ${selectedDiscount.code}` : 'Điền thông tin cơ bản và phạm vi áp dụng để lưu chương trình.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2.5 rounded-2xl transition-all duration-200 shrink-0"
                title="Đóng cửa sổ"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Steps Tabs selectors */}
            <div className="px-6 border-b border-slate-100 flex bg-white shrink-0">
              <button
                type="button"
                onClick={() => setActiveFormTab('GENERAL')}
                className={`py-3.5 px-4 font-black text-xs uppercase tracking-wider relative transition-all border-b-2
                  ${activeFormTab === 'GENERAL'
                    ? 'border-blue-600 text-blue-600 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
              >
                1. Thông tin cơ bản
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('SCOPE')}
                className={`py-3.5 px-4 font-black text-xs uppercase tracking-wider relative transition-all border-b-2
                  ${activeFormTab === 'SCOPE'
                    ? 'border-blue-600 text-blue-600 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
              >
                2. Cấu hình áp dụng
              </button>
            </div>

            {/* Modal Scrollable Forms Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-slate-50/30">
              <div className="p-6 flex-1">
                {/* ══ STEP 1: Card 1 - General Information ══ */}
                {activeFormTab === 'GENERAL' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                        <Info className="w-4 h-4 text-blue-500 fill-blue-500" />
                        <h4 className="font-extrabold text-slate-800 text-sm">Thông Tin Chương Trình</h4>
                      </div>

                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Tên chương trình khuyến mãi *</label>
                        <Input
                          required
                          placeholder="Ví dụ: Chào hè Phú Quốc 2026"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="rounded-2xl border-slate-200 text-sm font-bold h-11"
                        />
                      </div>

                      {/* Code */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Mã khuyến mãi (Code) *</label>
                        <div className="flex gap-2">
                          <Input
                            required
                            placeholder="Ví dụ: SUMMER26"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            disabled={!!selectedDiscount}
                            className="rounded-2xl border-slate-200 text-sm font-black uppercase h-11 flex-1 font-mono tracking-wider shadow-inner"
                          />
                          {!selectedDiscount && (
                            <Button
                              type="button"
                              onClick={handleGenerateCode}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold px-4 h-11 border border-slate-200 shrink-0"
                            >
                              Tạo ngẫu nhiên
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Mô tả chi tiết</label>
                        <textarea
                          placeholder="Nhập thông tin giới thiệu, các điều khoản và quyền lợi đi kèm của mã giảm giá..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>

                      {/* Type and Value selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Hình thức giảm giá *</label>
                          <select
                            value={formData.discountType}
                            onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                            className="w-full px-3.5 py-2.5 h-11 rounded-2xl border border-slate-200 text-xs font-black bg-white text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                          >
                            <option value="PERCENT">Phần trăm (%)</option>
                            <option value="AMOUNT">Số tiền cố định (đ)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                            {formData.discountType === 'PERCENT' ? 'Mức giảm (%) *' : 'Số tiền giảm (VND) *'}
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              required
                              min={1}
                              max={formData.discountType === 'PERCENT' ? 100 : undefined}
                              value={formData.discountAmount || ''}
                              onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                              className="rounded-2xl border-slate-200 text-sm font-black h-11 pl-9 pr-4"
                            />
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-extrabold flex items-center justify-center">
                              {formData.discountType === 'PERCENT' ? <Percent className="w-4 h-4 text-slate-400 stroke-[2.5]" /> : <DollarSign className="w-4 h-4 text-slate-400 stroke-[2.5]" />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Date Range selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Hiệu lực Từ Ngày (startDate) *</label>
                          <Input
                            type="date"
                            required
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="rounded-2xl border-slate-200 text-sm font-bold h-11"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Hiệu lực Đến Ngày (endDate) *</label>
                          <Input
                            type="date"
                            required
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="rounded-2xl border-slate-200 text-sm font-bold h-11"
                          />
                        </div>
                      </div>

                      {/* Active Toggle form checkbox */}
                      <div className="flex items-center gap-2.5 pt-2 select-none">
                        <input
                          type="checkbox"
                          id="formIsActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="formIsActive" className="text-xs text-slate-600 font-extrabold cursor-pointer">
                          Kích hoạt chương trình khuyến mãi ngay lập tức
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══ STEP 2: Card 2 - Scope & Rules ══ */}
                {activeFormTab === 'SCOPE' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                        <Compass className="w-4 h-4 text-blue-500 fill-blue-500" />
                        <h4 className="font-extrabold text-slate-800 text-sm">Phạm Vi & Quy Tắc Áp Dụng</h4>
                      </div>

                      {/* Scope Options */}
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">Phạm vi áp dụng khuyến mãi *</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* All tours radio option */}
                          <div
                            onClick={() => setApplyScope('ALL')}
                            className={`p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer select-none transition-all
                              ${applyScope === 'ALL'
                                ? 'border-blue-500 bg-blue-500/5 shadow-sm'
                                : 'border-slate-100 hover:border-slate-200'
                              }`}
                          >
                            <input
                              type="radio"
                              name="applyScopeRadio"
                              checked={applyScope === 'ALL'}
                              onChange={() => setApplyScope('ALL')}
                              className="w-4 h-4 text-blue-600"
                            />
                            <div>
                              <p className="text-xs font-black text-slate-800">Áp dụng cho tất cả Tour</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Hệ thống tự động giảm giá cho toàn bộ các tour du lịch hiện có.</p>
                            </div>
                          </div>

                          {/* Specific tours radio option */}
                          <div
                            onClick={() => setApplyScope('SPECIFIC')}
                            className={`p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer select-none transition-all
                              ${applyScope === 'SPECIFIC'
                                ? 'border-blue-500 bg-blue-500/5 shadow-sm'
                                : 'border-slate-100 hover:border-slate-200'
                              }`}
                          >
                            <input
                              type="radio"
                              name="applyScopeRadio"
                              checked={applyScope === 'SPECIFIC'}
                              onChange={() => setApplyScope('SPECIFIC')}
                              className="w-4 h-4 text-blue-600"
                            />
                            <div>
                              <p className="text-xs font-black text-slate-800">Chỉ định Tour cụ thể</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Chỉ định cụ thể những tour được phép áp dụng mức giảm giá này.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* specify Tours Table list */}
                      {applyScope === 'SPECIFIC' && (
                        <div className="space-y-3.5 pt-3 animate-in fade-in duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-50">
                            <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                              Bảng chọn Tour du lịch ({selectedTourIds.length} đã chọn)
                            </label>
                            <div className="relative w-full sm:w-60">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 stroke-[2.5]" />
                              <Input
                                placeholder="Tìm nhanh tour..."
                                value={tourSearchQuery}
                                onChange={(e) => setTourSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-1.5 h-8.5 rounded-xl border-slate-200 text-xs font-semibold"
                              />
                            </div>
                          </div>

                          <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-60 overflow-y-auto shadow-inner bg-slate-50/20">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[9px] uppercase font-black tracking-wider">
                                  <th className="py-2.5 px-4 w-12 text-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedTourIds.length === filteredToursForSelect.length && filteredToursForSelect.length > 0}
                                      onChange={handleSelectAllTours}
                                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                                      title="Chọn tất cả"
                                    />
                                  </th>
                                  <th className="py-2.5 px-4">Tên Tour</th>
                                  <th className="py-2.5 px-4">Điểm đến</th>
                                  <th className="py-2.5 px-4 text-right">Giá niêm yết</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700 bg-white">
                                {filteredToursForSelect.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="py-8 text-center text-slate-400 font-bold">
                                      Không tìm thấy tour phù hợp.
                                    </td>
                                  </tr>
                                ) : (
                                  filteredToursForSelect.map((t) => {
                                    const isChecked = selectedTourIds.includes(t.id);
                                    return (
                                      <tr
                                        key={t.id}
                                        onClick={() => handleTourCheckbox(t.id)}
                                        className={`hover:bg-slate-50 cursor-pointer transition-colors
                                          ${isChecked ? 'bg-blue-500/5' : ''}`}
                                      >
                                        <td className="py-2.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleTourCheckbox(t.id)}
                                            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                                          />
                                        </td>
                                        <td className="py-2.5 px-4 font-bold text-slate-800 line-clamp-1 max-w-[240px] mt-2">
                                          {t.name}
                                        </td>
                                        <td className="py-2.5 px-4 text-slate-500">
                                          {t.destination}
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-black text-slate-900 font-mono">
                                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.price)}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="px-6 py-5 border-t border-slate-100 bg-white flex gap-3 shrink-0">
                {activeFormTab === 'SCOPE' ? (
                  <Button
                    type="button"
                    onClick={() => setActiveFormTab('GENERAL')}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition-all"
                  >
                    Quay lại bước 1
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      if (!formData.name || !formData.code || formData.discountAmount <= 0) {
                        toast.error('Vui lòng điền các trường bắt buộc ở bước 1 trước.');
                        return;
                      }
                      setActiveFormTab('SCOPE');
                    }}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-black transition-all"
                  >
                    Tiếp tục bước 2
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black transition-all shadow-md active:scale-95"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu chương trình'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Fallback mock discounts data
const mockDiscounts: Discount[] = [
  {
    id: '1',
    code: 'SUMMER2026',
    name: 'Khuyến Mãi Hè Rực Rỡ',
    description: 'Giảm giá cực khủng cho các tour đi biển Nha Trang, Phú Quốc, Hạ Long trong dịp hè 2026.',
    discountAmount: 15,
    discountType: 'PERCENT',
    startDate: '2026-05-01',
    endDate: '2026-08-31',
    isActive: true,
  },
  {
    id: '2',
    code: 'ITOURNEW',
    name: 'Chào Mừng Khách Hàng Mới',
    description: 'Tặng ngay 100k cho khách hàng lần đầu đặt tour trên hệ thống iTour Hub.',
    discountAmount: 100000,
    discountType: 'AMOUNT',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    isActive: true,
  },
  {
    id: '3',
    code: 'MIDAUTUMN',
    name: 'Đoàn Viên Tết Trung Thu',
    description: 'Giảm chiết khấu ấm áp cho các tour ghép gia đình nhân dịp Tết Trung Thu đoàn viên.',
    discountAmount: 10,
    discountType: 'PERCENT',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    isActive: false,
  },
  {
    id: '4',
    code: 'VIPSPRING',
    name: 'Lộc Xuân Tri Ân Khách Hàng Thân Thiết',
    description: 'Giảm ngay 500k dành riêng cho tài khoản đạt hạng mức tích lũy thành viên VIP.',
    discountAmount: 500000,
    discountType: 'AMOUNT',
    startDate: '2026-02-01',
    endDate: '2026-03-15',
    isActive: true,
  },
];

// Fallback mock tours for specific specifying table
const mockTours: Tour[] = [
  {
    id: '30001',
    name: 'Tour Bến Tre - Khám phá miệt vườn sông nước',
    destination: 'Bến Tre',
    image: '/assets/3-5.png',
    status: 'Active',
    startDate: '2026-06-01',
    duration: '2N1Đ',
    capacity: 40,
    booked: 12,
    price: 1800000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '30002',
    name: 'Tour Nha Trang - Thiên đường biển đảo cát trắng',
    destination: 'Khánh Hòa',
    image: '/assets/3-5.png',
    status: 'Active',
    startDate: '2026-06-15',
    duration: '3N2Đ',
    capacity: 50,
    booked: 24,
    price: 3200000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '30003',
    name: 'Tour Đà Lạt - Sương mù ngàn hoa thơ mộng',
    destination: 'Lâm Đồng',
    image: '/assets/3-5.png',
    status: 'Active',
    startDate: '2026-07-01',
    duration: '4N3Đ',
    capacity: 30,
    booked: 15,
    price: 2900000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '30004',
    name: 'Tour Phú Quốc - Hoàng hôn đảo ngọc lộng gió',
    destination: 'Kiên Giang',
    image: '/assets/3-5.png',
    status: 'Active',
    startDate: '2026-07-10',
    duration: '3N2Đ',
    capacity: 45,
    booked: 35,
    price: 4500000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
