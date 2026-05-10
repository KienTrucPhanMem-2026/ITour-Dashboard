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
import type { Staff } from '@/services/managerService';

interface StaffTableProps {
  staffList: Staff[];
  staffType: 'manager' | 'tourguide' | 'consultant';
  onEdit?: (staffId: string) => void;
  onDelete?: (staffId: string) => void;
  isLoading?: boolean;
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  const styles = isActive
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-slate-100 text-slate-700';

  return (
    <Badge variant="outline" className={`${styles} border-0 font-semibold`}>
      {isActive ? 'Hoạt động' : 'Không hoạt động'}
    </Badge>
  );
}

const staffTypeLabels = {
  manager: 'Quản lý',
  tourguide: 'Hướng dẫn viên',
  consultant: 'Tư vấn viên',
};

export function StaffTable({ staffList, staffType, onEdit, onDelete, isLoading }: StaffTableProps) {
  return (
    <Card className="rounded-3xl border-0 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">Quản Lý {staffTypeLabels[staffType]}</h2>
        <p className="text-sm text-slate-500 mt-1">Tổng số: {staffList.length}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">Đang tải dữ liệu...</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">Không có dữ liệu</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Tên Nhân Sự</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Điện Thoại</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Địa Chỉ</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Ngày Sinh</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Trạng Thái</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr key={staff.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  {/* Name */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{staff.fullName}</p>
                    <p className="text-xs text-slate-500">{staff.userName}</p>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{staff.email || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{staff.phone || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Address */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium">{staff.address || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Date of Birth */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {staff.dateOfBirth 
                        ? new Date(staff.dateOfBirth).toLocaleDateString('vi-VN')
                        : 'N/A'
                      }
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge isActive={staff.isActive} />
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
                        <DropdownMenuItem onClick={() => onEdit?.(staff.id)}>
                          Chỉnh Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete?.(staff.id)}>
                          Ngừng hoạt động
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
      {staffList.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">Hiển thị {staffList.length} nhân sự</p>
        </div>
      )}
    </Card>
  );
}
