'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { CustomerTable } from '@/components/dashboard/customer-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { userService } from '@/services/userService';
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
      const response = await userService.getCustomers({
        page: 1,
        pageSize: 10,
      });

      if (response.success && response.data) {
        setCustomers(response.data.items);
      } else {
        setError(response.message || 'Failed to fetch customers');
        // Set mock data as fallback
        setCustomers(mockCustomers);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      // Set mock data as fallback
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
      {error && !customers.length && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-sm text-amber-700">
            {error} - Displaying mock data for demonstration
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
