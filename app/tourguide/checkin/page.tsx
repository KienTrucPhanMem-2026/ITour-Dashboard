"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  CheckCircle2, Circle, Phone, Search, Users, AlertTriangle,
  ChevronRight, MapPin, Navigation, Utensils, Binoculars,
  Hotel, Clock, CalendarDays, AlertCircle, X, Loader2,
  ClipboardCheck, TrendingUp, ChevronDown, Wifi,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { apiClient } from "@/lib/api-client";
import { useUserStore } from "@/store/user-store";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Booking {
  id: string;
  adults: number;
  children: number;
  quantity: number;
  customer?: { id: string; fullName: string; phone: string; email: string };
  status: string;
  paymentStatus: string;
}

interface Passenger {
  bookingId: string;
  customerName: string;
  phone: string;
  adults: number;
  children: number;
  notes: string[];
  checkedIn: boolean;
}

interface ItineraryDetail {
  id: string;
  timeFrame: string;
  activityType: "TRANSPORT" | "DINING" | "VISIT" | "CHECKIN" | string;
  title: string;
  note?: string;
}

interface TourItinerary {
  id: string;
  dayNumber: number;
  title: string;
  itineraryDetails: ItineraryDetail[];
}

interface TourSchedule {
  id: string;
  startDate: string;
  endDate: string;
  bookedPeople: number;
  tour: { id: string; name: string; durationDays: number; endDestination?: { name: string } };
}

interface TrackingRecord {
  itineraryDetailId: string;
  actualCheckinTime: string;
  status: "ON_TIME" | "DELAYED" | "SKIPPED";
  guideNote?: string;
}

// ─── Activity config ──────────────────────────────────────────────────────────
const ACTIVITY = {
  TRANSPORT: { icon: Navigation, bg: "bg-blue-100",    text: "text-blue-600",    label: "Di chuyển",  border: "border-blue-300" },
  DINING:    { icon: Utensils,   bg: "bg-amber-100",   text: "text-amber-600",   label: "Ăn uống",    border: "border-amber-300" },
  VISIT:     { icon: Binoculars, bg: "bg-emerald-100", text: "text-emerald-600", label: "Tham quan",  border: "border-emerald-300" },
  CHECKIN:   { icon: Hotel,      bg: "bg-purple-100",  text: "text-purple-600",  label: "Khách sạn",  border: "border-purple-300" },
} as Record<string, { icon: React.ElementType; bg: string; text: string; label: string; border: string }>;

const getAct = (type: string) =>
  ACTIVITY[type] ?? { icon: Circle, bg: "bg-slate-100", text: "text-slate-500", label: type, border: "border-slate-200" };

