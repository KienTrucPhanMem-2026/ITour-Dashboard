'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { reportService } from '@/services/reportService';
import { TrendingUp, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';

interface ReportChartsProps {
  dateRange: { startDate: Date | null; endDate: Date | null };
  tourTypeFilter: string | null;
  onTourTypeSelect: (type: string | null) => void;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  bookings: number;
}

interface DonutData {
  name: string;
  value: number;
  color: string;
}

interface BarData {
  name: string;
  revenue: number;
}

// Custom glassmorphism tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: '14px',
          padding: '10px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="text-sm font-black" style={{ color: entry.color || '#10b981' }}>
            {entry.name === 'revenue' || entry.name === 'Doanh thu'
              ? entry.value.toLocaleString('vi-VN') + ' ₫'
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomDonutTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(226,232,240,0.8)',
          borderRadius: '12px',
          padding: '8px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}
      >
        <p className="text-xs font-bold text-slate-600">{payload[0].name}</p>
        <p className="text-sm font-black text-slate-900">{payload[0].value} booking</p>
        <p className="text-xs text-slate-400">{payload[0].payload.percent}%</p>
      </div>
    );
  }
  return null;
};

const DONUT_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export function ReportCharts({ dateRange, tourTypeFilter, onTourTypeSelect }: ReportChartsProps) {
  const [areaData, setAreaData] = useState<DailyRevenue[]>([]);
  const [donutData, setDonutData] = useState<DonutData[]>([]);
  const [barData, setBarData] = useState<BarData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalInDonut, setTotalInDonut] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange.startDate || !dateRange.endDate) return;
      setLoading(true);
      try {
        const [bookingsRes, toursRes] = await Promise.all([
          reportService.getBookings(),
          reportService.getTours(),
        ]);

        const allBookings = bookingsRes.data || [];
        const allTours = toursRes.data || [];

        const filteredBookings = reportService.filterBookingsByDateRange(
          allBookings,
          dateRange.startDate,
          dateRange.endDate
        );

        // Area Chart Data - daily revenue
        const daily = reportService.calculateDailyRevenue(filteredBookings);
        setAreaData(daily);

        // Donut Chart - booking status breakdown
        const statusCounts: Record<string, number> = {};
        filteredBookings.forEach((b: any) => {
          const rawStatus = (b.status || 'PENDING').toUpperCase();
          let label = 'Chờ xử lý';
          if (rawStatus === 'CONFIRMED') label = 'Đã xác nhận';
          else if (rawStatus === 'COMPLETED') label = 'Hoàn thành';
          else if (rawStatus === 'CANCELLED') label = 'Đã hủy';
          else if (rawStatus === 'AWAITING_PAYMENT') label = 'Chờ thanh toán';
          statusCounts[label] = (statusCounts[label] || 0) + 1;
        });

        const total = filteredBookings.length;
        setTotalInDonut(total);
        const donut: DonutData[] = Object.entries(statusCounts).map(([name, value], idx) => ({
          name,
          value,
          color: DONUT_COLORS[idx % DONUT_COLORS.length],
          percent: total > 0 ? Math.round((value / total) * 100) : 0,
        } as any));
        setDonutData(donut);

        // Horizontal Bar - top tours by revenue
        const tourRevMap: Record<string, { name: string; revenue: number }> = {};
        const tourNameMap = new Map<string, string>(allTours.map((t: any) => [t.id, t.name]));

        filteredBookings.forEach((b: any) => {
          const tId = b.tourId || b.tour;
          const tName = (tId && tourNameMap.get(tId)) || b.tourName || 'Khác';
          const shortName = tName.length > 30 ? tName.substring(0, 28) + '...' : tName;
          if (!tourRevMap[tId || tName]) {
            tourRevMap[tId || tName] = { name: shortName, revenue: 0 };
          }
          tourRevMap[tId || tName].revenue += b.finalPrice || b.totalPrice || 0;
        });

        const topTours = Object.values(tourRevMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 6);
        setBarData(topTours);
      } catch (err) {
        console.error('Failed to fetch chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 p-6 h-80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Đang tải biểu đồ...</p>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 p-6 h-80 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Area Chart + Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Area Chart - 60% */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Xu hướng Doanh thu</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Doanh thu theo ngày trong khoảng lọc</p>
            </div>
          </div>

          {areaData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm font-semibold">
              Không có dữ liệu trong khoảng thời gian này
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={areaData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'T';
                    if (v >= 1_000_000) return (v / 1_000_000).toFixed(0) + 'M';
                    if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
                    return v;
                  }}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut Chart - 40% */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-50 rounded-xl">
              <PieChartIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Cơ cấu Booking</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Phân bổ theo trạng thái</p>
            </div>
          </div>

          {donutData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm font-semibold">
              Không có dữ liệu
            </div>
          ) : (
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(entry: any) => {
                      onTourTypeSelect(tourTypeFilter === entry.name ? null : entry.name);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {donutData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={tourTypeFilter === null || tourTypeFilter === entry.name ? 1 : 0.3}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomDonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-black text-slate-900">{totalInDonut}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">booking</p>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-3 space-y-1.5">
            {donutData.map((item: any, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-semibold">{item.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-black text-slate-900">{item.value}</span>
                  <span className="text-slate-400">({item.percent}%)</span>
                </div>
              </div>
            ))}
          </div>

          {tourTypeFilter && (
            <button
              onClick={() => onTourTypeSelect(null)}
              className="mt-3 w-full text-[10px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg py-1.5 transition-all"
            >
              ✕ Bỏ lọc "{tourTypeFilter}"
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Horizontal Bar Chart - Top Tours by Revenue */}
      {barData.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/60 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-amber-50 rounded-xl">
              <BarChart2 className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Top Tour theo Doanh thu</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">6 tour mang lại doanh thu cao nhất trong kỳ</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
            >
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                stroke="#94a3b8"
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + ' tỷ';
                  if (v >= 1_000_000) return (v / 1_000_000).toFixed(0) + ' tr';
                  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
                  return v;
                }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                stroke="#94a3b8"
                tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Doanh thu" fill="url(#barGrad)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
