"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  CalendarDays, MapPin, Users, Star, Clock, ArrowLeft,
  Phone, Mail, CheckCircle2, Circle, ChevronRight,
  Bus, CreditCard, UserCheck, AlertCircle, Package,
  Utensils, Navigation, Binoculars, Hotel, FileText,
  Search, Banknote, Baby, TrendingUp, XCircle
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";

// ─── Types ──────────────────────────────────────────────────────────────────
interface TourInfo {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  durationNights: number;
  price: number;
  rating: number;
  startDestination?: { name: string };
  endDestination?: { name: string };
}

interface TourScheduleInfo {
  id: string;
  startDate: string;
  endDate: string;
  bookedPeople: number;
  availableSlot: number;
  price: number;
  isActive: boolean;
  note: string;
  tour: TourInfo;
}

interface BookingInfo {
  id: string;
  adults: number;
  children: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  pointUsed: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  bookingDate: string;
  paymentDate?: string;
  customer?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    address?: string;
    dateOfBirth?: string;
  };
}

// ─── Itinerary Types ─────────────────────────────────────────────────────────
interface ItineraryDetail {
  id: string;
  timeFrame: string;
  activityType: "TRANSPORT" | "DINING" | "VISIT" | "CHECKIN" | string;
  title: string;
  note?: string;
  location?: { id: string; name: string };
}

interface TourItinerary {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
  itineraryDetails: ItineraryDetail[];
}

// ─── Activity type config ─────────────────────────────────────────────────────
const ACTIVITY_CONFIG: Record<string, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  TRANSPORT: { icon: Navigation, bg: "bg-blue-100", text: "text-blue-600", label: "Di chuyển" },
  DINING: { icon: Utensils, bg: "bg-amber-100", text: "text-amber-600", label: "Ăn uống" },
  VISIT: { icon: Binoculars, bg: "bg-emerald-100", text: "text-emerald-600", label: "Tham quan" },
  CHECKIN: { icon: Hotel, bg: "bg-purple-100", text: "text-purple-600", label: "Khách sạn" },
};
const getActivity = (type: string) =>
  ACTIVITY_CONFIG[type] ?? { icon: Circle, bg: "bg-slate-100", text: "text-slate-500", label: type };