// ─── Delay reasons (for quick selection) ─────────────────────────────────────
const DELAY_REASONS = [
  "Kẹt xe / Tắc đường",
  "Thời tiết xấu / Mưa lớn",
  "Khách chưa tập hợp đủ",
  "Sự cố phương tiện",
  "Điểm tham quan đông khách",
  "Thay đổi lịch trình",
];

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("vi-VN") : "–";
const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CheckinPage() {
  const user = useUserStore();
  const [activeTab, setActiveTab] = useState<"attendance" | "progress">("attendance");

  // ── Assignment & schedule selection ───────────────────────────────────────
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<TourSchedule | null>(null);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  // ── Tab 1: Attendance ──────────────────────────────────────────────────────
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [search, setSearch] = useState("");
  const [loadingBookings, setLoadingBookings] = useState(false);

  // ── Tab 2: Progress ────────────────────────────────────────────────────────
  const [allItineraries, setAllItineraries] = useState<TourItinerary[]>([]);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [trackings, setTrackings] = useState<Map<string, TrackingRecord>>(new Map());
  const [currentMilestoneIdx, setCurrentMilestoneIdx] = useState(0);
  const [loadingItinerary, setLoadingItinerary] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [selectedDelayReason, setSelectedDelayReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [guidesAssignmentId, setGuidesAssignmentId] = useState<string>("");

  // ─── Fetch assignments ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      setLoadingAssignments(true);
      try {
        const res = await apiClient.get(`/guides-assignments/guide/${user.id}`);
        if (res.success && res.data) {
          // Sắp xếp các chuyến đi theo thời gian tăng dần (startDate)
          const sortedData = [...res.data].sort((a: any, b: any) => {
            const startA = a.tourSchedule?.startDate ?? "";
            const startB = b.tourSchedule?.startDate ?? "";
            return startA.localeCompare(startB);
          });
          setAssignments(sortedData);
          // Pre-select: tour đang diễn ra hôm nay
          const today = new Date().toISOString().split("T")[0];
          const active = sortedData.find((a: any) => {
            const s = a.tourSchedule?.startDate;
            const e = a.tourSchedule?.endDate;
            return s && e && today >= s && today <= e;
          });
          if (active) {
            setSelectedSchedule(active.tourSchedule);
            setGuidesAssignmentId(active.id);
          } else if (sortedData.length > 0) {
            setSelectedSchedule(sortedData[0].tourSchedule);
            setGuidesAssignmentId(sortedData[0].id);
          }
        }
      } finally {
        setLoadingAssignments(false);
      }
    };
    fetch();
  }, [user]);

  // ─── Fetch bookings khi chọn schedule ────────────────────────────────────
  useEffect(() => {
    if (!selectedSchedule?.id) return;
    const fetch = async () => {
      setLoadingBookings(true);
      try {
        const res = await apiClient.get(`/bookings/schedule/${selectedSchedule.id}`);
        if (res.success && res.data) {
          const pax: Passenger[] = (res.data as Booking[]).map(b => ({
            bookingId: b.id,
            customerName: b.customer?.fullName ?? "Khách hàng",
            phone: b.customer?.phone ?? "",
            adults: b.adults ?? 0,
            children: b.children ?? 0,
            notes: [
              ...(b.children > 0 ? ["Có trẻ em"] : []),
              ...(b.paymentStatus === "UNPAID" ? ["Chưa thanh toán"] : []),
            ],
            checkedIn: false,
          }));
          setPassengers(pax);
        }
      } finally {
        setLoadingBookings(false);
      }
    };
    fetch();
  }, [selectedSchedule]);

  // ─── Fetch all itineraries for the tour ─────────────────────────────────
  useEffect(() => {
    if (!selectedSchedule?.tour?.id || activeTab !== "progress") return;
    const fetch = async () => {
      setLoadingItinerary(true);
      try {
        const res = await apiClient.get(`/tour-itineraries/tour/${selectedSchedule.tour.id}`);
        if (res.success && res.data && res.data.length > 0) {
          const sorted = [...res.data].sort((a: TourItinerary, b: TourItinerary) => a.dayNumber - b.dayNumber);
          const processed = sorted.map((day: TourItinerary) => ({
            ...day,
            itineraryDetails: [...(day.itineraryDetails ?? [])].sort((a, b) =>
              (a.timeFrame ?? "").localeCompare(b.timeFrame ?? "")
            ),
          }));
          setAllItineraries(processed);

          // Calculate initial active day based on date
          const start = new Date(selectedSchedule.startDate);
          const today = new Date(); today.setHours(0, 0, 0, 0); start.setHours(0, 0, 0, 0);
          const dayOffset = Math.floor((today.getTime() - start.getTime()) / 86400000);
          const dayNum = Math.max(1, dayOffset + 1);

          // Check if calculated day exists in our database itineraries list, otherwise default to first day
          const hasDay = processed.some(i => i.dayNumber === dayNum);
          setSelectedDayNumber(hasDay ? dayNum : (processed[0]?.dayNumber ?? 1));
        } else {
          setAllItineraries([]);
        }
      } finally {
        setLoadingItinerary(false);
      }
    };
    fetch();
  }, [selectedSchedule, activeTab]);

  // Compute active day's plan
  const todayItinerary = useMemo(() => {
    return allItineraries.find(i => i.dayNumber === selectedDayNumber) ?? null;
  }, [allItineraries, selectedDayNumber]);

  // ─── Find current milestone based on time ────────────────────────────────
  useEffect(() => {
    if (!todayItinerary?.itineraryDetails) return;

    // Check if the selected day is indeed "today" of the tour
    const start = new Date(selectedSchedule?.startDate ?? "");
    const today = new Date(); today.setHours(0, 0, 0, 0); start.setHours(0, 0, 0, 0);
    const dayOffset = Math.floor((today.getTime() - start.getTime()) / 86400000);
    const tourTodayNum = Math.max(1, dayOffset + 1);

    if (selectedDayNumber === tourTodayNum) {
      const nowH = new Date().getHours() * 60 + new Date().getMinutes();
      let idx = 0;
      todayItinerary.itineraryDetails.forEach((d, i) => {
        const startTime = d.timeFrame?.split(" - ")[0] ?? "00:00";
        const [h, m] = startTime.split(":").map(Number);
        if ((h * 60 + m) <= nowH) idx = i;
      });
      setCurrentMilestoneIdx(idx);
    } else {
      setCurrentMilestoneIdx(0);
    }
  }, [selectedDayNumber, todayItinerary, selectedSchedule]);

  // ─── Computed ─────────────────────────────────────────────────────────────
  const checkedInCount = passengers.filter(p => p.checkedIn).length;
  const totalCount = passengers.length;

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${date}`;
  }, []);

  const isLocked = useMemo(() => {
    if (!selectedSchedule?.startDate) return false;
    return selectedSchedule.startDate > todayStr;
  }, [selectedSchedule, todayStr]);

  const filteredPassengers = useMemo(() => {
    if (!search.trim()) return passengers;
    const q = search.toLowerCase();
    return passengers.filter(p =>
      p.customerName.toLowerCase().includes(q) || p.phone.includes(q)
    );
  }, [passengers, search]);

  const toggleCheckin = (bookingId: string) => {
    setPassengers(prev =>
      prev.map(p => p.bookingId === bookingId ? { ...p, checkedIn: !p.checkedIn } : p)
    );
  };

  // ─── Submit check-in milestone ────────────────────────────────────────────
  const handleMilestoneCheckIn = async (detail: ItineraryDetail, status: "ON_TIME" | "DELAYED" | "SKIPPED", note?: string) => {
    if (!selectedSchedule?.id || !guidesAssignmentId) return;
    setSubmitting(true);
    try {
      const body = {
        id: `TRK-${detail.id}-${Date.now()}`,
        tourSchedule: { id: selectedSchedule.id, isActive: true },
        itineraryDetail: { id: detail.id },
        guidesAssignment: { id: guidesAssignmentId },
        actualCheckinTime: new Date().toISOString(),
        status,
        guideNote: note ?? "",
      };
      const res = await apiClient.post("/schedule-trackings", body);
      if (res.success) {
        setTrackings(prev => {
          const next = new Map(prev);
          next.set(detail.id, {
            itineraryDetailId: detail.id,
            actualCheckinTime: new Date().toISOString(),
            status,
            guideNote: note,
          });
          return next;
        });
        if (status !== "SKIPPED" && todayItinerary) {
          const nextIdx = currentMilestoneIdx + 1;
          if (nextIdx < (todayItinerary.itineraryDetails?.length ?? 0)) {
            setCurrentMilestoneIdx(nextIdx);
          }
        }
      }
    } finally {
      setSubmitting(false);
      setShowDelayModal(false);
      setSelectedDelayReason("");
    }
  };

  const currentDetail = todayItinerary?.itineraryDetails?.[currentMilestoneIdx];
  const isCurrentDone = currentDetail ? trackings.has(currentDetail.id) : false;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-blue-600" />
          Check-in &amp; Tiến Độ Tour
        </h1>
        <p className="text-slate-500 text-sm mt-1">Điểm danh hành khách và cập nhật hành trình thực tế.</p>
      </div>

      {/* ── Tour selector ───────────────────────────────────────────────── */}
      {loadingAssignments ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách tour...
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-amber-700 text-sm font-medium">Bạn chưa được phân công tour nào.</p>
        </div>
      ) : (
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Chọn chuyến khởi hành</label>
          <div className="relative">
            <select
              value={selectedSchedule?.id ?? ""}
              onChange={e => {
                const a = assignments.find(a => a.tourSchedule?.id === e.target.value);
                if (a) { setSelectedSchedule(a.tourSchedule); setGuidesAssignmentId(a.id); }
              }}
              className="w-full appearance-none bg-white border border-slate-200 rounded-2xl px-4 py-3 pr-10 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {assignments.map(a => (
                <option key={a.id} value={a.tourSchedule?.id}>
                  {a.tourSchedule?.tour?.name} · {fmt(a.tourSchedule?.startDate)} → {fmt(a.tourSchedule?.endDate)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {selectedSchedule && (
        <>
          {/* ── Tab switcher ──────────────────────────────────────────────── */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-5 gap-1">
            {[
              { key: "attendance", icon: Users,        label: "Điểm Danh" },
              { key: "progress",   icon: TrendingUp,   label: "Tiến Độ" },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === key
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* ══════════ TAB 1: ATTENDANCE ══════════ */}
          {activeTab === "attendance" && (
            <div className="flex flex-col gap-4">
              {isLocked && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 text-sm font-bold">Chuyến khởi hành chưa bắt đầu</p>
                    <p className="text-amber-700 text-xs mt-0.5">
                      Chuyến khởi hành diễn ra vào ngày {fmt(selectedSchedule?.startDate)}. Tính năng điểm danh và check-in lịch trình hiện đang bị khóa.
                    </p>
                  </div>
                </div>
              )}

              {/* Sticky header */}
              <div className="sticky top-0 z-20 bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
                {/* Progress bar */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-500" />
                    Điểm danh đoàn
                  </span>
                  <span className="text-sm font-bold text-emerald-600">
                    {checkedInCount} / {totalCount} khách
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                    style={{ width: `${totalCount ? (checkedInCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc số điện thoại..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Passenger list */}
              {loadingBookings ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải danh sách...
                </div>
              ) : filteredPassengers.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{search ? "Không tìm thấy kết quả" : "Chưa có hành khách nào"}</p>
                </div>
              ) : (
                <div className="space-y-3 pb-6">
                  {filteredPassengers.map(p => (
                    <div
                      key={p.bookingId}
                      onClick={() => !isLocked && toggleCheckin(p.bookingId)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${
                        isLocked
                          ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-75"
                          : p.checkedIn
                            ? "bg-emerald-50 border-emerald-300 shadow-sm cursor-pointer active:scale-[0.98]"
                            : "bg-white border-slate-200 hover:border-slate-300 cursor-pointer active:scale-[0.98]"
                      }`}
                    >
                      {/* Check icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                        p.checkedIn ? "bg-emerald-500" : "bg-slate-100"
                      }`}>
                        {p.checkedIn
                          ? <CheckCircle2 className="w-7 h-7 text-white" />
                          : <Circle className="w-7 h-7 text-slate-400" />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-base truncate ${p.checkedIn ? "text-emerald-800" : "text-slate-900"}`}>
                          {p.customerName}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {p.adults} NL{p.children > 0 ? ` · ${p.children} TE` : ""}
                          </span>
                          {p.phone && (
                            <a
                              href={`tel:${p.phone}`}
                              onClick={e => e.stopPropagation()}
                              className="text-xs text-blue-500 flex items-center gap-1 hover:text-blue-700"
                            >
                              <Phone className="w-3 h-3" /> {p.phone}
                            </a>
                          )}
                        </div>
                        {/* Tags */}
                        {p.notes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {p.notes.map(n => (
                              <span key={n} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                {n}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Status badge */}
                      <div className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold ${
                        p.checkedIn ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                      }`}>
                        {p.checkedIn ? "Có mặt" : "Vắng"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════ TAB 2: PROGRESS ══════════ */}
          {activeTab === "progress" && (
            <div className="flex flex-col gap-4 pb-36">
              {/* Info bar */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-5 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays className="w-4 h-4 opacity-80" />
                  <span className="text-xs opacity-80 font-medium font-semibold">
                    {isLocked ? "Chuyến đi chưa diễn ra" : "Chuyến đang diễn ra"}
                  </span>
                </div>
                <p className="font-bold text-lg leading-snug">{selectedSchedule.tour?.name}</p>
                <p className="text-blue-200 text-xs mt-1">
                  {fmt(selectedSchedule.startDate)} → {fmt(selectedSchedule.endDate)}
                  {selectedSchedule.tour?.endDestination?.name && ` · ${selectedSchedule.tour.endDestination.name}`}
                </p>
                {todayItinerary && (
                  <div className="mt-3 bg-white/15 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold opacity-90">📅 Ngày {todayItinerary.dayNumber}: {todayItinerary.title}</p>
                  </div>
                )}
              </div>

              {/* Day selector tabs */}
              {allItineraries.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {allItineraries.map((it) => {
                    const isActive = it.dayNumber === selectedDayNumber;
                    return (
                      <button
                        key={it.id}
                        onClick={() => setSelectedDayNumber(it.dayNumber)}
                        className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
                          isActive
                            ? "bg-blue-600 border-blue-600 text-white shadow-md"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        Ngày {it.dayNumber}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Timeline */}
              {loadingItinerary ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải lịch trình...
                </div>
              ) : !todayItinerary || (todayItinerary.itineraryDetails?.length ?? 0) === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Không có lịch trình cho hôm nay</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[28px] top-6 bottom-6 w-0.5 bg-slate-200" />

                  <div className="space-y-3">
                    {todayItinerary.itineraryDetails.map((detail, idx) => {
                      const tracked = trackings.get(detail.id);
                      const isCurrent = idx === currentMilestoneIdx;
                      const isDone = !!tracked;
                      const isPast = idx < currentMilestoneIdx;
                      const cfg = getAct(detail.activityType);
                      const Icon = cfg.icon;

                      return (
                        <div key={detail.id} className={`flex items-start gap-4 transition-all duration-300`}>
                          {/* Icon */}
                          <div className={`flex-shrink-0 z-10 w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${
                            isDone    ? "bg-emerald-500 border-emerald-500 shadow-md"
                            : isCurrent ? `${cfg.bg} ${cfg.border} shadow-lg scale-110`
                            : isPast  ? "bg-slate-100 border-slate-200 opacity-50"
                            : "bg-white border-slate-200"
                          }`}>
                            {isDone
                              ? <CheckCircle2 className="w-7 h-7 text-white" />
                              : <Icon className={`w-6 h-6 ${isCurrent ? cfg.text : "text-slate-400"}`} />
                            }
                          </div>

                          {/* Card */}
                          <div className={`flex-1 rounded-2xl p-4 border-2 transition-all ${
                            isDone    ? "bg-emerald-50 border-emerald-200"
                            : isCurrent ? `bg-white ${cfg.border} shadow-sm`
                            : "bg-white border-slate-100 opacity-60"
                          }`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                                    {cfg.label}
                                  </span>
                                  <span className="text-xs text-slate-400 font-medium">{detail.timeFrame}</span>
                                  {isCurrent && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white animate-pulse">
                                      HIỆN TẠI
                                    </span>
                                  )}
                                </div>
                                <p className={`font-bold text-sm ${isDone ? "text-emerald-800" : "text-slate-800"}`}>
                                  {detail.title}
                                </p>
                                {isDone && tracked?.actualCheckinTime && (
                                  <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Hoàn thành lúc {fmtTime(tracked.actualCheckinTime)}
                                    {tracked.status === "DELAYED" && <span className="text-amber-500 ml-1">(Trễ)</span>}
                                    {tracked.status === "SKIPPED" && <span className="text-slate-400 ml-1">(Bỏ qua)</span>}
                                  </p>
                                )}
                                {detail.note && !isDone && (
                                  <p className="text-xs text-amber-600 mt-1 bg-amber-50 rounded-lg px-2 py-1">
                                    💬 {detail.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════ BOTTOM ACTION BAR (Tab 2 only) ════════════════ */}
      {activeTab === "progress" && selectedSchedule && currentDetail && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30">
          <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 pt-3 pb-5 shadow-2xl">
            {isLocked ? (
              <div className="flex items-center justify-center bg-amber-50 rounded-2xl px-4 py-4 border border-amber-200 text-amber-700">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="font-semibold text-xs text-center leading-normal">
                  Chuyến khởi hành chưa bắt đầu. Tính năng check-in lịch trình hiện đang khóa.
                </span>
              </div>
            ) : !isCurrentDone ? (
              <div className="flex gap-3">
                {/* Primary: Check-in */}
                <button
                  onClick={() => handleMilestoneCheckIn(currentDetail, "ON_TIME")}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base shadow-lg active:scale-[0.97] transition-all disabled:opacity-60"
                >
                  {submitting
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <CheckCircle2 className="w-5 h-5" />
                  }
                  <span className="leading-tight text-left">
                    <span className="block text-[11px] opacity-80 font-normal">Xác nhận hoàn thành</span>
                    <span className="block truncate max-w-[180px]">{currentDetail.title}</span>
                  </span>
                </button>

                {/* Secondary: Report delay */}
                <button
                  onClick={() => setShowDelayModal(true)}
                  className="flex-shrink-0 w-14 flex items-center justify-center rounded-2xl bg-amber-100 text-amber-600 active:scale-[0.97] transition-all border-2 border-amber-200"
                >
                  <AlertTriangle className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50 rounded-2xl px-4 py-3 border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold text-sm">Mốc hiện tại đã hoàn thành</span>
                </div>
                {currentMilestoneIdx < (todayItinerary?.itineraryDetails?.length ?? 0) - 1 && (
                  <button
                    onClick={() => setCurrentMilestoneIdx(i => i + 1)}
                    className="flex items-center gap-1 text-sm font-bold text-blue-600 active:opacity-70"
                  >
                    Tiếp <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ DELAY MODAL ════════════════ */}
      {showDelayModal && currentDetail && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDelayModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl lg:rounded-3xl shadow-2xl p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Báo cáo sự cố / Trễ giờ</h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentDetail.title}</p>
              </div>
              <button onClick={() => setShowDelayModal(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-600 mb-3">Chọn lý do (bấm để chọn nhanh):</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {DELAY_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedDelayReason(r)}
                  className={`px-3 py-3 rounded-xl text-xs font-semibold text-left transition-all ${
                    selectedDelayReason === r
                      ? "bg-amber-500 text-white border-2 border-amber-500"
                      : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-amber-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleMilestoneCheckIn(currentDetail, "SKIPPED", selectedDelayReason)}
                disabled={submitting || !selectedDelayReason}
                className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm disabled:opacity-40 active:scale-[0.97]"
              >
                Bỏ qua mốc này
              </button>
              <button
                onClick={() => handleMilestoneCheckIn(currentDetail, "DELAYED", selectedDelayReason)}
                disabled={submitting || !selectedDelayReason}
                className="flex-1 py-3.5 rounded-2xl bg-amber-500 text-white font-bold text-sm disabled:opacity-40 active:scale-[0.97] shadow-md"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Báo cáo trễ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
