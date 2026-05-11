"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays, MapPin, Users, Star, Clock, ArrowLeft,
  Phone, Mail, CheckCircle2, Circle, ChevronRight,
  Bus, CreditCard, UserCheck, AlertCircle, Package
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
  totalPrice: number;
  finalPrice: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  bookingDate: string;
  customer?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
}

// ─── Mock Itinerary (sẽ thay bằng API khi backend có) ───────────────────────
const MOCK_ITINERARY = [
  {
    day: 1,
    title: "Khởi hành – Đến điểm đến",
    items: [
      { time: "06:00", desc: "Tập trung tại điểm xuất phát, xe đưa đón" },
      { time: "08:00", desc: "Khởi hành đến điểm đến" },
      { time: "12:00", desc: "Ăn trưa tại nhà hàng địa phương" },
      { time: "14:00", desc: "Nhận phòng khách sạn, nghỉ ngơi" },
      { time: "18:00", desc: "Ăn tối, tự do khám phá" },
    ],
  },
  {
    day: 2,
    title: "Tham quan các điểm nổi bật",
    items: [
      { time: "07:00", desc: "Ăn sáng tại khách sạn" },
      { time: "08:30", desc: "Tham quan điểm du lịch chính" },
      { time: "12:00", desc: "Ăn trưa – Nghỉ ngơi" },
      { time: "14:00", desc: "Tham quan điểm du lịch thứ 2" },
      { time: "19:00", desc: "Ăn tối tại nhà hàng đặc sản" },
    ],
  },
  {
    day: 3,
    title: "Trải nghiệm – Mua sắm – Về nhà",
    items: [
      { time: "07:00", desc: "Ăn sáng, trả phòng" },
      { time: "09:00", desc: "Tham quan & mua sắm đặc sản địa phương" },
      { time: "12:00", desc: "Ăn trưa chia tay" },
      { time: "14:00", desc: "Lên xe về điểm xuất phát" },
      { time: "19:00", desc: "Về đến nơi, kết thúc hành trình" },
    ],
  },
];

