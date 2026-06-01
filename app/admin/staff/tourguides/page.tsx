'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StaffTable } from '@/components/dashboard/staff-table';

export default function TourGuidesPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Hướng Dẫn Viên</h1>
        <p className="text-slate-500 text-sm mt-1">
          Xem và quản lý hồ sơ nghiệp vụ, lịch trình dẫn tour, tài liệu của các hướng dẫn viên du lịch
        </p>
      </div>

      {/* Shared Staff Table Factory */}
      <StaffTable
        staffType="tourguide"
        title="Hướng Dẫn Viên"
      />
    </DashboardLayout>
  );
}
