"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, MapPin, Users, FileText,
  ChevronLeft, ChevronRight, X, ArrowRight,
  Clock, CheckCircle2, PlayCircle, Circle,
  Plus, Edit, Trash2, Shield, AlertTriangle,
  DollarSign, Check, Info, RefreshCw, Send
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { tourService } from "@/services/tourService";
import { tourguideService } from "@/services/tourguideService";
import { vehicleService } from "@/services/vehicleService";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/useAuth";

// ─── Types ───────────────────────────────────────────────────────────────────
type ViewMode = "month" | "week" | "day";

interface Staff {
  id: string;
  userName: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  dateOfBirth: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TourTemplate {
  id: string;
  name: string;
  price: number;
  capacity: number;
  durationDays: number;
  durationNights: number;
  destination: string;
}

interface TourSchedule {
  id: string;
  tourId: string;
  tourName: string;
  destination: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  price: number;
  bookedPeople: number;
  capacity: number;
  guideId: string;
  guideName: string;
  vehicleId: string;
  vehicleName: string;
  active: boolean;
  note: string;
  status: "UPCOMING" | "RUNNING" | "FULL" | "CANCELLED" | "COMPLETED";
}

interface Vehicle {
  id: string;
  type: string;
  seatCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");
const toDateStr = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;

const fmt = (d?: string) => {
  if (!d) return "–";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("vi-VN");
  } catch (e) {
    return d;
  }
};

const formatVND = (price: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
};

const WEEKDAYS_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

// Styles matching status
const BADGE_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  UPCOMING: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200 border-l-4 border-l-emerald-500", dot: "bg-emerald-500" },
  RUNNING: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200 border-l-4 border-l-blue-500", dot: "bg-blue-500" },
  FULL: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200 border-l-4 border-l-amber-500", dot: "bg-amber-500" },
  CANCELLED: { bg: "bg-rose-50/50", text: "text-rose-600 line-through", border: "border-rose-100 border-l-4 border-l-rose-400", dot: "bg-rose-400" },
  COMPLETED: { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200 border-l-4 border-l-slate-400", dot: "bg-slate-400" },
};

export default function TourPlannerSchedule() {
  const router = useRouter();
  const user = useCurrentUser();

  // ── State ─────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data lists
  const [templates, setTemplates] = useState<TourTemplate[]>([]);
  const [schedules, setSchedules] = useState<TourSchedule[]>([]);
  const [guides, setGuides] = useState<Staff[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Selection state
  const [selectedSchedule, setSelectedSchedule] = useState<TourSchedule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [formTemplateId, setFormTemplateId] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formGuideId, setFormGuideId] = useState("");
  const [formVehicleId, setFormVehicleId] = useState("");
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCapacity, setFormCapacity] = useState<number>(20);
  const [formNote, setFormNote] = useState("");
  const [formActive, setFormActive] = useState(true);

