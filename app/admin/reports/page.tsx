'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { ReportStatistics } from '@/components/reports/report-statistics';
import { ReportCharts } from '@/components/reports/report-charts';
import { BookingReport } from '@/components/reports/booking-report';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, BarChart3 } from 'lucide-react';
import { DatePicker, Radio } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

type QuickRange = '7d' | '30d' | 'month' | 'year';

function getDateRange(preset: QuickRange): { startDate: Date; endDate: Date } {
  const now = new Date();
  switch (preset) {
    case '7d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: now };
    }
    case '30d': {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: now };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, endDate: now };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start, endDate: now };
    }
  }
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>(
    getDateRange('month')
  );
  const [quickRange, setQuickRange] = useState<QuickRange>('month');
  const [isLoading, setIsLoading] = useState(false);
  const [tourTypeFilter, setTourTypeFilter] = useState<string | null>(null);

  const handleQuickRange = (preset: QuickRange) => {
    setQuickRange(preset);
    setDateRange(getDateRange(preset));
    setTourTypeFilter(null);
  };

  const handleRangePicker = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange({
        startDate: dates[0].toDate(),
        endDate: dates[1].toDate(),
      });
      setQuickRange('' as any); // deselect radio
      setTourTypeFilter(null);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 600);
  };

  const handleExport = () => {
    // TODO: Implement Excel/PDF export
    console.log('Exporting report...');
  };

  const rangePickerValue: [Dayjs | null, Dayjs | null] = [
    dateRange.startDate ? dayjs(dateRange.startDate) : null,
    dateRange.endDate ? dayjs(dateRange.endDate) : null,
  ];

  return (
    <DashboardLayout>
      <div className="space-y-7">
        {/* ─── Header + Toolbar ─── */}
        <div className="flex flex-col gap-4">
          {/* Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">Báo Cáo & Thống Kê</h1>
              </div>
              <p className="text-sm text-slate-500 ml-11">Phân tích dữ liệu kinh doanh theo thời gian thực</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl border-slate-200 font-bold text-slate-600 h-9 active:scale-95 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-1.5 rounded-xl border-slate-200 font-bold text-slate-600 h-9 active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Xuất báo cáo
              </Button>
            </div>
          </div>

          {/* ── Compact Toolbar ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
            {/* Quick Range Radio */}
            <Radio.Group
              value={quickRange}
              onChange={(e) => handleQuickRange(e.target.value)}
              buttonStyle="solid"
              className="shrink-0"
              size="small"
            >
              <Radio.Button value="7d" className="!rounded-l-xl !font-bold !text-xs">7 Ngày</Radio.Button>
              <Radio.Button value="30d" className="!font-bold !text-xs">30 Ngày</Radio.Button>
              <Radio.Button value="month" className="!font-bold !text-xs">Tháng này</Radio.Button>
              <Radio.Button value="year" className="!rounded-r-xl !font-bold !text-xs">Năm nay</Radio.Button>
            </Radio.Group>

            {/* Divider */}
            <div className="hidden sm:block w-px h-6 bg-slate-200 shrink-0" />

            {/* Range Picker */}
            <RangePicker
              value={rangePickerValue}
              onChange={handleRangePicker}
              placeholder={['Từ ngày', 'Đến ngày']}
              format="DD/MM/YYYY"
              className="h-8 rounded-xl border-slate-200 text-sm font-semibold hover:border-emerald-400 focus:border-emerald-500 transition-all"
              style={{ minWidth: 240 }}
            />

            {/* Clear filter badge */}
            {tourTypeFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-full border border-blue-200">
                🔍 Lọc: {tourTypeFilter}
                <button onClick={() => setTourTypeFilter(null)} className="ml-1 text-blue-400 hover:text-blue-600">✕</button>
              </span>
            )}
          </div>
        </div>

        {/* ─── KPI Cards ─── */}
        <ReportStatistics dateRange={dateRange} isLoading={isLoading} />

        {/* ─── Charts Row ─── */}
        <ReportCharts
          dateRange={dateRange}
          tourTypeFilter={tourTypeFilter}
          onTourTypeSelect={setTourTypeFilter}
        />

        {/* ─── Booking Table ─── */}
        <BookingReport
          dateRange={dateRange}
          isLoading={isLoading}
          statusFilter={tourTypeFilter}
        />
      </div>
    </DashboardLayout>
  );
}
