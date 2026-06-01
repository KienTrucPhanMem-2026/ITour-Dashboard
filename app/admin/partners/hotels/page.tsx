'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { ResourceManagerTable } from '@/components/dashboard/resource-manager-table';

export default function HotelsPartnerPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Quản Lý Đối Tác Khách Sạn</h1>
        <p className="text-slate-500 text-sm mt-1">
          Quản lý thông tin liên hệ, vị trí, và giá phòng cơ sở của các đối tác khách sạn trong hệ thống iTour.
        </p>
      </div>

      {/* Main Table CRUD */}
      <ResourceManagerTable
        title="Khách sạn"
        apiEndpoint="/api/hotels"
        type="hotel"
      />
    </DashboardLayout>
  );
}
