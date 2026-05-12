'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { reportService } from '@/services/reportService';

interface RevenueReportProps {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  isLoading: boolean;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  bookings: number;
  customers: number;
}

export function RevenueReport({ dateRange, isLoading }: RevenueReportProps) {
  const [chartData, setChartData] = useState<DailyRevenue[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageRevenue, setAverageRevenue] = useState(0);
  const [maxRevenue, setMaxRevenue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!dateRange.startDate || !dateRange.endDate) return;

      setLoading(true);
      try {
        const response = await reportService.getBookings();

        if (!response.success) {
          console.error('Failed to fetch bookings');
          setLoading(false);
          return;
        }

        const allBookings = response.data || [];

        // Filter by date range
        const filteredBookings = reportService.filterBookingsByDateRange(
          allBookings,
          dateRange.startDate,
          dateRange.endDate
        );

        // Calculate daily revenue
        const dailyData = reportService.calculateDailyRevenue(filteredBookings);

        setChartData(dailyData);

        const total = dailyData.reduce((sum, item) => sum + item.revenue, 0);
        setTotalRevenue(total);
        setAverageRevenue(Math.round(total / (dailyData.length || 1)));

        const max = Math.max(...dailyData.map(item => item.revenue), 0);
        setMaxRevenue(max);
      } catch (error) {
        console.error('Failed to fetch revenue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [dateRange]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-slate-500 mb-1">Tổng doanh thu</p>
          {loading || isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold text-slate-900">
              ${totalRevenue.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-2">
            {chartData.length} ngày
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-slate-500 mb-1">Doanh thu trung bình/ngày</p>
          {loading || isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold text-slate-900">
              ${averageRevenue.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-2">Trên {chartData.length} ngày</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-slate-500 mb-1">Doanh thu cao nhất</p>
          {loading || isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold text-slate-900">
              ${maxRevenue.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-2">Trong một ngày</p>
        </Card>
      </div>

      {/* Line Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Xu hướng doanh thu</h3>
        {loading || isLoading ? (
          <Skeleton className="h-80 w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-slate-500">
            Không có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={(value) => [`$${value.toLocaleString()}`, 'Doanh thu']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Doanh thu"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Bar Chart - Bookings vs Customers */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Đặt tour và khách hàng mỗi ngày
        </h3>
        {loading || isLoading ? (
          <Skeleton className="h-80 w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-slate-500">
            Không có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar
                dataKey="bookings"
                fill="#10b981"
                name="Đặt tour"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="customers"
                fill="#f59e0b"
                name="Khách hàng"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
