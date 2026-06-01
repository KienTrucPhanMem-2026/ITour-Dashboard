'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { AccountTable } from '@/components/dashboard/account-table';
import { AccountDialog } from '@/components/dashboard/account-dialog';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter } from 'lucide-react';
import { accountService } from '@/services/accountService';
import { Account } from '@/types';
import { Input } from '@/components/ui/input';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() || roleFilter || statusFilter) {
      let filtered = accounts;

      // Apply search filter
      if (searchQuery.trim()) {
        filtered = filtered.filter(
          (acc) =>
            acc.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            acc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            acc.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply role filter
      if (roleFilter) {
        filtered = filtered.filter((acc) => acc.role === roleFilter);
      }

      // Apply status filter
      if (statusFilter) {
        filtered = filtered.filter(
          (acc) => (statusFilter === 'active' ? acc.isActive : !acc.isActive)
        );
      }

      setFilteredAccounts(filtered);
    } else {
      setFilteredAccounts(accounts);
    }
  }, [searchQuery, roleFilter, statusFilter, accounts]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await accountService.getAccounts({
        page: 1,
        pageSize: 10,
      });

      if (response.success && response.data) {
        setAccounts(response.data.items);
        setFilteredAccounts(response.data.items);
      } else {
        setError(response.message || 'Failed to fetch accounts');
        setAccounts(mockAccounts);
        setFilteredAccounts(mockAccounts);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      setAccounts(mockAccounts);
      setFilteredAccounts(mockAccounts);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (accountId: string, isActive: boolean) => {
    try {
      await accountService.updateAccountStatus(accountId, isActive);
      // Update local state
      setAccounts(
        accounts.map((acc) =>
          acc.id === accountId ? { ...acc, isActive } : acc
        )
      );
    } catch (err) {
      console.error('Failed to update account status:', err);
    }
  };

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setIsDialogOpen(true);
  };

  const handleCreateAccount = () => {
    setSelectedAccount(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedAccount(null);
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (selectedAccount) {
        // Update existing account
        await accountService.updateAccount(selectedAccount.id, formData);
        setAccounts(
          accounts.map((acc) =>
            acc.id === selectedAccount.id
              ? { ...acc, ...formData, updatedAt: new Date().toISOString() }
              : acc
          )
        );
      } else {
        // Create new account
        const response = await accountService.createAccount(formData);
        if (response.success && response.data) {
          setAccounts([...accounts, response.data]);
        }
      }
      handleDialogClose();
    } catch (err) {
      console.error('Failed to save account:', err);
      alert('Lỗi: Không thể lưu tài khoản. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      try {
        await accountService.deleteAccount(accountId);
        setAccounts(accounts.filter((acc) => acc.id !== accountId));
      } catch (err) {
        console.error('Failed to delete account:', err);
      }
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Quản Lý Tài Khoản</h1>
            <p className="text-slate-500 mt-2">Quản lý toàn bộ tài khoản người dùng</p>
          </div>
          <Button
            onClick={handleCreateAccount}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm Tài Khoản
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo tên, email hoặc tên người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-2 rounded-2xl border border-slate-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex gap-2 items-center">
            <Filter className="w-5 h-5 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              title="Lọc theo vai trò"
              className="flex-1 px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả vai trò</option>
              <option value="MANAGER">Quản lý</option>
              <option value="TOURGUIDE">Hướng dẫn viên</option>
              <option value="CONSULTANT">Tư vấn viên</option>
              <option value="TOURPLANNER">Lịch trình viên</option>
              <option value="CUSTOMER">Khách hàng</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Lọc theo trạng thái"
            className="px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && !accounts.length && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-sm text-amber-700">
            {error} - Displaying mock data for demonstration
          </p>
        </div>
      )}

      {/* Accounts Table */}
      <div>
        <AccountTable
          accounts={filteredAccounts}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </div>

      {/* Account Dialog */}
      <AccountDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleSubmit}
        account={selectedAccount}
        isLoading={isSubmitting}
      />
    </DashboardLayout>
  );
}

// Mock data as fallback
const mockAccounts: Account[] = [
  {
    id: '1',
    userName: 'john_doe',
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '0123456789',
    address: '123 Main St, City',
    dateOfBirth: '1990-01-15',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: '2',
    userName: 'jane_smith',
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '0987654321',
    address: '456 Oak Ave, Town',
    dateOfBirth: '1992-05-20',
    role: 'MANAGER',
    isActive: true,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-02-05T00:00:00Z',
  },
  {
    id: '3',
    userName: 'mike_johnson',
    fullName: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '0912345678',
    address: '789 Pine Rd, Village',
    dateOfBirth: '1988-08-10',
    role: 'TOUR_GUIDE',
    isActive: true,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-02-10T00:00:00Z',
  },
  {
    id: '4',
    userName: 'sarah_wilson',
    fullName: 'Sarah Wilson',
    email: 'sarah@example.com',
    phone: '0945123456',
    address: '321 Elm St, City',
    dateOfBirth: '1995-12-25',
    role: 'CONSULTANT',
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
  {
    id: '5',
    userName: 'robert_brown',
    fullName: 'Robert Brown',
    email: 'robert@example.com',
    phone: '0934567890',
    address: '654 Birch Ln, Town',
    dateOfBirth: '1985-03-12',
    role: 'CUSTOMER',
    isActive: false,
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-02-20T00:00:00Z',
  },
  {
    id: '6',
    userName: 'emily_davis',
    fullName: 'Emily Davis',
    email: 'emily@example.com',
    phone: '0956789012',
    address: '987 Cedar Dr, Village',
    dateOfBirth: '1993-07-08',
    role: 'USER',
    isActive: true,
    createdAt: '2024-01-25T00:00:00Z',
    updatedAt: '2024-02-25T00:00:00Z',
  },
];
