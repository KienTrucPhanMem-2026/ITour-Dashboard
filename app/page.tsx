'use client';

import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatCard } from '@/components/dashboard/stat-card';
import { TourTable } from '@/components/dashboard/tour-table';
import { TrendingUp, MapPin, Bookmark, Users } from 'lucide-react';

// Mock data for charts
const revenueData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
];

const toursData = [
  { name: 'Week 1', value: 10 },
  { name: 'Week 2', value: 15 },
  { name: 'Week 3', value: 12 },
  { name: 'Week 4', value: 18 },
  { name: 'Week 5', value: 22 },
  { name: 'Week 6', value: 25 },
];

const bookingsData = [
  { name: 'Mon', value: 12 },
  { name: 'Tue', value: 19 },
  { name: 'Wed', value: 15 },
  { name: 'Thu', value: 25 },
  { name: 'Fri', value: 22 },
  { name: 'Sat', value: 30 },
];

const usersData = [
  { name: 'Mon', value: 8 },
  { name: 'Tue', value: 12 },
  { name: 'Wed', value: 10 },
  { name: 'Thu', value: 16 },
  { name: 'Fri', value: 14 },
  { name: 'Sat', value: 18 },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-2">Welcome back! Here's your tour management overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value="$24,580"
          change="12.5%"
          changeType="increase"
          icon={TrendingUp}
          data={revenueData}
          color="#10b981"
        />
        <StatCard
          title="Total Tours"
          value="48"
          change="8.2%"
          changeType="increase"
          icon={MapPin}
          data={toursData}
          color="#3b82f6"
        />
        <StatCard
          title="New Bookings"
          value="234"
          change="5.1%"
          changeType="increase"
          icon={Bookmark}
          data={bookingsData}
          color="#f59e0b"
        />
        <StatCard
          title="Active Users"
          value="1,248"
          change="3.7%"
          changeType="decrease"
          icon={Users}
          data={usersData}
          color="#8b5cf6"
        />
      </div>

      {/* Tour Table */}
      <TourTable />
    </DashboardLayout>
  );
}
