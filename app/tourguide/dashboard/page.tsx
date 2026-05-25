"use client";

import { CalendarDays, MapPin, Users, Star, MessageSquareQuote, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import oceanImage from "@/assets/background/ocean.jpg";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useUserStore } from "@/store/user-store";

// Mock data for charts
const completedToursData = [
  { name: 'T1', value: 2 }, { name: 'T2', value: 4 }, { name: 'T3', value: 3 },
  { name: 'T4', value: 5 }, { name: 'T5', value: 4 }, { name: 'T6', value: 0 },
];

const daysOnTourData = [
  { name: 'T1', value: 10 }, { name: 'T2', value: 15 }, { name: 'T3', value: 12 },
  { name: 'T4', value: 18 }, { name: 'T5', value: 14 }, { name: 'T6', value: 0 },
];

const customersServedData = [
  { name: 'T1', value: 45 }, { name: 'T2', value: 80 }, { name: 'T3', value: 65 },
  { name: 'T4', value: 95 }, { name: 'T5', value: 70 }, { name: 'T6', value: 0 },
];

const ratingData = [
  { name: 'T1', value: 4.5 }, { name: 'T2', value: 4.8 }, { name: 'T3', value: 4.7 },
  { name: 'T4', value: 4.9 }, { name: 'T5', value: 4.9 }, { name: 'T6', value: 0 },
];

// This will be populated from API now
// const upcomingToursList = [...];

const recentFeedbacks = [
  { id: 1, customer: 'Nguyễn Văn A', rating: 5, comment: 'HDV nhiệt tình, vui vẻ, xử lý tình huống rất chuyên nghiệp.', tour: 'Phú Quốc 4N3Đ', date: 'Hôm qua' },
  { id: 2, customer: 'Trần Thị B', rating: 5, comment: 'Chuyến đi tuyệt vời! Chắc chắn sẽ book lại công ty.', tour: 'Đà Lạt Mùa Hoa', date: '2 ngày trước' },
  { id: 3, customer: 'Lê Văn C', rating: 4, comment: 'Lịch trình hơi dày nhưng HDV hỗ trợ rất linh hoạt.', tour: 'Nha Trang Biển Gọi', date: 'Tuần trước' },
];

const calendarWeeks = [
  [0, 1, 1, 2, 0, 3, 0], [0, 2, 2, 1, 0, 3, 1], [1, 0, 2, 3, 1, 0, 2], [0, 1, 0, 2, 3, 2, 1], [2, 1, 0, 0, 1, 2, 3],
];

const monthlyTours = [
  { month: "T1", value: 8, status: "past" }, { month: "T2", value: 11, status: "past" },
  { month: "T3", value: 9, status: "past" }, { month: "T4", value: 12, status: "past" },
  { month: "T5", value: 14, status: "current" }, { month: "T6", value: 7, status: "future" },
  { month: "T7", value: 6, status: "future" }, { month: "T8", value: 5, status: "future" },
  { month: "T9", value: 4, status: "future" }, { month: "T10", value: 6, status: "future" },
  { month: "T11", value: 7, status: "future" }, { month: "T12", value: 9, status: "future" },
];

const tourCompletion = { done: 68, remaining: 32 };

