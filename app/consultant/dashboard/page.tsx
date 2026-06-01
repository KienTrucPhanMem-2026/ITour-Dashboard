"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare, Users, TrendingUp, Clock, Star,
  CheckCircle2, ArrowRight, PhoneCall, Calendar,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { useUserStore } from "@/store/user-store";
import { useRouter } from "next/navigation";

// ─── Mock chart data ──────────────────────────────────────────────────────────
const chatsData = [
  { name: "T1", value: 12 }, { name: "T2", value: 18 }, { name: "T3", value: 15 },
  { name: "T4", value: 22 }, { name: "T5", value: 28 }, { name: "T6", value: 24 },
];
const closedData = [
  { name: "T1", value: 8 }, { name: "T2", value: 14 }, { name: "T3", value: 10 },
  { name: "T4", value: 16 }, { name: "T5", value: 20 }, { name: "T6", value: 18 },
];
const responseData = [
  { name: "T1", value: 3.2 }, { name: "T2", value: 2.8 }, { name: "T3", value: 2.4 },
  { name: "T4", value: 2.1 }, { name: "T5", value: 1.8 }, { name: "T6", value: 1.9 },
];
const ratingData = [
  { name: "T1", value: 4.3 }, { name: "T2", value: 4.5 }, { name: "T3", value: 4.6 },
  { name: "T4", value: 4.7 }, { name: "T5", value: 4.8 }, { name: "T6", value: 4.9 },
];

// ─── Status badge ────────────────────────────────────────────────────────────
const statusStyles: Record<string, string> = {
  open:    "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100   text-amber-700",
  closed:  "bg-slate-100   text-slate-600",
};
const statusLabel: Record<string, string> = {
  open: "Đang mở", pending: "Chờ phản hồi", closed: "Đã đóng",
};

