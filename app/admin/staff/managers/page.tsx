'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StaffTable } from '@/components/dashboard/staff-table';

export default function ManagersPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Ban Điều Hành</h1>
        <p className="text-slate-500 text-sm mt-1">
          Xem và quản lý thông tin tài khoản ban quản lý cấp cao điều phối toàn bộ tài nguyên hệ thống
        </p>
      </div>

      {/* Shared Staff Table Factory */}
      <StaffTable
        staffType="manager"
        title="Quản Lý"
      />
    </DashboardLayout>
  );
}
