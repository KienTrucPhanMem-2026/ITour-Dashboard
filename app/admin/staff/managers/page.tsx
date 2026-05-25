'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StaffTable } from '@/components/dashboard/staff-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import { managerService, type Staff } from '@/services/managerService';

export default function ManagersPage() {
  const [managers, setManagers] = useState<Staff[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchManagers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [managers, searchQuery, statusFilter]);

  const applyFilters = () => {
    let filtered = managers;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (manager) =>
          manager.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          manager.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(
        (manager) => (statusFilter === 'active' ? manager.isActive : !manager.isActive)
      );
    }

    setFilteredManagers(filtered);
  };

  const fetchManagers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Đang lấy dữ liệu managers từ backend...');
      const response = await managerService.getManagers();

      console.log('Response từ backend:', response);

      if (response.success && response.data) {
        const managersData = Array.isArray(response.data) ? response.data : [];
        console.log('Managers lấy được:', managersData);
        setManagers(managersData);
      } else {
        console.warn('Lỗi lấy dữ liệu:', response.message);
        setError(response.message || 'Không thể lấy dữ liệu quản lý');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      console.error('Lỗi catch:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditManager = (managerId: string) => {
    console.log('Edit manager:', managerId);
  };

  const handleDeleteManager = (managerId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa quản lý này?')) {
      try {
        managerService.deleteManager(managerId);
        setManagers(managers.filter((m) => m.id !== managerId));
      } catch (err) {
        console.error('Lỗi xóa quản lý:', err);
      }
    }
  };

  const handleCreateManager = () => {
    console.log('Create manager clicked');
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Quản Lý</h1>
            <p className="text-slate-500 mt-2">Quản lý danh sách các quản lý</p>
          </div>
          <Button
            onClick={handleCreateManager}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm Quản Lý
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

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
          staffList={filteredManagers}
          staffType="manager"
          onEdit={handleEditManager}
          onDelete={handleDeleteManager}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}