// ─── Helper ──────────────────────────────────────────────────────────────────
const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("vi-VN") : "–";
const fmtCurrency = (n?: number) =>
  n != null ? n.toLocaleString("vi-VN") + " ₫" : "–";

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    CONFIRMED: "bg-emerald-100 text-emerald-700",
    PENDING:   "bg-amber-100  text-amber-700",
    CANCELLED: "bg-red-100    text-red-700",
    PAID:      "bg-blue-100   text-blue-700",
    UNPAID:    "bg-slate-100  text-slate-600",
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
  const totalGuests = bookings.reduce((s, b) => s + (b.adults ?? 0) + (b.children ?? 0), 0);
  const revenue = bookings.reduce((s, b) => s + (b.finalPrice ?? b.totalPrice ?? 0), 0);

  const TABS = [
    { key: "info",      label: "Thông tin Tour" },
    { key: "guests",    label: `Danh sách khách (${bookings.length})` },
    { key: "itinerary", label: "Lịch trình" },
  ] as const;

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
                  { icon: Clock,        label: "Kết thúc",  value: fmt(schedule.endDate) },
                  { icon: Users,        label: "Đã đặt",    value: `${schedule.bookedPeople ?? 0} người` },
                  { icon: MapPin,       label: "Điểm đến",  value: tour?.endDestination?.name ?? "–" },
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
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === key
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
                      { label: "Slots còn lại",  value: (schedule.availableSlot ?? 0) + " chỗ", color: "bg-emerald-50 text-emerald-700" },
                      { label: "Doanh thu",       value: fmtCurrency(revenue), color: "bg-amber-50 text-amber-700" },
                      { label: "Giá lịch này",    value: fmtCurrency(schedule.price), color: "bg-purple-50 text-purple-700" },
                      { label: "Thời gian",       value: `${tour?.durationDays ?? "–"} ngày ${tour?.durationNights ?? "–"} đêm`, color: "bg-pink-50 text-pink-700" },
                      { label: "Số bookings",     value: bookings.length + " đơn", color: "bg-slate-50 text-slate-700" },
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
                      { label: "Mã lịch",     value: schedule.id },
                      { label: "Khởi hành",   value: fmt(schedule.startDate) },
                      { label: "Kết thúc",    value: fmt(schedule.endDate) },
                      { label: "Điểm bắt đầu", value: tour?.startDestination?.name ?? "–" },
                      { label: "Điểm đến",    value: tour?.endDestination?.name ?? "–" },
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
              {/* Summary row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: Users,       label: "Tổng khách", value: totalGuests, color: "text-blue-600 bg-blue-50" },
                  { icon: UserCheck,   label: "Đã xác nhận", value: bookings.filter(b => b.status?.toUpperCase() === "CONFIRMED").length, color: "text-emerald-600 bg-emerald-50" },
                  { icon: CreditCard,  label: "Đã thanh toán", value: bookings.filter(b => b.paymentStatus?.toUpperCase() === "PAID").length, color: "text-purple-600 bg-purple-50" },
                  { icon: AlertCircle, label: "Chờ xử lý", value: bookings.filter(b => b.status?.toUpperCase() === "PENDING").length, color: "text-amber-600 bg-amber-50" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <Card key={label} className="border-0 shadow-sm rounded-2xl p-4 bg-white">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color.split(" ")[1]}`}>
                      <Icon className={`w-4 h-4 ${color.split(" ")[0]}`} />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </Card>
                ))}
              </div>

              {/* Guest table */}
              <Card className="border-0 shadow-sm rounded-3xl bg-white overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900">Danh sách booking</h2>
                </div>
                {bookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Users className="w-12 h-12 mb-3" />
                    <p>Chưa có booking nào</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          {["Khách hàng", "Số người", "Thanh toán", "Trạng thái", "Ngày đặt", "Tổng tiền"].map(h => (
                            <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {bookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-semibold text-slate-900">{b.customer?.fullName ?? "–"}</p>
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3" />
                                  {b.customer?.email ?? "–"}
                                </p>
                                {b.customer?.phone && (
                                  <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {b.customer.phone}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-slate-700">
                                <span className="font-medium">{(b.adults ?? 0) + (b.children ?? 0)}</span>
                                <span className="text-xs text-slate-400 block">
                                  {b.adults ?? 0} NL · {b.children ?? 0} TE
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={b.paymentStatus ?? "–"} />
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={b.status ?? "–"} />
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs">
                              {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("vi-VN") : "–"}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-900">{fmtCurrency(b.finalPrice ?? b.totalPrice)}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ══════════ TAB: ITINERARY ══════════ */}
          {activeTab === "itinerary" && (
            <div className="flex flex-col gap-4">
              <Card className="border-0 shadow-sm rounded-3xl p-6 bg-blue-50">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-blue-700 font-medium">
                    Chương trình <span className="font-bold">{tour?.durationDays ?? "–"} ngày {tour?.durationNights ?? "–"} đêm</span>
                    &nbsp;·&nbsp;{fmt(schedule.startDate)} → {fmt(schedule.endDate)}
                  </p>
                </div>
              </Card>

              {MOCK_ITINERARY.map((day) => (
                <Card key={day.day} className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
                  {/* Day header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-sm">N{day.day}</span>
                    </div>
                    <h3 className="text-white font-semibold">{day.title}</h3>
                  </div>

                  {/* Timeline */}
                  <div className="p-6">
                    <div className="relative">
                      {/* Vertical line */}
                      <div className="absolute left-[22px] top-4 bottom-4 w-px bg-slate-100" />

                      <div className="space-y-4">
                        {day.items.map((item, i) => (
                          <div key={i} className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center border-2 border-white shadow-sm z-10">
                              <span className="text-blue-700 font-bold text-xs">{item.time}</span>
                            </div>
                            <div className="flex-1 pt-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                                <p className="text-slate-700 text-sm">{item.desc}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
