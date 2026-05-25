'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { CustomerTable } from '@/components/dashboard/customer-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import { userService } from '@/services/userService';
import { customerService } from '@/services/customerService';
import { User } from '@/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, searchQuery, statusFilter]);

  const applyFilters = () => {
    let filtered = customers;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((customer) => customer.status === statusFilter);
    }

    setFilteredCustomers(filtered);
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Đang lấy dữ liệu customers từ backend...');
      const response = await customerService.getCustomers();

      console.log('Response từ backend:', response);

      if (response.success && response.data) {
        const customersData = Array.isArray(response.data) ? response.data : [];
        console.log('Customers lấy được:', customersData);
        if (customersData.length === 0) {
          console.warn('Không có dữ liệu customers từ backend');
        } else {
          setCustomers(customersData);
        }
      } else {
        console.warn('Lỗi lấy dữ liệu:', response.message);
        console.warn('Response status:', response.status);
        console.warn('Response error:', response.error);
        setError(response.message || 'Không thể lấy dữ liệu customers');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      console.error('Lỗi catch:', message);
      console.error('Chi tiết lỗi:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCustomer = (customerId: string) => {
    // TODO: Open edit customer modal/dialog
    console.log('Edit customer:', customerId);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await userService.deleteUser(customerId);
        // Update local state
        setCustomers(customers.filter((c) => c.id !== customerId));
      } catch (err) {
        console.error('Failed to delete customer:', err);
      }
    }
  };

  const handleCreateCustomer = () => {
    // TODO: Open create customer modal/dialog
    console.log('Create customer clicked');
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
            <p className="text-slate-500 mt-2">View and manage all registered customers</p>
          </div>
          <Button
            onClick={handleCreateCustomer}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Customer
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
            <option value="Active">Hoạt động</option>
            <option value="Inactive">Không hoạt động</option>
            <option value="Suspended">Tạm khóa</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-sm text-red-700 font-semibold mb-2">⚠️ Lỗi:</p>
          <p className="text-sm text-red-600 break-words">{error}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-red-500">Chi tiết</summary>
            <pre className="text-xs bg-red-100 p-2 rounded mt-2 overflow-auto max-h-40">
              Kiểm tra DevTools Console (F12) để xem lỗi chi tiết
            </pre>
          </details>
        </div>
      )}

      {/* Loading Message */}
      {isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <p className="text-sm text-blue-700">
            ⏳ Đang tải dữ liệu customers...
          </p>
        </div>
      )}

      {/* Customers Table */}
      <div>
        <CustomerTable
          customers={filteredCustomers}
          onEdit={handleEditCustomer}
          onDelete={handleDeleteCustomer}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}