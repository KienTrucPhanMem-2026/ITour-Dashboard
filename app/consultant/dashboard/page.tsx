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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConsultantDashboard() {
  const router = useRouter();
  const user = useUserStore();

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const res = await apiClient.get(`/conversations/consultant/${user.id}`);
        if (res.success && res.data) {
          const mapped = res.data.map((c: any) => ({
            ...c,
            customer: c.customer || c.chatCustomer,
          }));
          setConversations(mapped);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const recent = conversations.slice(0, 6);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-2">Tổng quan hoạt động tư vấn của bạn.</p>
      </div>

      {/* ── Row 1: 4 stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Cuộc trò chuyện"   value="28"   change="6 cuộc" changeType="increase" icon={MessageSquare}  data={chatsData}    color="#3b82f6" />
        <StatCard title="Đã chốt khách"      value="18"   change="4 hợp đồng" changeType="increase" icon={CheckCircle2}   data={closedData}   color="#10b981" />
        <StatCard title="Thời gian phản hồi" value="1.9m" change="0.2m"  changeType="decrease" icon={Clock}          data={responseData} color="#f59e0b" />
        <StatCard title="Đánh giá TB"        value="4.9"  change="0.1 điểm" changeType="increase" icon={Star}          data={ratingData}   color="#8b5cf6" />
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
                        {conv.lastMessage ?? "Bắt đầu cuộc trò chuyện"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyles[status]}`}>
                        {statusLabel[status]}
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
              {[
                { label: "Chats mới",         value: 4,   total: 10, color: "bg-blue-500" },
                { label: "Đã phản hồi",        value: 7,   total: 10, color: "bg-emerald-500" },
                { label: "Chốt thành công",    value: 3,   total: 10, color: "bg-purple-500" },
                { label: "Đánh giá tốt (≥4★)", value: 6,   total: 7,  color: "bg-amber-500" },
              ].map(({ label, value, total, color }) => (
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
      <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white">
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
    </DashboardLayout>
  );
}