const formatLastMessage = (text?: string) => {
  if (!text) return "";
  if (text.startsWith("[TOUR_LINK:")) {
    const match = text.match(/\[TOUR_LINK:tourId=(.*?)&name=(.*?)&price=(.*?)\]/);
    if (match && match[2]) {
      return `[Yêu cầu tư vấn tour: ${match[2]}]`;
    }
    return "[Yêu cầu tư vấn tour]";
  }
  return text;
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConsultantDashboard() {
  const router = useRouter();
  const user = useUserStore();

  const [conversations, setConversations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [consultant, setConsultant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [convRes, reviewRes, consultantRes] = await Promise.all([
          apiClient.get(`/conversations/consultant/${user.id}`),
          apiClient.get(`/reviews/consultant/${user.id}`),
          apiClient.get(`/consultants/${user.id}`)
        ]);

        if (convRes.success && convRes.data) {
          const mapped = convRes.data.map((c: any) => ({
            ...c,
            customer: c.customer || c.chatCustomer,
          }));
          setConversations(mapped);
        }

        if (reviewRes.success && reviewRes.data) {
          setReviews(reviewRes.data);
        }

        if (consultantRes.success && consultantRes.data) {
          setConsultant(consultantRes.data);
        }
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const recent = conversations.slice(0, 6);

  // Dynamic calculations for Stat Cards
  const displayRating = consultant?.averageRate != null ? consultant.averageRate.toFixed(1) : "5.0";
  const completedChatsCount = conversations.filter(c => c.status === "CLOSED").length;
  const activeChatsCount = conversations.filter(c => c.status !== "CLOSED").length;

  // Today's Performance Stats
  const todayString = new Date().toDateString();
  const todayConversations = conversations.filter(c => {
    const date = c.createdAt || c.startedAt;
    return date ? new Date(date).toDateString() === todayString : false;
  });

  const respondedConversations = conversations.filter(c => c.status === "ACTIVE" || c.status === "CLOSED");
  const goodReviews = reviews.filter(r => r.rating >= 4);

  const performanceStats = [
    {
      label: "Chats mới hôm nay",
      value: todayConversations.length,
      total: Math.max(5, todayConversations.length), // daily goal baseline is 5 chats
      color: "bg-blue-500"
    },
    {
      label: "Đã phản hồi",
      value: respondedConversations.length,
      total: Math.max(1, conversations.length),
      color: "bg-emerald-500"
    },
    {
      label: "Hỗ trợ thành công",
      value: completedChatsCount,
      total: Math.max(1, conversations.length),
      color: "bg-purple-500"
    },
    {
      label: "Đánh giá tốt (≥4★)",
      value: goodReviews.length,
      total: Math.max(1, reviews.length),
      color: "bg-amber-500"
    }
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-2">Tổng quan hoạt động tư vấn của bạn.</p>
      </div>

      {/* ── Row 1: 4 stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Cuộc trò chuyện"   value={conversations.length}   change={`${activeChatsCount} đang mở`} changeType="increase" icon={MessageSquare}  data={chatsData}    color="#3b82f6" />
        <StatCard title="Hỗ trợ hoàn thành"      value={completedChatsCount}   change={`${completedChatsCount} đã xong`} changeType="increase" icon={CheckCircle2}   data={closedData}   color="#10b981" />
        <StatCard title="Thời gian phản hồi" value="1.9m" change="0.2m"  changeType="decrease" icon={Clock}          data={responseData} color="#f59e0b" />
        <StatCard title="Đánh giá TB"        value={displayRating}  change={`${reviews.length} nhận xét`} changeType="increase" icon={Star}          data={ratingData}   color="#8b5cf6" />
      </div>

      {/* ── Row 2: Recent convos + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Recent conversations — 2/3 width */}
        <Card className="lg:col-span-2 border-0 shadow-sm rounded-3xl bg-white overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Cuộc trò chuyện gần đây</h2>
            <button
              onClick={() => router.push("/consultant/messages")}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
              <MessageSquare className="w-10 h-10" />
              <p className="text-sm">Chưa có cuộc hội thoại nào</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recent.map((conv) => {
                const status = conv.status ?? "open";
                return (
                  <div
                    key={conv.id}
                    onClick={() => router.push(`/consultant/messages?conv=${conv.id}`)}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {conv.customer?.fullName?.[0] ?? "K"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {conv.customer?.fullName ?? "Khách hàng"}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {formatLastMessage(conv.lastMessage) || "Bắt đầu cuộc trò chuyện"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyles[status] || "bg-blue-100 text-blue-700"}`}>
                        {statusLabel[status] || "Đang mở"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {conv.updatedAt
                          ? new Date(conv.updatedAt).toLocaleDateString("vi-VN")
                          : "–"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Activity card — 1/3 width */}
        <div className="flex flex-col gap-4">
          <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white">
            <h2 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Hiệu suất hôm nay
            </h2>
            <div className="space-y-4">
              {performanceStats.map(({ label, value, total, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium">{label}</span>
                    <span className="text-slate-900 font-bold">{value}<span className="text-slate-400 font-normal">/{total}</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${(value / total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-0 shadow-sm rounded-3xl p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <p className="text-xs text-blue-200 font-medium mb-1">Trạng thái</p>
            <p className="text-lg font-bold mb-4">Sẵn sàng tư vấn</p>
            <button
              onClick={() => router.push("/consultant/messages")}
              className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-xl py-2.5 text-sm font-semibold backdrop-blur-sm"
            >
              <PhoneCall className="w-4 h-4" />
              Mở hộp thư
            </button>
          </Card>
        </div>
      </div>

      {/* ── Row 3: Monthly bar chart ── */}
      <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lịch sử hoạt động</p>
            <p className="mt-1 text-lg font-bold text-slate-900">Cuộc trò chuyện theo tháng</p>
          </div>
          <div className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600">2026</div>
        </div>
        <div className="flex items-end gap-2 justify-between overflow-x-auto pb-2">
          {[
            { m: "T1", v: 12 }, { m: "T2", v: 18 }, { m: "T3", v: 15 },
            { m: "T4", v: 22 }, { m: "T5", v: 28 }, { m: "T6", v: 20 },
            { m: "T7", v: 16 }, { m: "T8", v: 14 }, { m: "T9", v: 10 },
            { m: "T10", v: 8 }, { m: "T11", v: 6 }, { m: "T12", v: 5 },
          ].map(({ m, v }, i) => {
            const isCurrent = i === 4;
            const isPast = i < 4;
            const barColor = isCurrent ? "bg-sky-500" : isPast ? "bg-blue-600" : "bg-blue-200";
            return (
              <div key={m} className="flex flex-col items-center gap-2 min-w-[28px]">
                <div className={`w-5 rounded-full transition-all ${barColor}`} style={{ height: `${Math.max(v * 3, 8)}px` }} />
                <span className="text-[10px] text-slate-400">{m}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600" />Đã qua</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" />Tháng này</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-200" />Dự kiến</span>
        </div>
      </Card>

      {/* ── Row 4: Customer Reviews List ── */}
      <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white overflow-hidden">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Đánh giá từ khách hàng</h2>
            <p className="text-xs text-slate-500 mt-1">Phản hồi và ý kiến đóng góp của người dùng sau cuộc trò chuyện.</p>
          </div>
          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 font-bold px-3 py-1.5 rounded-2xl text-xs border border-amber-100">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{displayRating} / 5.0</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <Star className="w-10 h-10 text-slate-300" />
            <p className="text-sm">Chưa có đánh giá nào từ khách hàng</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-4 font-semibold">Khách hàng</th>
                  <th className="pb-4 font-semibold text-center">Đánh giá</th>
                  <th className="pb-4 font-semibold">Nhận xét</th>
                  <th className="pb-4 font-semibold">Ngày nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {rev.customer?.fullName?.[0] ?? "K"}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">
                            {rev.customer?.fullName ?? "Khách hàng"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {rev.customer?.email ?? "Email không cung cấp"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rev.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-4 max-w-md">
                      <p className="text-xs text-slate-600 italic">
                        {rev.comment ? `"${rev.comment}"` : "Không có bình luận"}
                      </p>
                    </td>
                    <td className="py-4 text-xs text-slate-400">
                      {rev.createdAt
                        ? new Date(rev.createdAt).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
