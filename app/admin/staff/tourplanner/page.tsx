'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StaffTable } from '@/components/dashboard/staff-table';

export default function TourPlannersPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Thiết Kế Tour</h1>
        <p className="text-slate-500 text-sm mt-1">
          Xem và quản lý hồ sơ nghiệp vụ, số lượng tour đã thiết kế và phân bổ công việc của các điều hành viên Tour Planner
        </p>
      </div>

      {/* Shared Staff Table Factory */}
      <StaffTable
        staffType="tourplanner"
        title="Tour Planner"
      />
    </DashboardLayout>
  );
}
