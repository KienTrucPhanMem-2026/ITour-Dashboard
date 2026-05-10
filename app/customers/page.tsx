'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { CustomerTable } from '@/components/dashboard/customer-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { userService } from '@/services/userService';
import { customerService } from '@/services/customerService';
import { User } from '@/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

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
          console.warn('Không có dữ liệu customers từ backend, sử dụng mock data');
          setCustomers(mockCustomers);
        } else {
          setCustomers(customersData);
        }
      } else {
        console.warn('Lỗi lấy dữ liệu:', response.message);
        console.warn('Response status:', response.status);
        console.warn('Response error:', response.error);
        setError(response.message || 'Không thể lấy dữ liệu customers');
        // Sử dụng mock data làm fallback
        setCustomers(mockCustomers);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      console.error('Lỗi catch:', message);
      console.error('Chi tiết lỗi:', err);
      setError(message);
      // Sử dụng mock data làm fallback
      setCustomers(mockCustomers);
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
          customers={customers}
          onEdit={handleEditCustomer}
          onDelete={handleDeleteCustomer}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}

// Mock data as fallback
const mockCustomers: User[] = [
  {
    id: 'u1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St',
    city: 'New York',
    country: 'USA',
    totalBookings: 3,
    totalSpent: 5397,
    joinDate: '2023-06-15T10:00:00Z',
    status: 'Active',
    createdAt: '2023-06-15T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'u2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1 (555) 234-5678',
    address: '456 Oak Ave',
    city: 'Los Angeles',
    country: 'USA',
    totalBookings: 2,
    totalSpent: 4797,
    joinDate: '2023-09-20T14:30:00Z',
    status: 'Active',
    createdAt: '2023-09-20T14:30:00Z',
    updatedAt: '2024-02-05T14:30:00Z',
  },
  {
    id: 'u3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    phone: '+1 (555) 345-6789',
    address: '789 Pine Rd',
    city: 'Chicago',
    country: 'USA',
    totalBookings: 5,
    totalSpent: 8945,
    joinDate: '2023-03-10T09:15:00Z',
    status: 'Active',
    createdAt: '2023-03-10T09:15:00Z',
    updatedAt: '2024-02-10T09:15:00Z',
  },
  {
    id: 'u4',
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    phone: '+1 (555) 456-7890',
    address: '321 Elm St',
    city: 'Houston',
    country: 'USA',
    totalBookings: 1,
    totalSpent: 1599,
    joinDate: '2024-01-05T11:45:00Z',
    status: 'Active',
    createdAt: '2024-01-05T11:45:00Z',
    updatedAt: '2024-02-03T11:45:00Z',
  },
  {
    id: 'u5',
    name: 'Robert Brown',
    email: 'robert@example.com',
    phone: '+1 (555) 567-8901',
    address: '654 Maple Dr',
    city: 'Phoenix',
    country: 'USA',
    totalBookings: 4,
    totalSpent: 7298,
    joinDate: '2023-11-22T13:00:00Z',
    status: 'Inactive',
    createdAt: '2023-11-22T13:00:00Z',
    updatedAt: '2024-01-20T13:00:00Z',
  },
];
