'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { DateRangeFilter } from '@/components/reports/date-range-filter';
import { ReportStatistics } from '@/components/reports/report-statistics';
import { BookingReport } from '@/components/reports/booking-report';
import { TourReport } from '@/components/reports/tour-report';
import { RevenueReport } from '@/components/reports/revenue-report';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleDateRangeChange = (startDate: Date | null, endDate: Date | null) => {
    setDateRange({ startDate, endDate });
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting report...');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Báo Cáo & Thống Kê</h1>
            <p className="text-sm text-slate-500 mt-1">Quản lý và phân tích dữ liệu kinh doanh</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Report Statistics */}
        <ReportStatistics
          dateRange={dateRange}
          isLoading={isLoading}
        />

        {/* Detailed Reports */}
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="bookings">Đặt Tour</TabsTrigger>
            <TabsTrigger value="tours">Tour Du Lịch</TabsTrigger>
            <TabsTrigger value="revenue">Doanh Thu</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <BookingReport dateRange={dateRange} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="tours" className="space-y-4">
            <TourReport dateRange={dateRange} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <RevenueReport dateRange={dateRange} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
