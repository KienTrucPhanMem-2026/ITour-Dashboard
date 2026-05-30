'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { ResourceManagerTable } from '@/components/dashboard/resource-manager-table';

export default function ServicesPartnerPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Quản Lý Vé & Tiện Ích</h1>
        <p className="text-slate-500 text-sm mt-1">
          Khai báo các dịch vụ, vé cáp treo, vé cổng tham quan, hoặc các dịch vụ di chuyển trung chuyển của đối tác liên kết.
        </p>
      </div>

      {/* Main Table CRUD */}
      <ResourceManagerTable
        title="Dịch vụ"
        apiEndpoint="/api/services"
        type="service"
      />
    </DashboardLayout>
  );
}
