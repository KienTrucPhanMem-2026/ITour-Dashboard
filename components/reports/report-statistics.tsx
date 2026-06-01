'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  DollarSign,
  MapPin,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { reportService } from '@/services/reportService';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface ReportStatisticsProps {
  dateRange: { startDate: Date | null; endDate: Date | null };
  isLoading: boolean;
}

interface SparkPoint {
  v: number;
}

// Generate sparkline from array of bookings grouped by day
function buildSparkline(dailyData: { revenue: number; bookings: number }[], key: 'revenue' | 'bookings'): SparkPoint[] {
  if (dailyData.length === 0) return Array.from({ length: 7 }, () => ({ v: 0 }));
  const slice = dailyData.slice(-10);
  return slice.map((d) => ({ v: d[key] }));
}

function TrendPill({ trend, comparedTo }: { trend: string; comparedTo?: string }) {
  const isPositive = trend.startsWith('+') || (parseFloat(trend) > 0);
  const isNeutral = trend === '+0%' || trend === '0%';

  if (isNeutral) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-500">
          — {trend}
        </span>
        {comparedTo && <span className="text-[10px] text-slate-400 font-medium">{comparedTo}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      <span
        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
          isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
        }`}
      >
        {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
        {trend}
      </span>
      {comparedTo && <span className="text-[10px] text-slate-400 font-medium">{comparedTo}</span>}
    </div>
  );
}

function Sparkline({ data, color }: { data: SparkPoint[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={true}
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  );
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
  const [sparklines, setSparklines] = useState<{
    revenue: SparkPoint[];
    bookings: SparkPoint[];
  }>({ revenue: [], bookings: [] });
  const [innerLoading, setInnerLoading] = useState(false);

  const daysInRange =
    dateRange.startDate && dateRange.endDate
      ? differenceInDays(dateRange.endDate, dateRange.startDate) + 1
      : 0;

  const dateRangeText =
    dateRange.startDate && dateRange.endDate
      ? `${format(dateRange.startDate, 'dd/MM/yyyy')} – ${format(dateRange.endDate, 'dd/MM/yyyy')} · ${daysInRange} ngày`
      : 'Chọn khoảng thời gian';

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!dateRange.startDate || !dateRange.endDate) return;
      setInnerLoading(true);
      try {
        const [bookingsRes, toursRes, customersRes] = await Promise.all([
          reportService.getBookings(),
          reportService.getTours(),
          reportService.getCustomers(),
        ]);

        const bookingsData = bookingsRes.data || [];
        const toursData = toursRes.data || [];
        const customersData = customersRes.data || [];

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

        const calculatedStats = reportService.calculateStatistics(
          filteredBookings,
          filteredTours,
          customersData
        );
        setStats(calculatedStats);

        // Build sparklines from daily revenue
        const daily = reportService.calculateDailyRevenue(filteredBookings);
        setSparklines({
          revenue: buildSparkline(daily, 'revenue'),
          bookings: buildSparkline(daily, 'bookings'),
        });
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      } finally {
        setInnerLoading(false);
      }
    };
    fetchStatistics();
  }, [dateRange]);

  const loading = isLoading || innerLoading;

  const formatVND = (value: number) =>
    value.toLocaleString('vi-VN') + ' ₫';

  const kpiCards = [
    {
      title: 'Tổng Đặt Tour',
      value: stats.totalBookings,
      displayValue: loading ? '—' : String(stats.totalBookings),
      icon: BookOpen,
      trend: stats.bookingGrowth,
      color: 'emerald',
      sparkColor: '#10b981',
      sparkData: sparklines.bookings,
      bgFrom: 'from-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
    },
    {
      title: 'Doanh Thu',
      value: stats.totalRevenue,
      displayValue: loading ? '—' : formatVND(stats.totalRevenue),
      icon: DollarSign,
      trend: stats.revenueGrowth,
      color: 'blue',
      sparkColor: '#3b82f6',
      sparkData: sparklines.revenue,
      bgFrom: 'from-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
    },
    {
      title: 'Số Tour Đang Chạy',
      value: stats.totalTours,
      displayValue: loading ? '—' : String(stats.totalTours),
      icon: MapPin,
      trend: stats.tourGrowth,
      color: 'amber',
      sparkColor: '#f59e0b',
      sparkData: sparklines.bookings,
      bgFrom: 'from-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
    },
    {
      title: 'Khách Hàng Mới',
      value: stats.totalCustomers,
      displayValue: loading ? '—' : String(stats.totalCustomers),
      icon: Users,
      trend: stats.customerGrowth,
      color: 'purple',
      sparkColor: '#8b5cf6',
      sparkData: sparklines.bookings,
      bgFrom: 'from-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-700',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Chỉ số Tổng hợp</h2>
        <p className="text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1 rounded-full">{dateRangeText}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5"
              style={{
                boxShadow:
                  '0 4px 24px -4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              {/* Top row: icon + trend */}
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-2xl ${card.iconBg} shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
                </div>
                {loading ? (
                  <div className="w-14 h-5 bg-slate-100 rounded-full animate-pulse" />
                ) : (
                  <TrendPill trend={card.trend} comparedTo="vs tháng trước" />
                )}
              </div>

              {/* Value */}
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{card.title}</p>
              {loading ? (
                <div className="w-28 h-7 bg-slate-100 rounded-xl animate-pulse" />
              ) : (
                <p className="text-2xl font-black text-slate-900 leading-none">{card.displayValue}</p>
              )}

              {/* Sparkline */}
              <div className="mt-3 -mx-1 opacity-70">
                {!loading && card.sparkData.length > 0 && (
                  <Sparkline data={card.sparkData} color={card.sparkColor} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
