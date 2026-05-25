'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StaffTable } from '@/components/dashboard/staff-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import { consultantService, type Staff } from '@/services/consultantService';

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<Staff[]>([]);
  const [filteredConsultants, setFilteredConsultants] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchConsultants();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [consultants, searchQuery, statusFilter]);

  const applyFilters = () => {
    let filtered = consultants;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (consultant) =>
          consultant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          consultant.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(
        (consultant) => (statusFilter === 'active' ? consultant.isActive : !consultant.isActive)
      );
    }

    setFilteredConsultants(filtered);
  };

  const fetchConsultants = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Đang lấy dữ liệu tư vấn viên từ backend...');
      const response = await consultantService.getConsultants();

      console.log('Response từ backend:', response);

      if (response.success && response.data) {
        const consultantsData = Array.isArray(response.data) ? response.data : [];
        console.log('Consultants lấy được:', consultantsData);
        setConsultants(consultantsData);
      } else {
        console.warn('Lỗi lấy dữ liệu:', response.message);
        setError(response.message || 'Không thể lấy dữ liệu tư vấn viên');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      console.error('Lỗi catch:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditConsultant = (consultantId: string) => {
    console.log('Edit consultant:', consultantId);
  };

  const handleDeleteConsultant = (consultantId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa tư vấn viên này?')) {
      try {
        consultantService.deleteConsultant(consultantId);
        setConsultants(consultants.filter((c) => c.id !== consultantId));
      } catch (err) {
        console.error('Lỗi xóa tư vấn viên:', err);
      }
    }
  };

  const handleCreateConsultant = () => {
    console.log('Create consultant clicked');
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tư Vấn Viên</h1>
            <p className="text-slate-500 mt-2">Quản lý danh sách các tư vấn viên</p>
          </div>
          <Button
            onClick={handleCreateConsultant}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm Tư Vấn Viên
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
          staffList={filteredConsultants}
          staffType="consultant"
          onEdit={handleEditConsultant}
          onDelete={handleDeleteConsultant}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}
