'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StaffTable } from '@/components/dashboard/staff-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import { tourguideService, type Staff } from '@/services/tourguideService';

export default function TourGuidesPage() {
  const [tourguides, setTourGuides] = useState<Staff[]>([]);
  const [filteredTourGuides, setFilteredTourGuides] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchTourGuides();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tourguides, searchQuery, statusFilter]);

  const applyFilters = () => {
    let filtered = tourguides;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (guide) =>
          guide.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          guide.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(
        (guide) => (statusFilter === 'active' ? guide.isActive : !guide.isActive)
      );
    }

    setFilteredTourGuides(filtered);
  };

  const fetchTourGuides = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Đang lấy dữ liệu hướng dẫn viên từ backend...');
      const response = await tourguideService.getTourGuides();

      console.log('Response từ backend:', response);

      if (response.success && response.data) {
        const guidesData = Array.isArray(response.data) ? response.data : [];
        console.log('Tour Guides lấy được:', guidesData);
        setTourGuides(guidesData);
      } else {
        console.warn('Lỗi lấy dữ liệu:', response.message);
        setError(response.message || 'Không thể lấy dữ liệu hướng dẫn viên');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      console.error('Lỗi catch:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTourGuide = (guideId: string) => {
    console.log('Edit tour guide:', guideId);
  };

  const handleDeleteTourGuide = (guideId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa hướng dẫn viên này?')) {
      try {
        tourguideService.deleteTourGuide(guideId);
        setTourGuides(tourguides.filter((g) => g.id !== guideId));
      } catch (err) {
        console.error('Lỗi xóa hướng dẫn viên:', err);
      }
    }
  };

  const handleCreateTourGuide = () => {
    console.log('Create tour guide clicked');
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Hướng Dẫn Viên</h1>
            <p className="text-slate-500 mt-2">Quản lý danh sách các hướng dẫn viên</p>
          </div>
          <Button
            onClick={handleCreateTourGuide}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm Hướng Dẫn Viên
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-2 rounded-2xl border border-slate-200"
          />
        </div>

        <div className="flex gap-2">
          <Filter className="w-5 h-5 text-slate-500 mt-2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Lọc theo trạng thái"
            className="flex-1 px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-sm text-red-700 font-semibold mb-2">⚠️ Lỗi:</p>
          <p className="text-sm text-red-600 break-words">{error}</p>
        </div>
      )}

      {/* Loading Message */}
      {isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <p className="text-sm text-blue-700">
            ⏳ Đang tải dữ liệu...
          </p>
        </div>
      )}

      {/* Staff Table */}
      <div>
        <StaffTable
          staffList={filteredTourGuides}
          staffType="tourguide"
          onEdit={handleEditTourGuide}
          onDelete={handleDeleteTourGuide}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}
