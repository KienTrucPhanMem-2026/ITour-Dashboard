'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatCard } from '@/components/dashboard/stat-card';
import { TourTable } from '@/components/dashboard/tour-table';
import { TrendingUp, MapPin, Bookmark, Users } from 'lucide-react';
import { reportService } from '@/services/reportService';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTours: 0,
    totalBookings: 0,
    totalCustomers: 0,
  });
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [toursChart, setToursChart] = useState<any[]>([]);
  const [bookingsChart, setBookingsChart] = useState<any[]>([]);
  const [customersChart, setCustomersChart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [bookingsRes, toursRes, customersRes] = await Promise.all([
          reportService.getBookings(),
          reportService.getTours(),
          reportService.getCustomers(),
        ]);

        let bookingsList: any[] = [];
        let toursList: any[] = [];
        let customersList: any[] = [];

        if (bookingsRes.success && Array.isArray(bookingsRes.data)) {
          bookingsList = bookingsRes.data;
        }
        if (toursRes.success && Array.isArray(toursRes.data)) {
          toursList = toursRes.data;
        }
        if (customersRes.success && Array.isArray(customersRes.data)) {
          customersList = customersRes.data;
        } else if (customersRes.success && customersRes.data && Array.isArray((customersRes.data as any).content)) {
          customersList = (customersRes.data as any).content;
        }

        const calculated = reportService.calculateStatistics(
          bookingsList,
          toursList,
          customersList
        );

        setStats({
          totalRevenue: calculated.totalRevenue,
          totalTours: calculated.totalTours,
          totalBookings: calculated.totalBookings,
          totalCustomers: calculated.totalCustomers,
        });

        const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // 1. Monthly Revenue Chart
        const revenueByMonth: Record<string, number> = {};
        bookingsList.forEach(b => {
          const date = new Date(b.bookingDate || b.createdAt || Date.now());
          const month = date.toLocaleString('en-US', { month: 'short' });
          const val = b.finalPrice || b.totalPrice || b.price || 0;
          revenueByMonth[month] = (revenueByMonth[month] || 0) + val;
        });
        const revenueChartData = Object.entries(revenueByMonth)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => monthsOrder.indexOf(a.name) - monthsOrder.indexOf(b.name));
        setRevenueChart(revenueChartData.length > 0 ? revenueChartData : monthsOrder.map(m => ({ name: m, value: 0 })));

        // 2. Tours Chart
        const toursByMonth: Record<string, number> = {};
        toursList.forEach(t => {
          const date = new Date(t.createdAt || Date.now());
          const month = date.toLocaleString('en-US', { month: 'short' });
          toursByMonth[month] = (toursByMonth[month] || 0) + 1;
        });
        const toursChartData = Object.entries(toursByMonth)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => monthsOrder.indexOf(a.name) - monthsOrder.indexOf(b.name));
        setToursChart(toursChartData.length > 0 ? toursChartData : monthsOrder.map(m => ({ name: m, value: 0 })));

        // 3. Bookings Chart
        const bookingsByDay: Record<string, number> = {};
        bookingsList.forEach(b => {
          const date = new Date(b.bookingDate || b.createdAt || Date.now());
          const day = date.toLocaleString('en-US', { weekday: 'short' });
          bookingsByDay[day] = (bookingsByDay[day] || 0) + 1;
        });
        const bookingsChartData = Object.entries(bookingsByDay)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => daysOrder.indexOf(a.name) - daysOrder.indexOf(b.name));
        setBookingsChart(bookingsChartData.length > 0 ? bookingsChartData : daysOrder.map(d => ({ name: d, value: 0 })));

        // 4. Customers Chart
        const customersByDay: Record<string, number> = {};
        customersList.forEach(c => {
          const date = new Date(c.createdAt || Date.now());
          const day = date.toLocaleString('en-US', { weekday: 'short' });
          customersByDay[day] = (customersByDay[day] || 0) + 1;
        });
        const customersChartData = Object.entries(customersByDay)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => daysOrder.indexOf(a.name) - daysOrder.indexOf(b.name));
        setCustomersChart(customersChartData.length > 0 ? customersChartData : daysOrder.map(d => ({ name: d, value: 0 })));

      } catch (err) {
        console.error("Failed to load statistics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-2">Welcome back! Here's your admin tour management overview.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-400 font-semibold text-sm">Đang tải dữ liệu báo cáo từ cơ sở dữ liệu...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-2">Welcome back! Here's your admin tour management overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Doanh thu tổng"
          value={formatCurrency(stats.totalRevenue)}
          change="+12.5%"
          changeType="increase"
          icon={TrendingUp}
          data={revenueChart}
          color="#10b981"
        />
        <StatCard
          title="Tổng số Tour"
          value={String(stats.totalTours)}
          change="+8.2%"
          changeType="increase"
          icon={MapPin}
          data={toursChart}
          color="#3b82f6"
        />
        <StatCard
          title="Đơn đặt mới"
          value={String(stats.totalBookings)}
          change="+5.1%"
          changeType="increase"
          icon={Bookmark}
          data={bookingsChart}
          color="#f59e0b"
        />
        <StatCard
          title="Khách hàng hoạt động"
          value={String(stats.totalCustomers)}
          change="+3.7%"
          changeType="increase"
          icon={Users}
          data={customersChart}
          color="#8b5cf6"
        />
      </div>

      {/* Tour Table */}
      <TourTable />
    </DashboardLayout>
  );
}
