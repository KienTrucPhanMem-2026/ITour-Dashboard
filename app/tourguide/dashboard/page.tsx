"use client";

import { CalendarDays, MapPin, Users } from "lucide-react";
import oceanImage from "@/assets/background/ocean.jpg";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

const monthlyStats = [
  {
    label: "Tour trọn gói",
    value: "12",
    icon: CalendarDays,
  },
  {
    label: "Tour ghép",
    value: "8",
    icon: Users,
  },
  {
    label: "Tổng tour đã hoàn thành",
    value: "18",
    icon: MapPin,
  },
  {
    label: "Tour sắp tới",
    value: "3",
    icon: CalendarDays,
    highlight: true,
  },
];

const upcomingTours = [
  {
    id: "schedule-001",
    name: "Phu Quoc 4N3D - All Inclusive",
    date: "2025-04-10",
    location: "Phu Quoc",
  },
  {
    id: "schedule-002",
    name: "Da Lat Mua Hoa 3N2D",
    date: "2025-05-05",
    location: "Da Lat",
  },
  {
    id: "schedule-003",
    name: "Nha Trang 3N2D",
    date: "2025-05-18",
    location: "Nha Trang",
  },
];

const calendarWeeks = [
  [0, 1, 1, 2, 0, 3, 0],
  [0, 2, 2, 1, 0, 3, 1],
  [1, 0, 2, 3, 1, 0, 2],
  [0, 1, 0, 2, 3, 2, 1],
  [2, 1, 0, 0, 1, 2, 3],
];

const monthlyTours = [
  { month: "T1", value: 8, status: "past" },
  { month: "T2", value: 11, status: "past" },
  { month: "T3", value: 9, status: "past" },
  { month: "T4", value: 12, status: "past" },
  { month: "T5", value: 14, status: "current" },
  { month: "T6", value: 7, status: "future" },
  { month: "T7", value: 6, status: "future" },
  { month: "T8", value: 5, status: "future" },
  { month: "T9", value: 4, status: "future" },
  { month: "T10", value: 6, status: "future" },
  { month: "T11", value: 7, status: "future" },
  { month: "T12", value: 9, status: "future" },
];

const tourCompletion = {
  done: 68,
  remaining: 32,
};

export default function TourGuideDashboard() {
  return (
    <DashboardLayout>
      <div className="rounded-3xl bg-slate-100/80 p-4 sm:p-6 md:p-8">
        <div className="mb-8">
          <p className="text-2xl font-bold uppercase tracking-[0.2em] text-blue-600 sm:text-3xl sm:tracking-[0.25em]">
            Dashboard
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Tổng quan nhanh dành cho hướng dẫn viên.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <div
            className="relative overflow-hidden rounded-3xl p-4 text-white shadow-[0_25px_60px_rgba(59,130,246,0.35)] sm:p-5"
            style={{
              backgroundImage: `url(${oceanImage.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/65 via-blue-800/35 to-blue-700/25" />
            <div className="relative z-10 rounded-3xl border border-white/15 bg-white/5 p-4 backdrop-blur-md sm:p-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <p className="text-sm text-white/80">Tour sắp tới</p>
                <div className="sm:mt-0">
                  <a
                    href="/tourguide/schedule"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm"
                  >
                    Xem tất cả lịch
                  </a>
                </div>
              </div>
              <div className="mt-2 flex flex-col items-start justify-between gap-4 sm:mt-4 sm:flex-row sm:items-center">
                <div>
                  <p className="mt-2 text-2xl font-semibold sm:text-3xl">
                    {upcomingTours[0]?.name || "Chưa có lịch"}
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    {upcomingTours[0]
                      ? `${upcomingTours[0].date} • ${upcomingTours[0].location}`
                      : "Cập nhật lịch phân công mới nhất"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/15 p-3">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/80 p-4 shadow-sm">
            <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-blue-500">
                Thống kê theo tháng
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Cập nhật tổng quan theo nhóm tour.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {monthlyStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={`rounded-2xl border border-slate-200 p-4 shadow-sm sm:p-5 ${
                      stat.highlight ? "bg-blue-600 text-white" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`text-xs uppercase tracking-[0.2em] ${
                            stat.highlight ? "text-white/80" : "text-slate-400"
                          }`}
                        >
                          {stat.label}
                        </p>
                        <p
                          className={`mt-2 text-xl font-semibold sm:text-2xl ${
                            stat.highlight ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={`rounded-2xl p-3 ${
                          stat.highlight ? "bg-white/15" : "bg-blue-50"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            stat.highlight ? "text-white" : "text-blue-600"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-blue-500">
                  Lich tour
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  Ngay co tour
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3">
                <CalendarDays className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-2 text-xs text-slate-400">
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
                      className={`h-4 w-4 rounded-md ${levelClass}`}
                    />
                  );
                }),
              )}
            </div>
            <div className="mt-4 flex flex-col items-start gap-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>It hoat dong</span>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-slate-100" />
                <span className="h-3 w-3 rounded bg-blue-100" />
                <span className="h-3 w-3 rounded bg-blue-300" />
                <span className="h-3 w-3 rounded bg-blue-500" />
              </div>
              <span>Nhieu tour</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-blue-500">
                  Tong tour
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  Theo thang
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600">
                2025
              </div>
            </div>
            <div className="mt-6 flex items-end gap-2 overflow-x-auto pb-2">
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
                    className="flex min-w-[28px] flex-col items-center gap-2"
                  >
                    <div
                      className={`w-5 rounded-full ${barColor}`}
                      style={{ height: `${item.value * 6}px` }}
                    />
                    <span className="text-[10px] text-slate-400">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Thang da qua
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Thang hien tai
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-300" />
                Thang sap toi
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-blue-500">
                  Ti le tour
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  Da dan vs chua dan
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center">
              <div
                className="h-28 w-28 rounded-full sm:h-36 sm:w-36"
                style={{
                  background: `conic-gradient(#2563eb 0% ${tourCompletion.done}%, #bfdbfe ${tourCompletion.done}% 100%)`,
                }}
              >
                <div className="flex h-full w-full items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-white sm:h-20 sm:w-20" />
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  Da dan
                </span>
                <span className="font-semibold text-slate-900">
                  {tourCompletion.done}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-200" />
                  Chua dan
                </span>
                <span className="font-semibold text-slate-900">
                  {tourCompletion.remaining}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