  // Cancellation Modal
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancellingProgress, setIsCancellingProgress] = useState(false);
  const [kafkaLogs, setKafkaLogs] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Load Data ─────────────────────────────────────────────────────────────
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Tour Templates
      const tourRes = await tourService.getTours();
      let tourList: TourTemplate[] = [];
      let scheduleList: TourSchedule[] = [];
      
      if (tourRes.success && tourRes.data) {
        tourList = tourRes.data.map(t => ({
          id: t.id,
          name: t.name,
          price: t.price || 0,
          capacity: t.capacity || 20,
          durationDays: t.durationDays || 1,
          durationNights: t.durationNights || 0,
          destination: t.destination || ""
        }));
        setTemplates(tourList);

        // Flatten all schedules from templates
        tourRes.data.forEach((t: any) => {
          if (t.schedules && Array.isArray(t.schedules)) {
            t.schedules.forEach((sch: any) => {
              // Determine status
              let status: TourSchedule["status"] = "UPCOMING";
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const start = new Date(sch.startDate);
              const end = new Date(sch.endDate);
              const booked = sch.bookedPeople || 0;
              const cap = t.capacity || 20;

              if (!sch.active) {
                status = "CANCELLED";
              } else if (end < today) {
                status = "COMPLETED";
              } else if (booked >= cap) {
                status = "FULL";
              } else if (start <= today && end >= today) {
                status = "RUNNING";
              }

              scheduleList.push({
                id: sch.id,
                tourId: t.id,
                tourName: t.name,
                destination: t.destination || "",
                startDate: sch.startDate,
                endDate: sch.endDate,
                price: sch.price || t.price || 0,
                bookedPeople: booked,
                capacity: cap,
                guideId: sch.guideId || "",
                guideName: sch.guideName || "Chưa phân công",
                vehicleId: sch.vehicle?.id || sch.vehicleId || "",
                vehicleName: sch.vehicle?.type || "Xe du lịch",
                active: sch.active ?? true,
                note: sch.note || "",
                status
              });
            });
          }
        });
      }
      setSchedules(scheduleList);

      // 2. Fetch Tour Guides
      const guideRes = await tourguideService.getTourGuides();
      if (guideRes.success && guideRes.data) {
        setGuides(guideRes.data.filter(g => g.isActive));
      }

      // 3. Fetch Vehicles
      const vehRes = await vehicleService.getVehicles();
      if (vehRes.success && vehRes.data) {
        setVehicles(vehRes.data.map((v: any) => ({
          id: v.id,
          type: v.type,
          seatCount: v.seatCount || 0
        })));
      }

    } catch (err) {
      console.error("Failed to fetch schedule data:", err);
      setError("Không thể đồng bộ dữ liệu lịch trình từ máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Calculate End Date when Start Date or Template changes
  useEffect(() => {
    if (formStartDate && formTemplateId) {
      const template = templates.find(t => t.id === formTemplateId);
      if (template) {
        const days = template.durationDays || 1;
        const start = new Date(formStartDate);
        const end = new Date(start);
        end.setDate(start.getDate() + (days - 1));
        
        const y = end.getFullYear();
        const m = end.getMonth();
        const d = end.getDate();
        setFormEndDate(toDateStr(y, m, d));
      }
    }
  }, [formStartDate, formTemplateId, templates]);

  // Pre-fill fields when template is chosen
  const handleTemplateChange = (tid: string) => {
    setFormTemplateId(tid);
    const template = templates.find(t => t.id === tid);
    if (template) {
      setFormPrice(template.price);
      setFormCapacity(template.capacity);
    }
  };

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        if (!isEditing && !isCreating) {
          setSelectedSchedule(null);
        }
      }
    };
    if (selectedSchedule) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selectedSchedule, isEditing, isCreating]);

  // ── Navigation ───────────────────────────────────────────────────────────
  const goToday = () => setCurrentDate(new Date());
  const navigate = (dir: 1 | -1) => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + dir);
    else if (viewMode === "week") d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const getTitle = () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    if (viewMode === "month") return `${MONTH_NAMES[m]} ${y}`;
    if (viewMode === "week") {
      const startW = new Date(currentDate);
      const dow = startW.getDay() === 0 ? 6 : startW.getDay() - 1;
      startW.setDate(startW.getDate() - dow);
      const endW = new Date(startW); endW.setDate(endW.getDate() + 6);
      return `${startW.getDate()}/${startW.getMonth() + 1} – ${endW.getDate()}/${endW.getMonth() + 1}/${y}`;
    }
    return currentDate.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // Get schedules for a specific date
  const getSchedulesForDay = (dateStr: string) =>
    schedules.filter(s => dateStr >= s.startDate && dateStr <= s.endDate);

  // ── Create Schedule Action ───────────────────────────────────────────────
  const handleOpenCreate = (dateStr?: string) => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedSchedule(null);
    setFormTemplateId(templates[0]?.id || "");
    setFormStartDate(dateStr || toDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
    setFormGuideId("");
    setFormVehicleId(vehicles[0]?.id || "");
    setFormPrice(templates[0]?.price || 0);
    setFormCapacity(templates[0]?.capacity || 20);
    setFormNote("");
    setFormActive(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTemplateId || !formStartDate || !formEndDate || !formVehicleId) {
      alert("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    setLoading(true);
    try {
      const id = "TS" + Date.now();
      const payload = {
        id,
        tour: { id: formTemplateId },
        vehicle: { id: formVehicleId },
        startDate: formStartDate,
        endDate: formEndDate,
        price: formPrice,
        bookedPeople: 0,
        availableSlot: formCapacity,
        isActive: formActive,
        note: formNote,
        status: "UPCOMING",
        // Assign guide if selected
        ...(formGuideId && { guideId: formGuideId })
      };

      const res = await tourService.createTourSchedule(payload);
      if (res.success) {
        alert("🎉 Mở bán lịch trình tour thành công!");
        setIsCreating(false);
        await loadAllData();
      } else {
        alert("Lỗi: " + res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi mở bán lịch trình.");
    } finally {
      setLoading(false);
    }
  };

  // ── Edit Schedule Action ─────────────────────────────────────────────────
  const handleOpenEdit = (sch: TourSchedule) => {
    setIsEditing(true);
    setIsCreating(false);
    setFormTemplateId(sch.tourId);
    setFormStartDate(sch.startDate);
    setFormEndDate(sch.endDate);
    setFormGuideId(sch.guideId);
    setFormVehicleId(sch.vehicleId);
    setFormPrice(sch.price);
    setFormCapacity(sch.capacity);
    setFormNote(sch.note);
    setFormActive(sch.active);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;

    setLoading(true);
    try {
      const hasBookings = selectedSchedule.bookedPeople > 0;
      
      const payload: any = {
        vehicle: { id: formVehicleId },
        startDate: formStartDate,
        endDate: formEndDate,
        note: formNote,
        isActive: formActive,
        ...(formGuideId && { guideId: formGuideId })
      };

      // Only allow editing price if no bookings
      if (!hasBookings) {
        payload.price = formPrice;
      }

      const res = await tourService.updateTourSchedule(selectedSchedule.id, payload);
      if (res.success) {
        if (hasBookings) {
          // Trigger mock Kafka messaging system
          alert("🎉 Cập nhật lịch trình thành công!\n⚠️ Đã kích hoạt Kafka phát sóng: Gửi Email/SMS cảnh báo thay đổi hành trình khẩn cấp đến " + selectedSchedule.bookedPeople + " khách hàng đã đặt vé.");
        } else {
          alert("🎉 Cập nhật lịch trình thành công!");
        }
        setIsEditing(false);
        setSelectedSchedule(null);
        await loadAllData();
      } else {
        alert("Lỗi: " + res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi cập nhật lịch trình.");
    } finally {
      setLoading(false);
    }
  };

  // ── Cancellation (Emergency) Flow ───────────────────────────────────────
  const handleOpenCancel = () => {
    setCancelReason("");
    setKafkaLogs([]);
    setIsCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedSchedule) return;
    if (!cancelReason.trim()) {
      alert("Vui lòng nhập lý do hủy chuyến.");
      return;
    }

    setIsCancellingProgress(true);
    setKafkaLogs(["[Kafka] 🚀 Khởi động chuỗi xử lý sự cố khẩn cấp..."]);

    try {
      // Simulate steps with timeout for impressive visualization
      await new Promise(r => setTimeout(r, 800));
      setKafkaLogs(prev => [...prev, `[Kafka] 📂 Đang khóa lịch trình Tour ID: ${selectedSchedule.id}`]);
      
      // Call actual soft delete API
      const res = await tourService.updateTourSchedule(selectedSchedule.id, { isActive: false });
      if (!res.success) throw new Error(res.message);

      await new Promise(r => setTimeout(r, 800));
      setKafkaLogs(prev => [...prev, `[Kafka] 💳 Liên kết MoMo: Khởi động lệnh hoàn tiền 100% cho ${selectedSchedule.bookedPeople} khách hàng...`]);

      await new Promise(r => setTimeout(r, 1000));
      setKafkaLogs(prev => [...prev, `[Momo] 💸 Hoàn thành giao dịch chuyển tiền hoàn: +${formatVND(selectedSchedule.price * selectedSchedule.bookedPeople)} VND vào ví khách hàng.`]);

      await new Promise(r => setTimeout(r, 800));
      setKafkaLogs(prev => [...prev, `[Kafka] ✉️ Bắn thông báo Email & SMS thông báo xin lỗi kèm đền bù sự cố...`]);

      await new Promise(r => setTimeout(r, 800));
      setKafkaLogs(prev => [...prev, `[System] 🏁 Xử lý hoàn tất! Trạng thái lịch trình đã chuyển sang [CANCELLED].`]);
      
      await new Promise(r => setTimeout(r, 500));
      alert("🎉 Xử lý hủy lịch trình khẩn cấp & hoàn tiền qua Kafka hoàn tất thành công!");
      setIsCancelDialogOpen(false);
      setSelectedSchedule(null);
      await loadAllData();

    } catch (err) {
      console.error(err);
      alert("Hủy lịch trình thất bại: " + (err instanceof Error ? err.message : ""));
    } finally {
      setIsCancellingProgress(false);
    }
  };

  // ── Month View Grid Render ────────────────────────────────────────────────
  const renderMonth = () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    let firstDow = new Date(y, m, 1).getDay();
    firstDow = firstDow === 0 ? 6 : firstDow - 1; // Mon = 0

    const todayStr = toDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    return (
      <div className="rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {WEEKDAYS_SHORT.map((d, i) => (
            <div key={d} className={`py-3 text-center text-xs font-semibold uppercase tracking-wide ${i >= 5 ? "text-emerald-500" : "text-slate-400"}`}>
              {d}
            </div>
          ))}
        </div>
        {/* Day Grid */}
        <div className="grid grid-cols-7" style={{ gridAutoRows: "minmax(120px, auto)" }}>
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`pre-${i}`} className="bg-slate-50/20 border-b border-r border-slate-100 p-2" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dateStr = toDateStr(y, m, day);
            const daySchedules = getSchedulesForDay(dateStr);
            const isToday = dateStr === todayStr;
            const colIdx = (firstDow + day - 1) % 7;
            const isWeekend = colIdx >= 5;

            return (
              <div
                key={day}
                className={`border-b border-r border-slate-100 p-2 flex flex-col justify-between transition-all hover:bg-slate-50/50 ${
                  isToday ? "bg-emerald-50/20" : isWeekend ? "bg-slate-50/10" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                    isToday ? "bg-emerald-600 text-white shadow-sm" : isWeekend ? "text-emerald-500" : "text-slate-600"
                  }`}>
                    {day}
                  </span>
                  
                  {/* Quick Add Schedule button on hover */}
                  <button
                    onClick={() => handleOpenCreate(dateStr)}
                    title="Mở bán lịch trình vào ngày này"
                    className="opacity-0 hover:opacity-100 group-hover:opacity-100 p-1 bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white rounded-md transition-all scale-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px] scrollbar-thin">
                  {daySchedules.map(sch => {
                    const style = BADGE_STYLE[sch.status];
                    return (
                      <button
                        key={sch.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSchedule(sch);
                          setIsEditing(false);
                          setIsCreating(false);
                        }}
                        className={`w-full text-left text-[11px] font-semibold px-2 py-1 rounded-md truncate border ${style.border} ${style.bg} ${style.text} transition-all hover:scale-[1.02] active:scale-95`}
                      >
                        <span className="font-bold">{sch.tourName}</span>
                        <div className="text-[9px] opacity-80 font-normal">
                          Đã bán {sch.bookedPeople}/{sch.capacity}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Week View Grid Render ─────────────────────────────────────────────────
  const renderWeek = () => {
    const startW = new Date(currentDate);
    const dow = startW.getDay() === 0 ? 6 : startW.getDay() - 1;
    startW.setDate(startW.getDate() - dow);
    const days = Array.from({ length: 7 }, (_, i) => {
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
              <div key={i} className={`p-3 text-center border-r border-slate-100 last:border-r-0 ${isToday ? "bg-emerald-50" : ""}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${i >= 5 ? "text-emerald-500" : "text-slate-400"}`}>{WEEKDAYS_SHORT[i]}</p>
                <span className={`mt-1 inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-bold ${isToday ? "bg-emerald-600 text-white" : "text-slate-700"}`}>
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 min-h-[360px]">
          {days.map((d, i) => {
            const dateStr = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
            const daySchedules = getSchedulesForDay(dateStr);
            return (
              <div key={i} className="border-r border-slate-100 last:border-r-0 p-2 space-y-2 bg-slate-50/10">
                {daySchedules.map(sch => {
                  const style = BADGE_STYLE[sch.status];
                  return (
                    <button
                      key={sch.id}
                      onClick={() => {
                        setSelectedSchedule(sch);
                        setIsEditing(false);
                        setIsCreating(false);
                      }}
                      className={`w-full text-left text-xs font-medium p-2.5 rounded-xl border transition-all hover:scale-[1.03] shadow-sm ${style.border} ${style.bg} ${style.text}`}
                    >
                      <p className="font-bold truncate">{sch.tourName}</p>
                      <p className="opacity-70 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {sch.destination}</p>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Day View Grid Render ──────────────────────────────────────────────────
  const renderDay = () => {
    const dateStr = toDateStr(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const daySchedules = getSchedulesForDay(dateStr);
    return (
      <div className="rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900 capitalize">
              {currentDate.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">{daySchedules.length} lịch trình trong ngày này</p>
          </div>
          <Button onClick={() => handleOpenCreate(dateStr)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1">
            <Plus className="w-4 h-4" /> Mở bán
          </Button>
        </div>
        {daySchedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <CalendarDays className="w-16 h-16 mb-4" />
            <p className="text-lg font-bold">Trống lịch trình</p>
            <p className="text-sm mt-1">Không có lịch trình mở bán cho ngày này.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {daySchedules.map(sch => {
              const style = BADGE_STYLE[sch.status];
              return (
                <button
                  key={sch.id}
                  onClick={() => {
                    setSelectedSchedule(sch);
                    setIsEditing(false);
                    setIsCreating(false);
                  }}
                  className="w-full text-left flex items-start gap-5 p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1 ${style.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-slate-900 text-base truncate">{sch.tourName}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${style.border} ${style.bg} ${style.text}`}>
                        {sch.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-emerald-500" /> {fmt(sch.startDate)} → {fmt(sch.endDate)}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-rose-500" /> {sch.destination}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-500" /> {sch.bookedPeople}/{sch.capacity} đã đặt</span>
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

  // ── Render Page ───────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản Lý Lịch Trình (Tour Schedules)</h1>
          <p className="text-slate-500 mt-2">Mở bán lịch trình từ khuôn mẫu, phân công điều hành hướng dẫn viên & theo dõi trạng thái.</p>
        </div>
        <Button
          onClick={() => handleOpenCreate()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2 px-5 py-6 shadow-md"
        >
          <Plus className="w-5 h-5" /> Mở bán lịch trình
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            Hôm nay
          </button>
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all text-slate-600">
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
          <button onClick={() => navigate(1)} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all text-slate-600">
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
          <span className="text-lg font-bold text-slate-900 ml-2">{getTitle()}</span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {(["month", "week", "day"] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === v ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {v === "month" ? "Tháng" : v === "week" ? "Tuần" : "Ngày"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Calendar View and Side Panel */}
      <div className="flex gap-6 items-start">
        {/* Calendar Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center h-96 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-sm font-medium">Đang đồng bộ dữ liệu lịch trình...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">Không thể tải lịch trình</h3>
              <p className="text-slate-500 text-sm mt-1">{error}</p>
              <Button onClick={loadAllData} className="mt-4 bg-emerald-600 text-white rounded-xl">Thử lại</Button>
            </div>
          ) : (
            <>
              {viewMode === "month" && renderMonth()}
              {viewMode === "week" && renderWeek()}
              {viewMode === "day" && renderDay()}
            </>
          )}
        </div>

        {/* Side Panel: Drawer */}
        <div
          ref={panelRef}
          className={`bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden transition-all duration-300 ${
            selectedSchedule || isCreating ? "w-[420px] opacity-100" : "w-0 opacity-0 pointer-events-none"
          }`}
        >
          {/* CREATE SCHEDULE FORM */}
          {isCreating && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" /> Mở bán Lịch trình Mới
                </h2>
                <button onClick={() => setIsCreating(false)} className="p-1 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Chọn Khuôn mẫu Tour (Template) *</label>
                  <select
                    value={formTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    title="Chọn khuôn mẫu"
                  >
                    <option value="" disabled>-- Vui lòng chọn --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (Gốc: {formatVND(t.price)})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày khởi hành *</label>
                    <Input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="rounded-xl border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày kết thúc *</label>
                    <Input
                      type="date"
                      value={formEndDate}
                      disabled
                      className="rounded-xl border-slate-200 bg-slate-50 text-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phân công HDV</label>
                    <select
                      value={formGuideId}
                      onChange={(e) => setFormGuideId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      title="Chọn hướng dẫn viên"
                    >
                      <option value="">Chưa phân công</option>
                      {guides.map(g => (
                        <option key={g.id} value={g.id}>{g.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phương tiện vận chuyển *</label>
                    <select
                      value={formVehicleId}
                      onChange={(e) => setFormVehicleId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      title="Chọn phương tiện"
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.type} ({v.seatCount} chỗ)</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Giá bán chốt (VND) *</label>
                    <Input
                      type="number"
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="rounded-xl border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sức chứa khách *</label>
                    <Input
                      type="number"
                      value={formCapacity}
                      onChange={(e) => setFormCapacity(Number(e.target.value))}
                      className="rounded-xl border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ghi chú điều hành</label>
                  <Textarea
                    placeholder="Nhập ghi chú điều hành cho hướng dẫn viên hoặc tài xế..."
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    className="rounded-xl border-slate-200"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="create-active"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="create-active" className="text-sm font-semibold text-slate-700">Kích hoạt mở bán ngay (OPENING)</label>
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold mt-4">
                  Xác nhận Mở bán
                </Button>
              </form>
            </div>
          )}

          {/* VIEW & EDIT SCHEDULE INFO */}
          {selectedSchedule && !isCreating && (
            <div className="overflow-y-auto max-h-[85vh]">
              {/* Header Colored by Status */}
              <div className={`p-6 text-white relative ${
                selectedSchedule.status === "UPCOMING" ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                : selectedSchedule.status === "RUNNING" ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                : selectedSchedule.status === "FULL" ? "bg-gradient-to-br from-amber-500 to-orange-600"
                : "bg-gradient-to-br from-slate-500 to-slate-600"
              }`}>
                <button
                  onClick={() => setSelectedSchedule(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/20 border border-white/20">
                    LỊCH TRÌNH
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white text-slate-800">
                    {selectedSchedule.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold leading-tight">{selectedSchedule.tourName}</h2>
                <p className="text-white/80 text-xs mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selectedSchedule.destination}</p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {!isEditing ? (
                  /* Read Only Details */
                  <div className="space-y-4">
                    {/* Progress Indicator */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tình trạng đặt vé</p>
                        <p className="text-lg font-bold text-slate-800 mt-1">{selectedSchedule.bookedPeople} / {selectedSchedule.capacity} Khách</p>
                      </div>
                      <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-emerald-500 flex items-center justify-center font-bold text-slate-700 text-xs shadow-sm">
                        {Math.round((selectedSchedule.bookedPeople / selectedSchedule.capacity) * 100)}%
                      </div>
                    </div>

                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                        <DollarSign className="w-4 h-4 text-emerald-500 mb-1" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Giá bán chốt</span>
                        <p className="text-sm font-bold text-slate-800">{formatVND(selectedSchedule.price)}</p>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                        <Users className="w-4 h-4 text-blue-500 mb-1" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Hướng dẫn viên</span>
                        <p className="text-sm font-bold text-slate-800 truncate">{selectedSchedule.guideName}</p>
                      </div>
                    </div>

                    {/* Timeline Block */}
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                          <CalendarDays className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Khởi hành</p>
                          <p className="text-sm font-semibold text-slate-700">{fmt(selectedSchedule.startDate)}</p>
                        </div>
                      </div>
                      <div className="border-l-2 border-dashed border-slate-200 ml-4.5 h-3" />
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                          <CalendarDays className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Kết thúc</p>
                          <p className="text-sm font-semibold text-slate-700">{fmt(selectedSchedule.endDate)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle */}
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold">Xe chuyên chở</p>
                          <p className="text-sm font-semibold text-slate-700">{selectedSchedule.vehicleName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedSchedule.note && (
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-700">
                          <Info className="w-4 h-4" />
                          <span className="text-xs font-bold">Ghi chú điều hành</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{selectedSchedule.note}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {selectedSchedule.status !== "COMPLETED" && (
                      <div className="space-y-2 pt-4 border-t border-slate-100">
                        <Button
                          onClick={() => handleOpenEdit(selectedSchedule)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold py-2.5"
                        >
                          <Edit className="w-4.5 h-4.5" /> Chỉnh sửa lịch trình
                        </Button>
                        <Button
                          onClick={handleOpenCancel}
                          variant="destructive"
                          className="w-full rounded-xl gap-2 font-bold py-2.5"
                        >
                          <Trash2 className="w-4.5 h-4.5" /> Hủy mở bán chuyến đi
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* EDITING FORM */
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    {/* Lock Warning if Booked */}
                    {selectedSchedule.bookedPeople > 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase">
                          <AlertTriangle className="w-4.5 h-4.5" /> Quy định thay đổi khẩn cấp
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          ⚠️ Đang có <b>{selectedSchedule.bookedPeople} khách hàng</b> đã đặt vé! Cấm tuyệt đối thay đổi giá bán lẻ.
                          Nếu thay đổi ngày, xe hoặc HDV, hệ thống sẽ tự động kích hoạt <b>Kafka Event</b> phát cảnh báo khẩn cấp (SMS & Email) đến toàn bộ hành khách.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày khởi hành *</label>
                      <Input
                        type="date"
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày kết thúc *</label>
                      <Input
                        type="date"
                        value={formEndDate}
                        disabled
                        className="rounded-xl border-slate-200 bg-slate-50 text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Giá bán chốt (VND)</label>
                      <Input
                        type="number"
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        disabled={selectedSchedule.bookedPeople > 0}
                        className={`rounded-xl border-slate-200 ${
                          selectedSchedule.bookedPeople > 0 ? "bg-slate-50 text-slate-400" : ""
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phân công HDV</label>
                      <select
                        value={formGuideId}
                        onChange={(e) => setFormGuideId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                        title="Chọn hướng dẫn viên"
                      >
                        <option value="">Chưa phân công</option>
                        {guides.map(g => (
                          <option key={g.id} value={g.id}>{g.fullName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Xe chuyên chở</label>
                      <select
                        value={formVehicleId}
                        onChange={(e) => setFormVehicleId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                        title="Chọn phương tiện"
                      >
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.type} ({v.seatCount} chỗ)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ghi chú điều hành</label>
                      <Textarea
                        value={formNote}
                        onChange={(e) => setFormNote(e.target.value)}
                        className="rounded-xl border-slate-200"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="edit-active"
                        checked={formActive}
                        onChange={(e) => setFormActive(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="edit-active" className="text-sm font-semibold text-slate-700">Mở bán lịch trình</label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 rounded-xl font-bold py-2.5"
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold py-2.5"
                      >
                        Cập nhật
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CANCELLATION EMERGENCY DIALOG (MOCK KAFKA / MOMO INTEGRATION) */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-rose-600 font-extrabold flex items-center gap-2 text-lg">
              <AlertTriangle className="w-6 h-6 text-rose-500 animate-pulse" /> HỦY LỊCH TRÌNH KHẨN CẤP (SỰ CỐ)
            </DialogTitle>
          </DialogHeader>

          {selectedSchedule && (
            <div className="space-y-4 mt-2">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-2">
                <p className="text-xs text-rose-700 leading-relaxed">
                  ⚠️ <b>CẢNH BÁO CAO ĐỘ:</b> Lịch trình <b>{selectedSchedule.tourName}</b> đang có <b>{selectedSchedule.bookedPeople} hành khách</b> đã thanh toán vé.
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Khi thực hiện Hủy, hệ thống sẽ:
                  <br />1. Tự động chuyển trạng thái lịch trình thành <b>[CANCELLED_BY_ADMIN]</b>.
                  <br />2. Hủy hiệu lực toàn bộ vé đã xuất.
                  <br />3. Kích hoạt giao dịch của <b>Momo API</b> tự động hoàn trả 100% tiền vé cho khách hàng.
                  <br />4. Bắn sự kiện lỗi dịch vụ sang <b>Kafka Queue</b> gửi Email & SMS xin lỗi kèm đền bù sự cố.
                </p>
              </div>

              {!isCancellingProgress ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Lý do hủy chuyến (bắt buộc gửi khách hàng) *</label>
                  <Textarea
                    placeholder="e.g. Do ảnh hưởng của bão số 3 đổ bộ trực tiếp vào Nha Trang nên không đảm bảo an toàn hành trình..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="rounded-xl border-slate-200 text-xs"
                    rows={3}
                  />
                </div>
              ) : (
                /* Kafka logs visualizer */
                <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[10px] space-y-1.5 min-h-[140px] max-h-[180px] overflow-y-auto scrollbar-thin">
                  {kafkaLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="text-emerald-500">&gt;</span>
                      <p className="leading-snug">{log}</p>
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
                <Button
                  disabled={isCancellingProgress}
                  variant="outline"
                  onClick={() => setIsCancelDialogOpen(false)}
                  className="rounded-xl font-bold"
                >
                  Bỏ qua
                </Button>
                <Button
                  disabled={isCancellingProgress}
                  onClick={handleCancelConfirm}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold gap-1"
                >
                  {isCancellingProgress ? (
                    <>Đang gộp xử lý sự cố...</>
                  ) : (
                    <>Kích hoạt hủy & hoàn tiền</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
