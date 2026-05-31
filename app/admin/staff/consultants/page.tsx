'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StaffTable } from '@/components/dashboard/staff-table';

export default function ConsultantsPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Tư Vấn Viên</h1>
        <p className="text-slate-500 text-sm mt-1">
          Xem và quản lý hồ sơ chăm sóc khách hàng, doanh số và các đơn đặt tour đã chốt của tư vấn viên
        </p>
      </div>

      {/* Shared Staff Table Factory */}
      <StaffTable
        staffType="consultant"
        title="Tư Vấn Viên"
      />
    </DashboardLayout>
  );
}
