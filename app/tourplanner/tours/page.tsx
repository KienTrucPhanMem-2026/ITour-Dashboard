'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus, Search, Filter, Trash2, Edit, Check,
  Calendar, AlertCircle, MapPin, RotateCcw, Layers
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { tourService } from '@/services/tourService';
import { locationService } from '@/services/locationService';
import { vehicleService } from '@/services/vehicleService';
import { TourCreationWizardV2 } from '@/components/dashboard/tour-creation-wizard-v2';

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface Location {
  id: string;
  name: string;
  type: string;
}

interface Vehicle {
  id: string;
  type: string;
  seatCount: number;
}

interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  imageUrl?: string;
}

interface TourTemplate {
  id: string;
  tourCode: string;
  name: string;
  description: string;
  tourType: 'JOIN_IN' | 'PRIVATE';
  vehicleId: string;
  vehicleName: string;
  startDestinationId: string;
  startDestinationName: string;
  endDestinationId: string;
  endDestinationName: string;
  price: number; // Base cost
  cancellationPolicy: string;
  durationDays: number;
  durationNights: number;
  capacity: number;
  imageUrls: string[];
  coverImage: string;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  itinerary: ItineraryDay[];
  schedules?: any[];
}

export default function TourTemplatesPage() {
  // ── States ────────────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<TourTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TourTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dropdown data
  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Wizard & Dialogs
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TourTemplate | null>(null);

  // Delete Confirmation Modal states
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // ── Load Templates and Helpers ───────────────────────────────────────────
  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch locations
      const locRes = await locationService.getLocations();
      if (locRes.success && locRes.data) {
        setLocations(locRes.data.map((l: any) => ({
          id: l.id,
          name: l.name,
          type: l.type
        })));
      }

      // 2. Fetch vehicles
      const vehRes = await vehicleService.getVehicles();
      if (vehRes.success && vehRes.data) {
        setVehicles(vehRes.data.map((v: any) => ({
          id: v.id,
          type: v.type,
          seatCount: v.seatCount
        })));
      }

      // 3. Fetch Tours
      const tourRes = await tourService.getTours();
      if (tourRes.success && tourRes.data) {
        const list: TourTemplate[] = tourRes.data.map(t => {
          let status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' = 'PUBLISHED';
          const currentStatus = String(t.status).toUpperCase();
          if (currentStatus === 'INACTIVE') {
            status = 'HIDDEN';
          } else if (currentStatus === 'PENDING') {
            status = 'DRAFT';
          }

          // Parse itinerary
          const it = Array.isArray(t.itinerary) ? t.itinerary.map((item: any) => ({
            dayNumber: item.days || item.visitOrder || 1,
            title: item.locationName || item.note || `Ngày ${item.days}`,
            description: item.note || 'Khám phá điểm đến.',
            imageUrl: item.imageUrl || ''
          })) : [];

          return {
            id: t.id,
            tourCode: t.id.startsWith('TOUR-') ? t.id : `TOUR-${t.destination?.substring(0, 3).toUpperCase() || 'XXX'}-${Math.floor(1000 + Math.random() * 9000)}`,
            name: t.name,
            description: t.description || '',
            tourType: (t as any).tourType === 'PRIVATE' ? 'PRIVATE' : 'JOIN_IN',
            vehicleId: (t as any).vehicleId || '',
            vehicleName: t.vehicleType || 'Phương tiện vận chuyển',
            startDestinationId: (t as any).startDestinationId || '',
            startDestinationName: (t as any).startDestinationName || 'Điểm khởi hành',
            endDestinationId: (t as any).endDestinationId || '',
            endDestinationName: (t as any).endDestinationName || t.destination || 'Điểm đến',
            price: t.price || 0,
            cancellationPolicy: (t as any).cancellationPolicy || 'Chính sách hoàn hủy chuẩn iTour.',
            durationDays: (t as any).durationDays || 3,
            durationNights: (t as any).durationNights || 2,
            capacity: t.capacity || (t as any).maximumSlots || 20,
            imageUrls: t.image ? [t.image] : [],
            coverImage: t.image || 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=400&h=300&fit=crop',
            status,
            itinerary: it,
            schedules: t.schedules || []
          };
        });
        setTemplates(list);
      }

    } catch (err) {
      console.error(err);
      setError('Không thể lấy dữ liệu khuôn mẫu Tour.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = templates;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tourCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.endDestinationName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, statusFilter]);

  // ── Open Create / Edit Actions ───────────────────────────────────────────
  const handleOpenCreateWizard = () => {
    setSelectedTemplate(null);
    setIsWizardOpen(true);
  };

  const handleOpenEditWizard = (template: TourTemplate) => {
    setSelectedTemplate(template);
    setIsWizardOpen(true);
  };

  const triggerDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteDialogOpen(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Thiết Kế Khuôn Mẫu (Tour Templates)</h1>
          <p className="text-slate-500 mt-2">Nơi lập kế hoạch chi tiết, định giá cơ sở và vẽ lịch trình trước khi đưa ra mở bán chính thức.</p>
        </div>
        <Button
          onClick={handleOpenCreateWizard}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2 px-5 py-6 shadow-md"
        >
          <Plus className="w-5 h-5" /> Thiết kế Tour mới
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm khuôn mẫu theo tên tour, điểm đến, mã khuôn mẫu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-6 rounded-2xl border border-slate-200 shadow-sm"
          />
        </div>
        <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-1 shadow-sm items-center">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none text-slate-700 font-semibold"
            title="Lọc trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="DRAFT">DRAFT (Bản nháp)</option>
            <option value="PUBLISHED">PUBLISHED (Đang phát hành)</option>
            <option value="HIDDEN">HIDDEN (Đã ẩn)</option>
          </select>
        </div>
      </div>

      {/* Templates Table View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <RotateCcw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
          <p className="text-slate-400 font-semibold text-sm">Đang tải danh sách thiết kế khuôn mẫu...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <p className="text-rose-700 font-bold">{error}</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm text-center p-8">
          <Layers className="w-16 h-16 text-slate-300 mb-4" />
          <p className="text-slate-800 font-bold text-lg">Chưa có khuôn mẫu Tour nào</p>
          <p className="text-slate-400 text-sm mt-1 max-w-md">Tạo ngay một bản thiết kế khuôn mẫu du lịch chuẩn 4 bước để sẵn sàng bán lịch trình.</p>
          <Button onClick={handleOpenCreateWizard} className="mt-4 bg-emerald-600 text-white rounded-xl">Tạo khuôn mẫu mới</Button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-100 rounded-3xl shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Mã Tour</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tên Tour</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Loại Tour</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Thời lượng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nơi đến</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Giá cơ sở</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTemplates.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-semibold text-emerald-600 font-mono">{item.tourCode}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 line-clamp-1">{item.name}</span>
                      <span className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.description || 'Không có mô tả'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {item.tourType === 'PRIVATE' ? 'Tour riêng' : 'Ghép đoàn'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {item.durationDays}N{item.durationNights}Đ
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                      <span className="truncate max-w-[120px]">{item.endDestinationName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800'
                      : item.status === 'DRAFT' ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => handleOpenEditWizard(item)}
                        title="Sửa khuôn mẫu"
                        size="sm"
                        variant="outline"
                        className="p-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => triggerDelete(item.id)}
                        title="Ẩn/Xóa khuôn mẫu"
                        size="sm"
                        variant="outline"
                        className="p-2 border-slate-200 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Xác nhận xóa khuôn mẫu
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-2">
              Bạn có chắc chắn muốn xóa khuôn mẫu tour này không? Hành động này sẽ chuyển trạng thái của tour thành <strong>HIDDEN (Ẩn)</strong>. Các dữ liệu lịch sử đặt vé cũ sẽ không bị ảnh hưởng.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteTargetId(null);
              }}
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={async () => {
                if (deleteTargetId) {
                  try {
                    const res = await tourService.disableTour(deleteTargetId);
                    if (res.success) {
                      await fetchAllData();
                    } else {
                      alert('Lỗi: ' + res.message);
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Lỗi khi ẩn khuôn mẫu.');
                  }
                }
                setIsDeleteDialogOpen(false);
                setDeleteTargetId(null);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl border-transparent"
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tour Creation Wizard */}
      <TourCreationWizardV2
        isOpen={isWizardOpen}
        onClose={() => {
          setIsWizardOpen(false);
          setSelectedTemplate(null);
        }}
        onSuccess={() => {
          setIsWizardOpen(false);
          setSelectedTemplate(null);
          fetchAllData();
        }}
        editTourId={selectedTemplate?.id}
      />
    </DashboardLayout>
  );
}