// ─── Helper ──────────────────────────────────────────────────────────────────
const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("vi-VN") : "–";
const fmtCurrency = (n?: number) =>
  n != null ? n.toLocaleString("vi-VN") + " ₫" : "–";

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    CONFIRMED: "bg-emerald-100 text-emerald-700",
    PENDING: "bg-amber-100  text-amber-700",
    CANCELLED: "bg-red-100    text-red-700",
    PAID: "bg-blue-100   text-blue-700",
    UNPAID: "bg-slate-100  text-slate-600",
  };
  const cls = map[status?.toUpperCase()] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${cls}`}>
      {status ?? "–"}
    </span>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default function TourDetailPage() {
  const { scheduleId } = useParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"info" | "guests" | "itinerary">("info");
  const [schedule, setSchedule] = useState<TourScheduleInfo | null>(null);
  const [bookings, setBookings] = useState<BookingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [itineraries, setItineraries] = useState<TourItinerary[]>([]);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [itineraryLoaded, setItineraryLoaded] = useState(false);
  const [guestSearch, setGuestSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CONFIRMED" | "PENDING" | "CANCELLED">("ALL");

  useEffect(() => {
    if (!scheduleId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [schedRes, bookRes] = await Promise.all([
          apiClient.get(`/tour-schedules/${scheduleId}`),
          apiClient.get(`/bookings/schedule/${scheduleId}`),
        ]);
        if (schedRes.success) setSchedule(schedRes.data);
        if (bookRes.success) setBookings(bookRes.data ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [scheduleId]);

  const tour = schedule?.tour;

  // ── Computed guest stats ──────────────────────────────────────────────────
  const totalAdults = bookings.reduce((s, b) => s + (b.adults ?? 0), 0);
  const totalChildren = bookings.reduce((s, b) => s + (b.children ?? 0), 0);
  const totalGuests = totalAdults + totalChildren;
  const totalRevenue = bookings.reduce((s, b) => s + (b.finalPrice ?? b.totalPrice ?? 0), 0);
  const totalDiscount = bookings.reduce((s, b) => s + (b.discountAmount ?? 0), 0);
  const paidCount = bookings.filter(b => b.paymentStatus?.toUpperCase() === "PAID").length;
  const confirmedCount = bookings.filter(b => b.status?.toUpperCase() === "CONFIRMED").length;
  const pendingCount = bookings.filter(b => b.status?.toUpperCase() === "PENDING").length;
  const cancelledCount = bookings.filter(b => b.status?.toUpperCase() === "CANCELLED").length;

  // ── Filtered bookings ─────────────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    let list = bookings;
    if (statusFilter !== "ALL") {
      list = list.filter(b => b.status?.toUpperCase() === statusFilter);
    }
    if (guestSearch.trim()) {
      const q = guestSearch.toLowerCase();
      list = list.filter(b =>
        b.customer?.fullName?.toLowerCase().includes(q) ||
        b.customer?.phone?.includes(q) ||
        b.customer?.email?.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [bookings, statusFilter, guestSearch]);

  const TABS = [
    { key: "info", label: "Thông tin Tour" },
    { key: "guests", label: `Danh sách khách (${totalGuests ?? 0})` },
    { key: "itinerary", label: `Lịch trình (${tour?.durationDays ?? "–"} ngày)` },
  ] as const;

  // Lazy-fetch itineraries khi người dùng chuyển sang tab "Lịch trình"
  useEffect(() => {
    if (activeTab !== "itinerary" || itineraryLoaded || !schedule?.tour?.id) return;
    const fetchItineraries = async () => {
      setItineraryLoading(true);
      try {
        const res = await apiClient.get(`/tour-itineraries/tour/${schedule.tour.id}`);
        if (res.success && res.data) {
          // Sắp xếp theo dayNumber và detail theo timeFrame
          const sorted: TourItinerary[] = (res.data as TourItinerary[])
            .sort((a, b) => a.dayNumber - b.dayNumber)
            .map(itin => ({
              ...itin,
              itineraryDetails: (itin.itineraryDetails ?? []).sort((a, b) =>
                (a.timeFrame ?? "").localeCompare(b.timeFrame ?? "")
              ),
            }));
          setItineraries(sorted);
        }
      } catch (e) {
        console.error("Failed to fetch itineraries:", e);
      } finally {
        setItineraryLoading(false);
        setItineraryLoaded(true);
      }
    };
    fetchItineraries();
  }, [activeTab, itineraryLoaded, schedule]);

  return (
    <DashboardLayout>
      {/* ── Back button ── */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại lịch
      </button>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !schedule ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
          <AlertCircle className="w-12 h-12" />
          <p className="text-lg font-medium">Không tìm thấy lịch tour</p>
        </div>
      ) : (
        <>
          {/* ── Hero header ── */}
          <div className="relative overflow-hidden rounded-3xl mb-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 shadow-xl">
            {/* decorative circles */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-white/5 rounded-full" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3
                    ${schedule.isActive ? "bg-emerald-400/20 text-emerald-300" : "bg-slate-400/20 text-slate-300"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${schedule.isActive ? "bg-emerald-400" : "bg-slate-400"}`} />
                    {schedule.isActive ? "Đang mở" : "Đã đóng"}
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug max-w-2xl">
                    {tour?.name ?? "–"}
                  </h1>
                </div>
                {tour?.rating && (
                  <div className="flex items-center gap-1.5 bg-amber-400/20 px-4 py-2 rounded-2xl">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="text-amber-300 font-bold text-lg">{tour.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {[
                  { icon: CalendarDays, label: "Khởi hành", value: fmt(schedule.startDate) },
                  { icon: Clock, label: "Kết thúc", value: fmt(schedule.endDate) },
                  { icon: Users, label: "Đã đặt", value: `${schedule.bookedPeople ?? 0} người` },
                  { icon: MapPin, label: "Điểm đến", value: tour?.endDestination?.name ?? "–" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-blue-200 text-xs mb-1">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </div>
                    <p className="text-white font-semibold text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-6 w-fit">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === key
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ══════════ TAB: INFO ══════════ */}
          {activeTab === "info" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: description + stats */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white">
                  <h2 className="text-base font-bold text-slate-900 mb-4">Mô tả tour</h2>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {tour?.description ?? "Chưa có mô tả cho tour này."}
                  </p>
                </Card>

                <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white">
                  <h2 className="text-base font-bold text-slate-900 mb-4">Thống kê lịch khởi hành</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Tổng khách đặt", value: totalGuests + " người", color: "bg-blue-50 text-blue-700" },
                      { label: "Slots còn lại", value: (schedule.availableSlot ?? 0) + " chỗ", color: "bg-emerald-50 text-emerald-700" },
                      { label: "Doanh thu", value: fmtCurrency(totalRevenue), color: "bg-amber-50 text-amber-700" },
                      { label: "Giá lịch này", value: fmtCurrency(schedule.price), color: "bg-purple-50 text-purple-700" },
                      { label: "Thời gian", value: `${tour?.durationDays ?? "–"} ngày ${tour?.durationNights ?? "–"} đêm`, color: "bg-pink-50 text-pink-700" },
                      { label: "Số bookings", value: bookings.length + " đơn", color: "bg-slate-50 text-slate-700" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className={`rounded-2xl p-4 ${color}`}>
                        <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
                        <p className="text-base font-bold">{value}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {schedule.note && (
                  <Card className="border-0 shadow-sm rounded-3xl p-6 bg-amber-50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-amber-800 text-sm mb-1">Ghi chú từ điều hành</h3>
                        <p className="text-amber-700 text-sm">{schedule.note}</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Right: sidebar info */}
              <div className="flex flex-col gap-4">
                <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white">
                  <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-500" />
                    Chi tiết lịch
                  </h2>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: "Mã lịch", value: schedule.id },
                      { label: "Khởi hành", value: fmt(schedule.startDate) },
                      { label: "Kết thúc", value: fmt(schedule.endDate) },
                      { label: "Điểm bắt đầu", value: tour?.startDestination?.name ?? "–" },
                      { label: "Điểm đến", value: tour?.endDestination?.name ?? "–" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-start gap-2">
                        <span className="text-slate-500">{label}</span>
                        <span className="text-slate-900 font-medium text-right text-xs">{value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white">
                  <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Bus className="w-4 h-4 text-purple-500" />
                    Trạng thái chỗ
                  </h2>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Đã đặt: {schedule.bookedPeople ?? 0}</span>
                      <span>Còn lại: {schedule.availableSlot ?? 0}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((schedule.bookedPeople ?? 0) / ((schedule.bookedPeople ?? 0) + (schedule.availableSlot ?? 1))) * 100)}%` }}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ══════════ TAB: GUESTS ══════════ */}
          {activeTab === "guests" && (
            <div className="flex flex-col gap-4">

              {/* ── Stat cards ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Users, label: "Tổng khách", value: `${totalGuests} người`, sub: `${totalAdults} NL · ${totalChildren} TE`, color: "text-blue-600 bg-blue-50" },
                  { icon: UserCheck, label: "Đã xác nhận", value: `${confirmedCount} đơn`, sub: `${cancelledCount} đã hủy`, color: "text-emerald-600 bg-emerald-50" },
                  { icon: CreditCard, label: "Đã thanh toán", value: `${paidCount}/${bookings.length}`, sub: fmtCurrency(totalRevenue), color: "text-purple-600 bg-purple-50" },
                  { icon: TrendingUp, label: "Giảm giá tổng", value: fmtCurrency(totalDiscount), sub: `${pendingCount} đơn chờ xử lý`, color: "text-amber-600 bg-amber-50" },
                ].map(({ icon: Icon, label, value, sub, color }) => (
                  <Card key={label} className="border-0 shadow-sm rounded-2xl p-4 bg-white">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color.split(" ")[1]}`}>
                      <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
                    </div>
                    <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
                  </Card>
                ))}
              </div>

              {/* ── Search & Filter ── */}
              <Card className="border-0 shadow-sm rounded-2xl p-4 bg-white">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên, SĐT, email hoặc mã đơn..."
                      value={guestSearch}
                      onChange={e => setGuestSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    {(["ALL", "CONFIRMED", "PENDING", "CANCELLED"] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${statusFilter === s
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                      >
                        {s === "ALL" ? "Tất cả" : s === "CONFIRMED" ? "Đã xác nhận" : s === "PENDING" ? "Chờ xử lý" : "Đã hủy"}
                      </button>
                    ))}
                  </div>
                </div>
                {(guestSearch || statusFilter !== "ALL") && (
                  <p className="text-xs text-slate-400 mt-2">
                    Hiển thị <span className="font-semibold text-slate-600">{filteredBookings.length}</span> / {bookings.length} đơn
                  </p>
                )}
              </Card>

              {/* ── Guest table ── */}
              <Card className="border-0 shadow-sm rounded-3xl bg-white overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">Danh sách booking</h2>
                  <span className="text-xs text-slate-400">{filteredBookings.length} đơn</span>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Users className="w-12 h-12 mb-3 opacity-40" />
                    <p className="font-medium">{bookings.length === 0 ? "Chưa có booking nào" : "Không tìm thấy kết quả"}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          {["#", "Khách hàng", "Số người", "Trạng thái", "Thanh toán", "Phương thức", "Giảm giá", "Thành tiền", "Ngày đặt"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredBookings.map((b, idx) => (
                          <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">

                            {/* # */}
                            <td className="px-4 py-4">
                              <span className="text-xs text-slate-400 font-mono">{idx + 1}</span>
                            </td>

                            {/* Customer */}
                            <td className="px-4 py-4 min-w-[180px]">
                              <p className="font-semibold text-slate-900">{b.customer?.fullName ?? "–"}</p>
                              {b.customer?.email && (
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3" /> {b.customer.email}
                                </p>
                              )}
                              {b.customer?.phone && (
                                <a
                                  href={`tel:${b.customer.phone}`}
                                  className="text-xs text-blue-500 flex items-center gap-1 mt-0.5 hover:text-blue-700"
                                >
                                  <Phone className="w-3 h-3" /> {b.customer.phone}
                                </a>
                              )}
                              <p className="text-[10px] text-slate-300 font-mono mt-0.5">{b.id}</p>
                            </td>

                            {/* People */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="font-bold text-slate-800">{(b.adults ?? 0) + (b.children ?? 0)}</span>
                              <span className="text-xs text-slate-400 block">
                                {b.adults ?? 0} NL
                                {(b.children ?? 0) > 0 && (
                                  <span className="ml-1 text-amber-500">· {b.children} TE</span>
                                )}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4">
                              <StatusBadge status={b.status ?? "–"} />
                            </td>

                            {/* Payment status */}
                            <td className="px-4 py-4">
                              <StatusBadge status={b.paymentStatus ?? "–"} />
                              {b.paymentDate && (
                                <p className="text-[10px] text-slate-400 mt-1">{fmt(b.paymentDate)}</p>
                              )}
                            </td>

                            {/* Payment method */}
                            <td className="px-4 py-4">
                              <span className="text-xs text-slate-600 font-medium">
                                {b.paymentMethod ?? "–"}
                              </span>
                            </td>

                            {/* Discount */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              {(b.discountAmount ?? 0) > 0 ? (
                                <span className="text-xs text-emerald-600 font-semibold">
                                  -{fmtCurrency(b.discountAmount)}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-300">–</span>
                              )}
                              {(b.pointUsed ?? 0) > 0 && (
                                <p className="text-[10px] text-amber-500">{b.pointUsed} điểm</p>
                              )}
                            </td>

                            {/* Final price */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <p className="font-bold text-slate-900">{fmtCurrency(b.finalPrice ?? b.totalPrice)}</p>
                              {b.totalPrice !== b.finalPrice && b.totalPrice != null && (
                                <p className="text-[10px] text-slate-400 line-through">{fmtCurrency(b.totalPrice)}</p>
                              )}
                            </td>

                            {/* Date */}
                            <td className="px-4 py-4 text-slate-500 text-xs whitespace-nowrap">
                              {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("vi-VN") : "–"}
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      {/* Footer: totals */}
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-xs font-bold text-slate-600">
                            Tổng cộng ({filteredBookings.length} đơn)
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-800">
                            {filteredBookings.reduce((s, b) => s + (b.adults ?? 0) + (b.children ?? 0), 0)} người
                          </td>
                          <td colSpan={3} />
                          <td className="px-4 py-3 text-xs font-bold text-emerald-600">
                            -{fmtCurrency(filteredBookings.reduce((s, b) => s + (b.discountAmount ?? 0), 0))}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-blue-700">
                            {fmtCurrency(filteredBookings.reduce((s, b) => s + (b.finalPrice ?? b.totalPrice ?? 0), 0))}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ══════════ TAB: ITINERARY ══════════ */}
          {activeTab === "itinerary" && (
            <div className="flex flex-col gap-4">
              {/* Summary card */}
              <Card className="border-0 shadow-sm rounded-3xl p-5 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-700 font-medium">
                    Chương trình <span className="font-bold">{tour?.durationDays ?? "–"} ngày {tour?.durationNights ?? "–"} đêm</span>
                    &nbsp;·&nbsp;{fmt(schedule.startDate)} → {fmt(schedule.endDate)}
                  </p>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-3">
                  {Object.entries(ACTIVITY_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <span key={key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    );
                  })}
                </div>
              </Card>

              {/* Loading state */}
              {itineraryLoading && (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-7 h-7 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm">Đang tải lịch trình...</p>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!itineraryLoading && itineraries.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                  <CalendarDays className="w-14 h-14 mb-3" />
                  <p className="text-base font-medium text-slate-400">Chưa có lịch trình</p>
                  <p className="text-sm text-slate-400 mt-1">Tour này chưa được soạn kịch bản hành trình.</p>
                </div>
              )}

              {/* Itinerary cards */}
              {!itineraryLoading && itineraries.map((day) => (
                <Card key={day.id} className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
                  {/* Day header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">N{day.dayNumber}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold leading-snug">{day.title}</h3>
                      {day.description && (
                        <p className="text-blue-200 text-xs mt-0.5 leading-relaxed">{day.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="p-6">
                    {(!day.itineraryDetails || day.itineraryDetails.length === 0) ? (
                      <p className="text-slate-400 text-sm text-center py-4">Chưa có hoạt động chi tiết.</p>
                    ) : (
                      <div className="relative">
                        {/* Vertical connecting line */}
                        <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-slate-100" />

                        <div className="space-y-5">
                          {day.itineraryDetails.map((detail) => {
                            const cfg = getActivity(detail.activityType);
                            const Icon = cfg.icon;
                            return (
                              <div key={detail.id} className="flex items-start gap-4">
                                {/* Activity icon */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border-2 border-white shadow-sm z-10 ${cfg.bg}`}>
                                  <Icon className={`w-4 h-4 ${cfg.text}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mr-2 ${cfg.bg} ${cfg.text}`}>
                                        {cfg.label}
                                      </span>
                                      <span className="text-xs text-slate-400 font-medium">{detail.timeFrame}</span>
                                    </div>
                                  </div>
                                  <p className="text-slate-800 text-sm font-semibold mt-1.5">{detail.title}</p>
                                  {detail.location && (
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3" /> {detail.location.name}
                                    </p>
                                  )}
                                  {detail.note && (
                                    <div className="mt-2 flex items-start gap-1.5 p-2 rounded-lg bg-amber-50 border border-amber-100">
                                      <FileText className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                                      <p className="text-xs text-amber-700 leading-relaxed">{detail.note}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
