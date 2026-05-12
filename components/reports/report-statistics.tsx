'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Users, BookOpen, DollarSign } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { LucideIcon } from 'lucide-react';
import { reportService } from '@/services/reportService';

interface ReportStatisticsProps {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  isLoading: boolean;
}

interface StatItem {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend: string;
  color: string;
}

export function ReportStatistics({ dateRange, isLoading }: ReportStatisticsProps) {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalTours: 0,
    totalCustomers: 0,
    bookingGrowth: '+0%',
    revenueGrowth: '+0%',
    tourGrowth: '+0%',
    customerGrowth: '+0%',
  });

  const daysInRange = dateRange.startDate && dateRange.endDate
    ? differenceInDays(dateRange.endDate, dateRange.startDate) + 1
    : 0;

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!dateRange.startDate || !dateRange.endDate) return;

      try {
        // Fetch data từ các API
        const [bookingsRes, toursRes, customersRes] = await Promise.all([
          reportService.getBookings(),
          reportService.getTours(),
          reportService.getCustomers(),
        ]);

        if (!bookingsRes.success || !toursRes.success || !customersRes.success) {
          console.error('Failed to fetch data');
          return;
        }

        const bookingsData = bookingsRes.data || [];
        const toursData = toursRes.data || [];
        const customersData = customersRes.data || [];

        // Filter theo date range
        const filteredBookings = reportService.filterBookingsByDateRange(
          bookingsData,
          dateRange.startDate,
          dateRange.endDate
        );

        const filteredTours = reportService.filterToursByDateRange(
          toursData,
          dateRange.startDate,
          dateRange.endDate
        );

        // Calculate statistics
        const calculatedStats = reportService.calculateStatistics(
          filteredBookings,
          filteredTours,
          customersData
        );

        setStats(calculatedStats);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      }
    };

    fetchStatistics();
  }, [dateRange]);

  const colorClasses: { [key: string]: string } = {
    '#10b981': 'bg-emerald-50',
    '#3b82f6': 'bg-blue-50',
    '#f59e0b': 'bg-amber-50',
    '#8b5cf6': 'bg-purple-50',
  };

  const iconColorClasses: { [key: string]: string } = {
    '#10b981': 'text-emerald-600',
    '#3b82f6': 'text-blue-600',
    '#f59e0b': 'text-amber-600',
    '#8b5cf6': 'text-purple-600',
  };

  const statItems: StatItem[] = [
    {
      title: 'Tổng đặt tour',
      value: stats.totalBookings,
      icon: BookOpen,
      trend: stats.bookingGrowth,
      color: '#10b981',
    },
    {
      title: 'Doanh thu',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      trend: stats.revenueGrowth,
      color: '#3b82f6',
    },
    {
      title: 'Số tour',
      value: stats.totalTours,
      icon: TrendingUp,
      trend: stats.tourGrowth,
      color: '#f59e0b',
    },
    {
      title: 'Khách hàng mới',
      value: stats.totalCustomers,
      icon: Users,
      trend: stats.customerGrowth,
      color: '#8b5cf6',
    },
  ];

  const dateRangeText = dateRange.startDate && dateRange.endDate
    ? `${format(dateRange.startDate, 'dd/MM/yyyy')} - ${format(dateRange.endDate, 'dd/MM/yyyy')} (${daysInRange} ngày)`
    : 'Chọn khoảng thời gian';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Thống kê tổng hợp</h2>
        <p className="text-sm text-slate-500">{dateRangeText}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((stat) => (
          <StatCard key={stat.title} stat={stat} isLoading={isLoading} colorClasses={colorClasses} iconColorClasses={iconColorClasses} />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  stat,
  isLoading,
  colorClasses,
  iconColorClasses,
}: {
  stat: StatItem;
  isLoading: boolean;
  colorClasses: { [key: string]: string };
  iconColorClasses: { [key: string]: string };
}) {
  const Icon = stat.icon;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
            {stat.title}
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {isLoading ? '---' : stat.value}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[stat.color]}`}>
          <Icon className={`w-5 h-5 ${iconColorClasses[stat.color]}`} />
        </div>
      </div>
      <div className="text-xs font-medium text-emerald-600">
        {stat.trend}
      </div>
    </Card>
  );
}
