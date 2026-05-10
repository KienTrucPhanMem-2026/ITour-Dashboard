'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Mail, Phone, MapPin } from 'lucide-react';
import { User } from '@/types';

interface CustomerTableProps {
  customers: User[];
  onEdit?: (customerId: string) => void;
  onDelete?: (customerId: string) => void;
  isLoading?: boolean;
}

function StatusBadge({ status }: { status: User['status'] }) {
  const styles = {
    Active: 'bg-emerald-100 text-emerald-700',
    Inactive: 'bg-slate-100 text-slate-700',
    Suspended: 'bg-red-100 text-red-700',
  };

  return (
    <Badge variant="outline" className={`${styles[status]} border-0 font-semibold`}>
      {status}
    </Badge>
  );
}

export function CustomerTable({ customers, onEdit, onDelete, isLoading }: CustomerTableProps) {
  return (
    <Card className="rounded-3xl border-0 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">Quản Lý Khách Hàng</h2>
        <p className="text-sm text-slate-500 mt-1">Tổng số khách hàng: {customers.length}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">Đang tải dữ liệu...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">No customers found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Tên Khách Hàng</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Điện Thoại</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Địa Chỉ</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Điểm</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Trạng Thái</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  {/* Name */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{customer.name}</p>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{customer.email || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{customer.phone || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Address */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium">{customer.address || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Point */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-900">{customer.totalBookings}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={customer.status} />
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
                        <DropdownMenuItem onClick={() => onEdit?.(customer.id)}>
                          Chỉnh Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem>Xem Đặt Chỗ</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete?.(customer.id)}>
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {customers.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {customers.length} customers</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" disabled>
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
