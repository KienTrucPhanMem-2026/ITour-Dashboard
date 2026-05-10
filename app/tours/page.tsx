'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { TourTable } from '@/components/dashboard/tour-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { tourService } from '@/services/tourService';
import { Tour } from '@/types';

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Đang lấy dữ liệu tours từ backend...');
      const response = await tourService.getTours();

      console.log('Response từ backend:', response);
      
      if (response.success && response.data) {
        const toursData = Array.isArray(response.data) ? response.data : [];
        console.log('Tours lấy được:', toursData);
        if (toursData.length === 0) {
          console.warn('Không có dữ liệu tours từ backend, sử dụng mock data');
          setTours(mockTours);
        } else {
          setTours(toursData);
        }
      } else {
        console.warn('Lỗi lấy dữ liệu:', response.message);
        console.warn('Response status:', response.status);
        console.warn('Response error:', response.error);
        setError(response.message || 'Không thể lấy dữ liệu tours');
        // Sử dụng mock data làm fallback
        setTours(mockTours);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      console.error('Lỗi catch:', message);
      console.error('Chi tiết lỗi:', err);
      setError(message);
      // Sử dụng mock data làm fallback
      setTours(mockTours);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTour = () => {
    // TODO: Open create tour modal/dialog
    console.log('Create tour clicked');
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tours</h1>
            <p className="text-slate-500 mt-2">Manage all your tours and packages</p>
          </div>
          <Button
            onClick={handleCreateTour}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Tour
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
            ⏳ Đang tải dữ liệu tours...
          </p>
        </div>
      )}

      {/* Tours Table */}
      <div>
        <TourTable tours={tours} isLoading={isLoading} />
      </div>
    </DashboardLayout>
  );
}

// Mock data as fallback
const mockTours: Tour[] = [
  {
    id: '1',
    name: 'Bali Beach Paradise',
    destination: 'Bali, Indonesia',
    image: 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=400&h=300&fit=crop',
    status: 'Active',
    startDate: 'Mar 15, 2024',
    duration: '7 days',
    capacity: 30,
    booked: 24,
    price: 1299,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Paris City Tour',
    destination: 'Paris, France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop',
    status: 'Active',
    startDate: 'Mar 20, 2024',
    duration: '5 days',
    capacity: 25,
    booked: 22,
    price: 1599,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '3',
    name: 'Tokyo Adventure',
    destination: 'Tokyo, Japan',
    image: 'https://images.unsplash.com/photo-1540959375944-7049f642e9a4?w=400&h=300&fit=crop',
    status: 'Pending',
    startDate: 'Apr 10, 2024',
    duration: '8 days',
    capacity: 35,
    booked: 18,
    price: 1899,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '4',
    name: 'New York Explorer',
    destination: 'New York, USA',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop',
    status: 'Active',
    startDate: 'Mar 25, 2024',
    duration: '4 days',
    capacity: 40,
    booked: 35,
    price: 999,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '5',
    name: 'Safari Expedition',
    destination: 'Kenya, Africa',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=300&fit=crop',
    status: 'Completed',
    startDate: 'Feb 28, 2024',
    duration: '6 days',
    capacity: 20,
    booked: 20,
    price: 2499,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];
