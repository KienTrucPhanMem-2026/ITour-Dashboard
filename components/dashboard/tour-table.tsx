'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, MapPin, Users, Calendar } from 'lucide-react';
import { Tour } from '@/types';

interface TourTableProps {
  tours?: Tour[];
  isLoading?: boolean;
}

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
];

function StatusBadge({ status }: { status: Tour['status'] }) {
  const styles: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-amber-100 text-amber-700',
    Completed: 'bg-slate-100 text-slate-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
}

export function TourTable({ tours = mockTours, isLoading = false }: TourTableProps) {
  if (isLoading) {
    return (
      <Card className="rounded-3xl border-0 shadow-sm overflow-hidden">
        <div className="p-6 text-center">
          <p className="text-slate-500">Đang tải dữ liệu...</p>
        </div>
      </Card>
    );
  }

  if (!tours || tours.length === 0) {
    return (
      <Card className="rounded-3xl border-0 shadow-sm overflow-hidden">
        <div className="p-6 text-center">
          <p className="text-slate-500">Không có tours nào</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-0 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">Quản Lý Tour</h2>
        <p className="text-sm text-slate-500 mt-1">Tổng số tours: {tours.length}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Tên Tour</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Điểm Đến</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Trạng Thái</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Ngày Bắt Đầu</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Đặt Chỗ</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Giá</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {tours.map((tour) => (
              <tr key={tour.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                {/* Tour Info */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {tour.image && (
                      <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={tour.image} alt={tour.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{tour.name}</p>
                      <p className="text-xs text-slate-500">{tour.duration || 'N/A'}</p>
                    </div>
                  </div>
                </td>

                {/* Destination */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium">{tour.destination || 'N/A'}</span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <StatusBadge status={tour.status} />
                </td>

                {/* Dates */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">{tour.startDate || 'N/A'}</span>
                  </div>
                </td>

                {/* Booking */}
                <td className="px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">
                        {tour.booked || 0}/{tour.capacity || 0}
                      </span>
                    </div>
                    <div className="w-24 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{
                          width: `${
                            tour.capacity && tour.capacity > 0
                              ? ((tour.booked || 0) / tour.capacity) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </td>

                {/* Price */}
                <td className="px-6 py-4">
                  <span className="font-semibold text-emerald-600">${tour.price}</span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Xem Chi Tiết</DropdownMenuItem>
                      <DropdownMenuItem>Chỉnh Sửa</DropdownMenuItem>
                      <DropdownMenuItem>Xem Đặt Chỗ</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Xóa</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
