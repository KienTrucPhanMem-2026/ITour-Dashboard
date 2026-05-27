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
import { Account } from '@/types';

interface AccountTableProps {
  accounts: Account[];
  onStatusChange?: (accountId: string, isActive: boolean) => void;
  onEdit?: (account: Account) => void;
  onDelete?: (accountId: string) => void;
  isLoading?: boolean;
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={`${
        isActive
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-700'
      } border-0 font-semibold`}
    >
      {isActive ? 'Hoạt động' : 'Không hoạt động'}
    </Badge>
  );
}

function RoleBadge({ role }: { role: string }) {
  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    TOURGUIDE: 'bg-purple-100 text-purple-700',
    CONSULTANT: 'bg-cyan-100 text-cyan-700',
    TOURPLANNER: 'bg-orange-100 text-orange-700',
    USER: 'bg-slate-100 text-slate-700',
    CUSTOMER: 'bg-emerald-100 text-emerald-700',
  };

  const roleLabel: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    MANAGER: 'Quản lý',
    TOURGUIDE: 'Hướng dẫn viên',
    CONSULTANT: 'Tư vấn viên',
    TOURPLANNER: 'Lịch trình viên',
    USER: 'Người dùng',
    CUSTOMER: 'Khách hàng',
  };

  return (
    <Badge
      variant="outline"
      className={`${roleColors[role] || roleColors.USER} border-0 text-xs font-semibold`}
    >
      {roleLabel[role] || role}
    </Badge>
  );
}

export function AccountTable({
  accounts,
  onStatusChange,
  onEdit,
  onDelete,
  isLoading,
}: AccountTableProps) {
  return (
    <Card className="rounded-3xl border-0 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">Danh Sách Tài Khoản</h2>
        <p className="text-sm text-slate-500 mt-1">Quản lý toàn bộ tài khoản người dùng</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">Đang tải tài khoản...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">Không có tài khoản nào</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">
                  Tên Người Dùng
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">
                  Họ Tên
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">
                  Điện Thoại
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">
                  Vai Trò
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">
                  Trạng Thái
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr
                  key={account.id}
                  className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Username */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{account.userName}</p>
                  </td>

                  {/* Full Name */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900">{account.fullName}</p>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <a
                        href={`mailto:${account.email}`}
                        className="text-sm text-slate-600 hover:text-emerald-600 truncate"
                      >
                        {account.email}
                      </a>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {account.phone ? (
                        <>
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{account.phone}</span>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">N/A</span>
                      )}
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <RoleBadge role={account.role} />
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge isActive={account.isActive} />
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
                        <DropdownMenuItem onClick={() => onEdit?.(account)}>
                          Xem Chi Tiết
                        </DropdownMenuItem>
                        {account.isActive ? (
                          <DropdownMenuItem
                            onClick={() => onStatusChange?.(account.id, false)}
                            className="text-amber-600"
                          >
                            Vô Hiệu Hóa
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => onStatusChange?.(account.id, true)}
                            className="text-emerald-600"
                          >
                            Kích Hoạt
                          </DropdownMenuItem>
                        )}
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
      {accounts.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">Hiển thị {accounts.length} tài khoản</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" disabled>
              Trước
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" disabled>
              Sau
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