export default function TourGuideDashboard() {
  const router = useRouter();
  const user = useUserStore();
  const [upcomingToursList, setUpcomingToursList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const res = await apiClient.get(`/guides-assignments/guide/${user.id}`);
        if (res.success && res.data) {
          // Sort by start date
          const sorted = res.data.sort((a: any, b: any) =>
            new Date(a.tourSchedule.startDate).getTime() - new Date(b.tourSchedule.startDate).getTime()
          );

          // Format for UI (with actual passenger counts)
          const formattedPromises = sorted.map(async (item: any, index: number) => {
            const dateStr = new Date(item.tourSchedule.startDate).toLocaleDateString('vi-VN');
            let passengerCount = item.tourSchedule.bookedPeople || 0;
            try {
              const bookRes = await apiClient.get(`/bookings/schedule/${item.tourSchedule.id}`);
              if (bookRes.success && bookRes.data) {
                let count = 0;
                (bookRes.data as any[]).forEach(b => {
                  if (b.status?.toUpperCase() !== "CANCELLED") {
                    if (b.passengers && b.passengers.length > 0) {
                      count += b.passengers.length;
                    } else {
                      count += (b.quantity ?? 0);
                    }
                  }
                });
                passengerCount = count;
              }
            } catch (err) {
              console.error("Failed to fetch passengers for schedule:", err);
            }
            return {
              id: item.id,
              name: item.tourSchedule.tour.name,
              date: dateStr,
              status: item.tourSchedule.active ? 'Sắp khởi hành' : 'Đã chốt đoàn',
              pax: passengerCount,
              isNext: index === 0, // First item is the next tour
              scheduleId: item.tourSchedule.id
            };
          });

          const formatted = await Promise.all(formattedPromises);
          setUpcomingToursList(formatted.slice(0, 5)); // Keep max 5 for dashboard
        }
      } catch (error) {
        console.error("Failed to fetch assigned tours:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [user]);

  const nextTour = upcomingToursList.length > 0 ? upcomingToursList[0] : {
    name: 'Chưa có tour phân công',
    date: '--/--/----',
    pax: 0,
    status: 'Đang đợi lịch'
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard {user?.fullName ? `— ${user.fullName}` : ""}
        </h1>
        <p className="text-slate-500 mt-2">Tổng quan thống kê công việc của Hướng dẫn viên.</p>
      </div>

      {/* Row 1: Left (Upcoming Tour 1x2) - Right (Stats + Feedback) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* Top: Next Tour Highlight */}
          <Card className="min-h-[240px] border-0 shadow-sm relative overflow-hidden rounded-3xl group">
            <div
              className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: `url(${oceanImage.src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-900/70 to-blue-900/40" />

            <div className="relative z-10 p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium border border-white/20">
                  Tour tiếp theo
                </span>
                {nextTour.scheduleId && (
                  <button
                    onClick={() => router.push(`/tourguide/tours/${nextTour.scheduleId}`)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-blue-700 text-xs font-semibold hover:bg-blue-50 transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    Xem chi tiết
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-8 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {nextTour.name}
                  </h2>
                  <div className="flex items-center gap-4 text-blue-100 text-sm">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4" />
                      {nextTour.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {nextTour.pax} khách
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Bottom: Upcoming Tours List */}
          <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-900">Danh sách tour sắp diễn ra</h3>
              <a href="/tourguide/schedule" className="text-sm font-medium text-blue-600 hover:text-blue-700">Xem tất cả</a>
            </div>
            <div className="space-y-3">
              {upcomingToursList.map((tour, idx) => (
                <div
                  key={tour.id}
                  onClick={() => tour.scheduleId && router.push(`/tourguide/tours/${tour.scheduleId}`)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer
                    ${tour.isNext
                      ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/60'
                      : 'border-slate-100 hover:border-blue-100 hover:bg-blue-50/30'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tour.isNext ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className="font-bold text-sm">{idx + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{tour.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {tour.date}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {tour.pax}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${
                      tour.isNext ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tour.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* Top: 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatCard
              title="Tour đã hoàn thành"
              value="34"
              change="4 tour"
              changeType="increase"
              icon={CheckCircle2}
              data={completedToursData}
              color="#3b82f6"
            />
            <StatCard
              title="Số ngày đi tour"
              value="120"
              change="15 ngày"
              changeType="increase"
              icon={Clock}
              data={daysOnTourData}
              color="#8b5cf6"
            />
            <StatCard
              title="Khách đã phục vụ"
              value="850"
              change="12%"
              changeType="increase"
              icon={Users}
              data={customersServedData}
              color="#10b981"
            />
            <StatCard
              title="Đánh giá trung bình"
              value="4.8/5"
              change="0.2 điểm"
              changeType="increase"
              icon={Star}
              data={ratingData}
              color="#f59e0b"
            />
          </div>

          {/* Bottom: Recent Feedback */}
          <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-900">Phản hồi từ khách hàng</h3>
              <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold">4.8</span>
              </div>
            </div>
            <div className="space-y-4">
              {recentFeedbacks.map((fb) => (
                <div key={fb.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{fb.customer}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{fb.tour}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < fb.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 flex items-start gap-2">
                    <MessageSquareQuote className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{fb.comment}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-3 text-right">{fb.date}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Row 2: Bar Chart, Pie Chart, Github Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Bar Chart (12 months) */}
        <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Lịch trình
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                Tour theo tháng
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600">
              2025
            </div>
          </div>
          <div className="mt-6 flex items-end gap-2 overflow-x-auto pb-2 justify-between">
            {monthlyTours.map((item) => {
              const barColor =
                item.status === "past"
                  ? "bg-blue-600"
                  : item.status === "current"
                    ? "bg-sky-500"
                    : "bg-blue-300";
              return (
                <div
                  key={item.month}
                  className="flex min-w-[20px] flex-col items-center gap-2"
                >
                  <div
                    className={`w-4 rounded-full ${barColor}`}
                    style={{ height: `${Math.max(item.value * 5, 4)}px` }}
                  />
                  <span className="text-[10px] text-slate-400">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Đã dẫn
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Tháng này
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-300" />
              Dự kiến
            </span>
          </div>
        </Card>

        {/* 2. Pie Chart (Completion Rate) */}
        <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tỉ lệ tour
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  Đã dẫn / Chưa dẫn
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <CheckCircle2 className="h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center">
              <div
                className="relative h-32 w-32 rounded-full"
                style={{
                  background: `conic-gradient(#3b82f6 0% ${tourCompletion.done}%, #e2e8f0 ${tourCompletion.done}% 100%)`,
                }}
              >
                <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">{tourCompletion.done}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-sm font-medium">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                Đã hoàn thành
              </span>
              <span className="text-slate-900">
                {tourCompletion.done}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                Chờ khởi hành
              </span>
              <span className="text-slate-900">
                {tourCompletion.remaining}%
              </span>
            </div>
          </div>
        </Card>

        {/* 3. Github Calendar */}
        <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Mức độ bận rộn
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  Lịch đi tour
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3">
                <CalendarDays className="h-5 w-5 text-blue-600" />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-7 gap-2.5 justify-center">
              {calendarWeeks.flatMap((week, weekIndex) =>
                week.map((level, dayIndex) => {
                  const key = `${weekIndex}-${dayIndex}`;
                  const levelClass =
                    level === 0
                      ? "bg-slate-100"
                      : level === 1
                        ? "bg-blue-100"
                        : level === 2
                          ? "bg-blue-300"
                          : "bg-blue-500";
                  return (
                    <div
                      key={key}
                      className={`h-5 w-5 sm:h-6 sm:w-6 rounded-md ${levelClass}`}
                    />
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between font-medium">
            <span>Rảnh rỗi</span>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-slate-100" />
              <span className="h-3 w-3 rounded-sm bg-blue-100" />
              <span className="h-3 w-3 rounded-sm bg-blue-300" />
              <span className="h-3 w-3 rounded-sm bg-blue-500" />
            </div>
            <span>Dày đặc</span>
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
}
