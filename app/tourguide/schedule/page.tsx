"use client";

import {
  CalendarDays, MapPin, Users, FileText,
  ChevronLeft, ChevronRight, X, ArrowRight,
  Clock, CheckCircle2, PlayCircle, Circle
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useUserStore } from "@/store/user-store";

// ─── Types ───────────────────────────────────────────────────────────────────
type ViewMode = "month" | "week" | "day";
type StatusFilter = "all" | "upcoming" | "running" | "ended";

interface Tour {
  id: string;
  scheduleId: string;
  name: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  location: string;
  groupSize: number;
  statusKey: StatusFilter;
  notes: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");
const toDateStr = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;

const resolveStatus = (startDate: string, endDate: string, active: boolean): StatusFilter => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (!active || end < today) return "ended";
  if (start > today) return "upcoming";
  return "running";
};

const STATUS_CONFIG: Record<StatusFilter, { label: string; bg: string; text: string; dot: string; border: string; icon: React.ElementType }> = {
  all:      { label: "Tất cả",     bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400",   border: "border-slate-300", icon: Circle },
  upcoming: { label: "Sắp đi",    bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-400", icon: Clock },
  running:  { label: "Đang chạy", bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500",    border: "border-blue-400",   icon: PlayCircle },
  ended:    { label: "Đã xong",   bg: "bg-slate-100",   text: "text-slate-500",   dot: "bg-slate-400",   border: "border-slate-300",  icon: CheckCircle2 },
};

const BLOCK_STYLE: Record<StatusFilter, string> = {
  all:      "bg-slate-200 text-slate-700",
  upcoming: "bg-emerald-100 text-emerald-800 border-l-4 border-emerald-500",
  running:  "bg-blue-100 text-blue-800 border-l-4 border-blue-500",
  ended:    "bg-slate-100 text-slate-500 border-l-4 border-slate-400",
};

const WEEKDAYS_LONG  = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
const WEEKDAYS_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTH_NAMES    = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

const fmt = (d?: string) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("vi-VN") : "–";

// ─── Component ───────────────────────────────────────────────────────────────
export default function TourGuideSchedule() {
  const router  = useRouter();
  const user    = useUserStore();

  const [viewMode,     setViewMode]     = useState<ViewMode>("month");
  const [currentDate,  setCurrentDate]  = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tours,        setTours]        = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [actualPassengerCount, setActualPassengerCount] = useState<number | null>(null);
  const [loadingPassengers, setLoadingPassengers] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch actual passenger count for selected tour schedule
  useEffect(() => {
    if (!selectedTour?.scheduleId) {
      setActualPassengerCount(null);
      return;
    }
    const fetchActualPassengers = async () => {
      setLoadingPassengers(true);
      try {
        const res = await apiClient.get(`/bookings/schedule/${selectedTour.scheduleId}`);
        if (res.success && res.data) {
          let count = 0;
          (res.data as any[]).forEach(b => {
            if (b.passengers && b.passengers.length > 0) {
              count += b.passengers.length;
            } else {
              count += (b.quantity ?? 0);
            }
          });
          setActualPassengerCount(count);
        }
      } catch (e) {
        console.error("Failed to fetch passengers:", e);
      } finally {
        setLoadingPassengers(false);
      }
    };
    fetchActualPassengers();
  }, [selectedTour]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const res = await apiClient.get(`/guides-assignments/guide/${user.id}`);
        if (res.success && res.data) {
          const formatted: Tour[] = res.data.map((item: any) => {
            const start  = item.tourSchedule.startDate;
            const end    = item.tourSchedule.endDate;
            const active = item.tourSchedule.active ?? false;
            return {
              id:         item.id,
              scheduleId: item.tourSchedule.id,
              name:       item.tourSchedule.tour.name,
              startDate:  start,
              endDate:    end,
              location:   item.tourSchedule.tour.endDestination?.name || "Nhiều điểm đến",
              groupSize:  item.tourSchedule.bookedPeople,
              statusKey:  resolveStatus(start, end, active),
              notes:      item.tourSchedule.note || "Không có ghi chú.",
            };
          });
          setTours(formatted);
        }
      } catch (e) {
        console.error("Failed to fetch schedule:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [user]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const visibleTours = statusFilter === "all"
    ? tours
    : tours.filter(t => t.statusKey === statusFilter);

  // ── Navigation ───────────────────────────────────────────────────────────
  const goToday = () => setCurrentDate(new Date());
  const navigate = (dir: 1 | -1) => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + dir);
    else if (viewMode === "week") d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  // ── Close panel on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSelectedTour(null);
      }
    };
    if (selectedTour) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selectedTour]);

  // ── Calendar title ───────────────────────────────────────────────────────
  const getTitle = () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    if (viewMode === "month") return `${MONTH_NAMES[m]} ${y}`;
    if (viewMode === "week") {
      const startW = new Date(currentDate);
      const dow    = startW.getDay() === 0 ? 6 : startW.getDay() - 1;
      startW.setDate(startW.getDate() - dow);
      const endW = new Date(startW); endW.setDate(endW.getDate() + 6);
      return `${startW.getDate()}/${startW.getMonth()+1} – ${endW.getDate()}/${endW.getMonth()+1}/${y}`;
    }
    return currentDate.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // ── Helpers for getting tours per day ────────────────────────────────────
  const getToursForDay = (dateStr: string) =>
    visibleTours.filter(t => dateStr >= t.startDate && dateStr <= t.endDate);

  const isStart = (t: Tour, dateStr: string) => t.startDate === dateStr;
  const isEnd   = (t: Tour, dateStr: string) => t.endDate === dateStr;

  // ── Month view ────────────────────────────────────────────────────────────
  const renderMonth = () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    let firstDow = new Date(y, m, 1).getDay();
    firstDow = firstDow === 0 ? 6 : firstDow - 1; // Mon = 0

    const todayStr = toDateStr(
      new Date().getFullYear(), new Date().getMonth(), new Date().getDate()
    );

    return (
      <div className="rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {WEEKDAYS_SHORT.map((d, i) => (
            <div key={d} className={`py-3 text-center text-xs font-semibold uppercase tracking-wide ${i >= 5 ? "text-blue-400" : "text-slate-400"}`}>
              {d}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="grid grid-cols-7" style={{ gridAutoRows: "minmax(100px, auto)" }}>
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`pre-${i}`} className="bg-slate-50/40 border-b border-r border-slate-100 p-2" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dateStr  = toDateStr(y, m, day);
            const dayTours = getToursForDay(dateStr);
            const isToday  = dateStr === todayStr;
            const colIdx   = (firstDow + day - 1) % 7;
            const isWeekend = colIdx >= 5;

            return (
              <div key={day} className={`border-b border-r border-slate-100 p-1.5 transition-colors ${isToday ? "bg-blue-50/40" : isWeekend ? "bg-slate-50/30" : ""}`}>
                <div className="flex items-center mb-1">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${
                    isToday ? "bg-blue-600 text-white shadow" : isWeekend ? "text-blue-400" : "text-slate-600"
                  }`}>
                    {day}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {dayTours.slice(0, 3).map(t => {
                    const startDay = isStart(t, dateStr);
                    const endDay   = isEnd(t, dateStr);
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTour(t)}
                        className={`w-full text-left text-xs font-medium px-2 py-1 rounded-md truncate transition-all hover:opacity-80 active:scale-[0.98] ${BLOCK_STYLE[t.statusKey]}`}
                        style={{
                          borderRadius: startDay && endDay ? "6px" : startDay ? "6px 2px 2px 6px" : endDay ? "2px 6px 6px 2px" : "2px",
                        }}
                      >
                        {startDay ? t.name : "·  " + t.name}
                      </button>
                    );
                  })}
                  {dayTours.length > 3 && (
                    <p className="text-[10px] text-slate-400 pl-1">+{dayTours.length - 3} tour</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Week view ─────────────────────────────────────────────────────────────
  const renderWeek = () => {
    const startW = new Date(currentDate);
    const dow    = startW.getDay() === 0 ? 6 : startW.getDay() - 1;
    startW.setDate(startW.getDate() - dow);
    const days   = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startW); d.setDate(d.getDate() + i); return d;
    });
    const todayStr = toDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    return (
      <div className="rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {days.map((d, i) => {
            const dateStr = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
            const isToday = dateStr === todayStr;
            return (
              <div key={i} className={`p-3 text-center border-r border-slate-100 last:border-r-0 ${isToday ? "bg-blue-50" : ""}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${i >= 5 ? "text-blue-400" : "text-slate-400"}`}>{WEEKDAYS_SHORT[i]}</p>
                <span className={`mt-1 inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-bold ${isToday ? "bg-blue-600 text-white" : "text-slate-700"}`}>
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 min-h-[320px]">
          {days.map((d, i) => {
            const dateStr  = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
            const dayTours = getToursForDay(dateStr);
            return (
              <div key={i} className="border-r border-slate-100 last:border-r-0 p-1.5 space-y-1">
                {dayTours.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTour(t)}
                    className={`w-full text-left text-xs font-medium px-2 py-2 rounded-lg transition-all hover:opacity-80 ${BLOCK_STYLE[t.statusKey]}`}
                  >
                    <p className="truncate font-semibold">{t.name}</p>
                    <p className="opacity-70 mt-0.5 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {t.location}</p>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Day view ──────────────────────────────────────────────────────────────
  const renderDay = () => {
    const dateStr  = toDateStr(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const dayTours = getToursForDay(dateStr);
    return (
      <div className="rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <p className="text-lg font-bold text-slate-900 capitalize">
            {currentDate.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">{dayTours.length} tour hôm nay</p>
        </div>
        {dayTours.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <CalendarDays className="w-14 h-14 mb-3" />
            <p className="text-base font-medium">Không có tour nào</p>
            <p className="text-sm mt-1">Hãy thư giãn và chuẩn bị cho chuyến đi tiếp theo!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {dayTours.map(t => {
              const cfg = STATUS_CONFIG[t.statusKey];
              const Icon = cfg.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTour(t)}
                  className="w-full text-left flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-2 self-stretch rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900 text-sm truncate">{t.name}</p>
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} flex-shrink-0`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {fmt(t.startDate)} → {fmt(t.endDate)}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.location}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t.groupSize} khách</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Lịch Trình Của Tôi {user?.fullName ? `(${user.fullName})` : ""}
        </h1>
        <p className="text-slate-500 text-sm mt-1">Theo dõi các tour bạn đang và sẽ phụ trách.</p>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        {/* Left: Nav + Today */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            Hôm nay
          </button>
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all text-slate-600">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => navigate(1)} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all text-slate-600">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-base font-bold text-slate-900 ml-1">{getTitle()}</span>
        </div>

        {/* Right: View + Filter */}
        <div className="flex items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {(["all", "upcoming", "running", "ended"] as StatusFilter[]).map(s => {
              const cfg = STATUS_CONFIG[s];
              const Icon = cfg.icon;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === s ? `${cfg.bg} ${cfg.text}` : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-3 h-3" /> {cfg.label}
                </button>
              );
            })}
          </div>

          {/* View mode */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {(["month", "week", "day"] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === v ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {v === "month" ? "Tháng" : v === "week" ? "Tuần" : "Ngày"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Calendar + Side Panel ────────────────────────────────────────── */}
      <div className={`flex gap-5 items-start transition-all duration-300 ${selectedTour ? "pr-0" : ""}`}>
        {/* Calendar */}
        <div className={`flex-1 min-w-0 transition-all duration-300`}>
          {loading ? (
            <div className="flex items-center justify-center h-96 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Đang tải lịch trình...</p>
              </div>
            </div>
          ) : (
            <>
              {viewMode === "month" && renderMonth()}
              {viewMode === "week"  && renderWeek()}
              {viewMode === "day"   && renderDay()}
            </>
          )}
        </div>

        {/* Detail Side Panel */}
        <div
          ref={panelRef}
          className={`transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${
            selectedTour ? "w-80 opacity-100" : "w-0 opacity-0 pointer-events-none"
          }`}
        >
          {selectedTour && (
            <div className="w-80 bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
              {/* Panel header colored by status */}
              <div className={`relative p-5 ${
                selectedTour.statusKey === "upcoming" ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                : selectedTour.statusKey === "running"  ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                : "bg-gradient-to-br from-slate-400 to-slate-500"
              }`}>
                <button
                  onClick={() => setSelectedTour(null)}
                  className="absolute top-3 right-3 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                {/* Status badge */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-2 bg-white/20 text-white border border-white/20`}>
                  {(() => {
                    const cfg = STATUS_CONFIG[selectedTour.statusKey];
                    const Icon = cfg.icon;
                    return <><Icon className="w-3 h-3" /> {cfg.label}</>;
                  })()}
                </span>

                <h2 className="text-white font-bold text-base leading-snug pr-6">
                  {selectedTour.name}
                </h2>
              </div>

              {/* Panel body */}
              <div className="p-5 space-y-3">
                {/* Info items */}
                {[
                  {
                    icon: CalendarDays,
                    label: "Thời gian",
                    value: `${fmt(selectedTour.startDate)} → ${fmt(selectedTour.endDate)}`,
                    color: "text-blue-500",
                  },
                  {
                    icon: MapPin,
                    label: "Điểm đến",
                    value: selectedTour.location,
                    color: "text-emerald-500",
                  },
                  {
                    icon: Users,
                    label: "Số khách",
                    value: loadingPassengers
                      ? "Đang tải..."
                      : `${actualPassengerCount ?? selectedTour.groupSize} người`,
                    color: "text-purple-500",
                  },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}

                {/* Notes */}
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2 mb-1.5 text-amber-700">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Ghi chú điều hành</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{selectedTour.notes}</p>
                </div>

                {/* CTA */}
                <button
                  onClick={() => {
                    setSelectedTour(null);
                    router.push(`/tourguide/tours/${selectedTour.scheduleId}`);
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] ${
                    selectedTour.statusKey === "upcoming" ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                    : selectedTour.statusKey === "running"  ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                    : "bg-gradient-to-r from-slate-500 to-slate-600"
                  }`}
                >
                  Xem chi tiết tour <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
