"use client";

import { CalendarDays, MapPin, Users, Clock, FileText, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useUserStore } from "@/store/user-store";

// Removed static mock tours

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function TourGuideSchedule() {
  const router = useRouter();
  const user = useUserStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assignedTours, setAssignedTours] = useState<any[]>([]);
  const [selectedTour, setSelectedTour] = useState<any | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.id) return;
      try {
        const res = await apiClient.get(`/guides-assignments/guide/${user.id}`);
        if (res.success && res.data) {
          const colors = [
            { bg: "bg-blue-500", text: "text-blue-700", light: "bg-blue-100" },
            { bg: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-100" },
            { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-100" },
            { bg: "bg-purple-500", text: "text-purple-700", light: "bg-purple-100" },
          ];

          const formatted = res.data.map((item: any, index: number) => {
            const colorTheme = colors[index % colors.length];
            return {
              id: item.id,
              scheduleId: item.tourSchedule.id,  // ID của TourSchedule
              name: item.tourSchedule.tour.name,
              startDate: item.tourSchedule.startDate,
              endDate: item.tourSchedule.endDate,
              location: item.tourSchedule.tour.endDestination?.name || "Nhiều điểm đến",
              groupSize: item.tourSchedule.bookedPeople,
              status: item.tourSchedule.active ? "Sắp tới" : "Đã hoàn thành",
              color: colorTheme.bg,
              textColor: colorTheme.text,
              bgColor: colorTheme.light,
              notes: item.tourSchedule.note || "Không có ghi chú.",
            };
          });
          setAssignedTours(formatted);
        }
      } catch (error) {
        console.error("Failed to fetch schedule:", error);
      }
    };
    fetchAssignments();
  }, [user]);

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get day of week of 1st day (0 = Sun, 1 = Mon, ..., 6 = Sat)
  let firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust to make Monday = 0, Sunday = 6
  firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const prefixDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Helper to check if a day is within a tour's date range
  const getToursForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return assignedTours.filter(tour => dateStr >= tour.startDate && dateStr <= tour.endDate);
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Lịch Trình Của Tôi
          </h1>
          <p className="mt-2 text-slate-500">
            Theo dõi chi tiết các tour bạn đang và sẽ phụ trách.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-slate-900 min-w-[120px] text-center">
            Tháng {month + 1}, {year}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
        {/* Calendar Header (Weekdays) */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-4 text-center text-sm font-semibold text-slate-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-y divide-slate-100 border-l border-slate-100">
          {/* Empty prefix boxes */}
          {prefixDays.map((_, i) => (
            <div key={`prefix-${i}`} className="bg-slate-50/30 p-2" />
          ))}

          {/* Actual days */}
          {days.map((day) => {
            const dayTours = getToursForDay(day);
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <div key={day} className={`p-2 transition-colors hover:bg-slate-50 ${isToday ? 'bg-blue-50/30' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'
                    }`}>
                    {day}
                  </span>
                </div>

                {/* Tour Indicators */}
                <div className="mt-2 space-y-1.5 flex flex-col items-start w-full">
                  {dayTours.map((tour) => {
                    const isStart = tour.startDate.endsWith(String(day).padStart(2, '0'));

                    return (
                      <button
                        key={tour.id}
                        onClick={() => setSelectedTour(tour)}
                        className={`w-full text-left px-2 py-1.5 rounded-md text-xs font-semibold truncate transition-all hover:brightness-95 ${tour.bgColor} ${tour.textColor}`}
                      >
                        {isStart ? tour.name : <span className="opacity-70">{tour.name}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tour Detail Dialog */}
      <Dialog open={!!selectedTour} onOpenChange={() => setSelectedTour(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
          {selectedTour && (
            <>
              {/* Header Image/Gradient */}
              <div className={`h-32 w-full p-6 flex items-end ${selectedTour.color}`}>
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold border border-white/20">
                  {selectedTour.status}
                </div>
              </div>

              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-slate-900">
                    {selectedTour.name}
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 mt-1">
                    Mã lịch trình: {selectedTour.id}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-6 space-y-4">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <CalendarDays className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Thời gian</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          {selectedTour.startDate.split('-').reverse().join('/')} - {selectedTour.endDate.split('-').reverse().join('/')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Địa điểm</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          {selectedTour.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <Users className="w-5 h-5 text-purple-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Số lượng khách</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          {selectedTour.groupSize} người
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="w-5 h-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Trạng thái</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          {selectedTour.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="mt-6 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2 text-blue-800 font-semibold text-sm">
                      <FileText className="w-4 h-4" />
                      Ghi chú từ Điều hành
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {selectedTour.notes}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors"
                    onClick={() => setSelectedTour(null)}
                  >
                    Đóng
                  </button>
                  <button
                    className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      setSelectedTour(null);
                      router.push(`/tourguide/tours/${selectedTour.scheduleId ?? selectedTour.id}`);
                    }}
                  >
                    Xem chi tiết →
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
