'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Shield, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function StaffPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản Lý Nhân Sự</h1>
          <p className="text-slate-500 mt-2">Quản lý toàn bộ nhân sự trong hệ thống</p>
        </div>
      </div>

      {/* Staff Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Managers */}
        <Link href="/staff/managers">
          <Card className="rounded-3xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="p-6 flex flex-col items-center text-center h-full justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Quản Lý</h3>
              <p className="text-sm text-slate-500 mb-4">
                Quản lý danh sách các quản lý điều hành
              </p>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-full">
                Xem Chi Tiết →
              </Button>
            </div>
          </Card>
        </Link>

        {/* Tour Guides */}
        <Link href="/staff/tourguides">
          <Card className="rounded-3xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="p-6 flex flex-col items-center text-center h-full justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Hướng Dẫn Viên</h3>
              <p className="text-sm text-slate-500 mb-4">
                Quản lý danh sách các hướng dẫn viên du lịch
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-full">
                Xem Chi Tiết →
              </Button>
            </div>
          </Card>
        </Link>

        {/* Consultants */}
        <Link href="/staff/consultants">
          <Card className="rounded-3xl border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="p-6 flex flex-col items-center text-center h-full justify-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Tư Vấn Viên</h3>
              <p className="text-sm text-slate-500 mb-4">
                Quản lý danh sách các tư vấn viên tư vấn
              </p>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-full">
                Xem Chi Tiết →
              </Button>
            </div>
          </Card>
        </Link>
      </div>
    </DashboardLayout>
  );
}
