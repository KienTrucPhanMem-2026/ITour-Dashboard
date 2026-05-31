'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, Star, Search, Plus } from 'lucide-react';
import { User } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface CustomerTableProps {
  customers: User[];
  onEdit?: (customerId: string) => void;
  onViewBookings?: (customerId: string) => void;
  onDelete?: (customerId: string) => void;
  isLoading?: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onAddCustomer?: () => void;
}

function StatusBadge({ status }: { status: User['status'] }) {
  const styles = {
    Active: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    Inactive: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
    Suspended: 'bg-red-100 text-red-700 hover:bg-red-100',
  };

  return (
    <Badge variant="outline" className={`${styles[status]} border-0 font-semibold rounded-lg px-2 py-0.5 text-xs`}>
      {status === 'Active' ? 'Hoạt động' : status === 'Inactive' ? 'Không hoạt động' : 'Tạm khóa'}
    </Badge>
  );
}

export function CustomerTable({
  customers,
  onEdit,
  onViewBookings,
  onDelete,
  isLoading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAddCustomer
}: CustomerTableProps) {

  // Helper to extract initials from customer name
  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return (first + last).toUpperCase();
  };

  // Helper to generate unique soft pastel colors for initials avatars
  const getAvatarBgColor = (name: string) => {
    const colors = [
      'bg-blue-50 text-blue-700 border-blue-100',
      'bg-emerald-50 text-emerald-700 border-emerald-100',
      'bg-indigo-50 text-indigo-700 border-indigo-100',
      'bg-purple-50 text-purple-700 border-purple-100',
      'bg-pink-50 text-pink-700 border-pink-100',
      'bg-amber-50 text-amber-700 border-amber-100'
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  return (
    <Card className="rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/70 overflow-hidden bg-white">
      {/* self-contained toolbar within card header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all bg-slate-50/50 hover:bg-white"
            />
          </div>
          <div className="w-full sm:w-[160px]">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              title="Lọc theo trạng thái"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Active">Hoạt động</option>
              <option value="Inactive">Không hoạt động</option>
              <option value="Suspended">Tạm khóa</option>
            </select>
          </div>
          <span className="hidden md:inline-flex text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg self-center">
            {customers.length} khách hàng
          </span>
        </div>

        {/* Right Add Button */}
        <Button
          onClick={onAddCustomer}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 text-sm px-4 py-2 h-9 w-full sm:w-auto shadow-md shadow-emerald-100 font-bold active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">Đang tải dữ liệu khách hàng...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm font-medium">Không tìm thấy khách hàng nào</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Khách Hàng</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Liên Hệ</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Địa Chỉ</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Điểm Tích Lũy</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng Thái</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition-colors">
                  {/* Customer Info (Avatar + Name) */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 rounded-full font-bold border">
                        <AvatarImage src={customer.profileImage} alt={customer.name} />
                        <AvatarFallback className={`${getAvatarBgColor(customer.name)} uppercase text-xs font-extrabold`}>
                          {getInitials(customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-slate-900 text-sm">{customer.name}</p>
                    </div>
                  </td>

                  {/* Email & Phone merged */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-slate-900">{customer.email || 'N/A'}</span>
                      <span className="text-xs text-slate-500 font-medium">{customer.phone || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Address */}
                  <td className="px-6 py-4">
                    {customer.address ? (
                      <span className="text-sm font-medium text-slate-700">{customer.address}</span>
                    ) : (
                      <span className="text-sm font-medium text-slate-400 italic">N/A</span>
                    )}
                  </td>

                  {/* Points Tag */}
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/50 rounded-xl text-xs font-black shadow-sm shadow-amber-50/60">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{customer.point || 0} pts</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={customer.status} />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-xl hover:bg-slate-50 border-slate-200/80 active:scale-95 transition-all"
                        title="Xem chi tiết"
                        onClick={() => onEdit?.(customer.id)}
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-slate-100">
                            <MoreHorizontal className="w-4 h-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200/80 shadow-md">
                          <DropdownMenuItem onClick={() => onEdit?.(customer.id)} className="rounded-lg text-slate-700 font-medium">
                            Chỉnh Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewBookings?.(customer.id)} className="rounded-lg text-slate-700 font-medium">
                            Xem Đặt Chỗ
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 rounded-lg font-medium" onClick={() => onDelete?.(customer.id)}>
                            Vô hiệu hoá
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {customers.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <p className="text-xs text-slate-500">Hiển thị {customers.length} khách hàng</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold" disabled>
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
