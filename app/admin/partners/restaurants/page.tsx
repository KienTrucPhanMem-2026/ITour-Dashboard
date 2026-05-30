'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { ResourceManagerTable } from '@/components/dashboard/resource-manager-table';

export default function RestaurantsPartnerPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Quản Lý Đối Tác Nhà Hàng</h1>
        <p className="text-slate-500 text-sm mt-1">
          Thiết lập danh sách nhà hàng đối tác, địa chỉ chi tiết, và giá trung bình trên từng suất ăn (Pax) phục vụ đoàn.
        </p>
      </div>

      {/* Main Table CRUD */}
      <ResourceManagerTable
        title="Nhà hàng"
        apiEndpoint="/api/restaurants"
        type="restaurant"
      />
    </DashboardLayout>
  );
}
