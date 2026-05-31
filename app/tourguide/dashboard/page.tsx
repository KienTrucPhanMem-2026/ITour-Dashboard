"use client";

import { CalendarDays, MapPin, Users, Star, MessageSquareQuote, CheckCircle2, Clock, ArrowRight, Wallet, Trophy, Award } from "lucide-react";
import oceanImage from "@/assets/background/ocean.jpg";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useUserStore } from "@/store/user-store";
import { Alert, message } from "antd";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

// Mock data for charts - completely distinct trends for each KPI sparkline
const completedToursData = [
  { name: 'T1', value: 3 }, { name: 'T2', value: 5 }, { name: 'T3', value: 2 },
  { name: 'T4', value: 6 }, { name: 'T5', value: 4 }, { name: 'T6', value: 8 },
];

const daysOnTourData = [
  { name: 'T1', value: 10 }, { name: 'T2', value: 18 }, { name: 'T3', value: 12 },
  { name: 'T4', value: 15 }, { name: 'T5', value: 9 }, { name: 'T6', value: 20 },
];

const customersServedData = [
  { name: 'T1', value: 50 }, { name: 'T2', value: 95 }, { name: 'T3', value: 70 },
  { name: 'T4', value: 120 }, { name: 'T5', value: 85 }, { name: 'T6', value: 140 },
];

const ratingData = [
  { name: 'T1', value: 4.5 }, { name: 'T2', value: 4.7 }, { name: 'T3', value: 4.6 },
  { name: 'T4', value: 4.8 }, { name: 'T5', value: 4.9 }, { name: 'T6', value: 4.8 },
];

const incomeData = [
  { name: 'T1', value: 12 }, { name: 'T2', value: 14 }, { name: 'T3', value: 15 },
  { name: 'T4', value: 13 }, { name: 'T5', value: 16 }, { name: 'T6', value: 15.8 },
];

const recentFeedbacks = [
  { id: 1, customer: 'Nguyễn Văn A', rating: 5, comment: 'HDV nhiệt tình, vui vẻ, xử lý tình huống rất chuyên nghiệp.', tour: 'Phú Quốc 4N3Đ', date: 'Hôm qua' },
  { id: 2, customer: 'Trần Thị B', rating: 5, comment: 'Chuyến đi tuyệt vời! Chắc chắn sẽ book lại công ty.', tour: 'Đà Lạt Mùa Hoa', date: '2 ngày trước' },
  { id: 3, customer: 'Lê Văn C', rating: 4, comment: 'Lịch trình hơi dày nhưng HDV hỗ trợ rất linh hoạt.', tour: 'Nha Trang Biển Gọi', date: 'Tuần trước' },
];

const calendarWeeks = [
  [0, 1, 1, 2, 0, 3, 0], [0, 2, 2, 1, 0, 3, 1], [1, 0, 2, 3, 1, 0, 2], [0, 1, 0, 2, 3, 2, 1], [2, 1, 0, 0, 1, 2, 3],
];

const displayedMonthlyTours = [
  { month: "T1", value: 8, status: "past" },
  { month: "T2", value: 11, status: "past" },
  { month: "T3", value: 9, status: "past" },
  { month: "T4", value: 12, status: "past" },
  { month: "T5", value: 14, status: "current" },
  { month: "T6", value: 7, status: "future" },
];

const leaderboardData = [
  { rank: 1, name: "Trần Minh Hoàng", rating: 4.95, tours: 12 },
  { rank: 2, name: "Nguyễn Thị Mai", rating: 4.92, tours: 10 },
  { rank: 3, name: "Lê Quốc Anh", rating: 4.88, tours: 11 },
];

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-xl p-2.5 shadow-md text-xs font-bold text-slate-800">
        <p className="text-slate-500 mb-1">Tháng {label}</p>
        <p className="text-blue-600 font-black">{payload[0].value} Tour</p>
      </div>
    );
  }
  return null;
};

export default function TourGuideDashboard() {
  const router = useRouter();
  const user = useUserStore();
  const [upcomingToursList, setUpcomingToursList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [calendarWeeks, setCalendarWeeks] = useState<number[][]>([
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ]);
  const [monthlyToursData, setMonthlyToursData] = useState<any[]>([]);
  const [expertiseData, setExpertiseData] = useState({
    domesticPercent: 50,
    intlPercent: 50,
    domesticCount: 0,
    intlCount: 0
  });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myRating, setMyRating] = useState<number>(4.8);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const [assignmentsRes, guideReviewsRes, allGuidesRes] = await Promise.all([
          apiClient.get(`/guides-assignments/guide/${user.id}`),
          apiClient.get(`/reviews/tour-guide/${user.id}`),
          apiClient.get(`/tour-guides`)
        ]);

        let assignments: any[] = [];
        if (assignmentsRes.success && assignmentsRes.data) {
          assignments = assignmentsRes.data;
          
          // Sort by start date
          const sorted = [...assignments].sort((a: any, b: any) =>
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
              isNext: index === 0,
              scheduleId: item.tourSchedule.id
            };
          });

          const formatted = await Promise.all(formattedPromises);
          setUpcomingToursList(formatted.slice(0, 5));

          // 1. Calculate Monthly Tours Chart (last 6 months)
          const months: any[] = [];
          const now = new Date();
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
              month: `T${d.getMonth() + 1}`,
              year: d.getFullYear(),
              monthNum: d.getMonth(),
              value: 0,
              status: i === 0 ? "current" : "past"
            });
          }

          assignments.forEach((item: any) => {
            if (!item.tourSchedule?.startDate) return;
            const start = new Date(item.tourSchedule.startDate);
            const m = start.getMonth();
            const y = start.getFullYear();
            
            const match = months.find(x => x.monthNum === m && x.year === y);
            if (match) {
              match.value += 1;
            }
          });

          setMonthlyToursData(months);

          // 2. Calculate Tour Expertise (Domestic vs. International)
          let domesticCount = 0;
          let intlCount = 0;
          assignments.forEach((item: any) => {
            const endLoc = item.tourSchedule?.tour?.endDestination;
            if (!endLoc) return;
            const isIntl = endLoc.type === "COUNTRY"
              ? endLoc.id !== "2001"
              : endLoc.parentId && endLoc.parentId !== "2001";
            if (isIntl) {
              intlCount++;
            } else {
              domesticCount++;
            }
          });

          const totalExpertise = domesticCount + intlCount;
          const domesticPercent = totalExpertise > 0 ? Math.round((domesticCount / totalExpertise) * 100) : 50;
          const intlPercent = totalExpertise > 0 ? 100 - domesticPercent : 50;
          setExpertiseData({
            domesticPercent,
            intlPercent,
            domesticCount,
            intlCount
          });

          // 3. Compute Heatmap (Lịch đi tour bận rộn)
          const today = new Date();
          const currentDay = today.getDay();
          const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1; // days to previous Monday
          const thisMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysToSubtract);
          const startMonday = new Date(thisMonday.getTime() - 4 * 7 * 24 * 60 * 60 * 1000);

          const weeksGrid = Array.from({ length: 5 }, (_, wIdx) => {
            return Array.from({ length: 7 }, (_, dIdx) => {
              const dDate = new Date(startMonday.getTime() + (wIdx * 7 + dIdx) * 24 * 60 * 60 * 1000);
              const checkDate = new Date(dDate.getFullYear(), dDate.getMonth(), dDate.getDate());

              let toursOnDay = 0;
              assignments.forEach((item: any) => {
                if (!item.tourSchedule?.startDate) return;
                const start = new Date(item.tourSchedule.startDate);
                const end = item.tourSchedule.endDate
                  ? new Date(item.tourSchedule.endDate)
                  : new Date(start.getTime() + (item.tourSchedule.tour?.durationDays || 1) * 24 * 60 * 60 * 1000);

                const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());

                if (checkDate >= startDateOnly && checkDate <= endDateOnly) {
                  toursOnDay++;
                }
              });

              if (toursOnDay === 0) return 0;
              if (toursOnDay === 1) return 2;
              return 3;
            });
          });
          setCalendarWeeks(weeksGrid);
        }

        // 4. Feedbacks
        if (guideReviewsRes.success && guideReviewsRes.data) {
          const formattedFeedbacks = guideReviewsRes.data.map((r: any) => ({
            id: r.id,
            customer: r.customer?.fullName || r.customer?.username || 'Khách hàng ẩn danh',
            rating: r.guideRating || r.tourRating || 5,
            comment: r.guideComment || r.tourComment || 'Không có bình luận',
            tour: r.tour?.name || 'Tour ghép',
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'
          }));
          setFeedbacks(formattedFeedbacks.slice(0, 3));
        }

        // 5. Leaderboard Calculation
        if (allGuidesRes.success && allGuidesRes.data) {
          const guides = allGuidesRes.data || [];

          // Map guides to leaderboard info
          const formattedLeaderboard = guides.map((g: any) => {
            const completedCount = (g.guidesAssignments || []).filter((a: any) => {
              if (a.tourSchedule?.endDate) {
                return new Date(a.tourSchedule.endDate).getTime() < new Date().getTime();
              }
              return true;
            }).length;

            return {
              id: g.id,
              name: g.fullName || g.userName,
              rating: g.rating != null ? Number(g.rating.toFixed(2)) : 5.0,
              tours: completedCount
            };
          });

          // Sort guides
          const sorted = formattedLeaderboard.sort((a: any, b: any) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return b.tours - a.tours;
          });

          // Assign ranks
          const ranked = sorted.map((item: any, idx: number) => ({
            ...item,
            rank: idx + 1
          }));

          setLeaderboard(ranked.slice(0, 3));

          // Find current user's rank
          const myIndex = ranked.findIndex((item: any) => item.id === user.id);
          if (myIndex !== -1) {
            setMyRank(myIndex + 1);
            setMyRating(ranked[myIndex].rating);
          } else {
            setMyRank(ranked.length + 1);
            setMyRating(5.0);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

      {/* Cảnh báo Nghiệp vụ */}
      <Alert
        message="Cảnh báo Nghiệp vụ"
        description="Thẻ Hướng dẫn viên của bạn (Thẻ HDV Quốc tế) sẽ hết hạn sau 45 ngày nữa (ngày 15/07/2026). Vui lòng chuẩn bị hồ sơ và liên hệ phòng Nhân sự để làm thủ tục gia hạn."
        type="warning"
        showIcon
        closable
        className="mb-8 rounded-2xl shadow-sm border-amber-100 bg-amber-50/50"
      />

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

              <div className="mt-8 flex flex-col justify-end">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {nextTour.name}
                  </h2>
                  <div className="flex items-center gap-4 text-blue-100 text-sm mb-4">
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

                {/* Glassmorphism Action Buttons without icons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      message.info("📞 Đang kết nối tới Điều phối viên Tour: 1900 6789 (Hotline 24/7)");
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
                  >
                    Gọi Điều hành
                  </button>
                  <button
                    onClick={() => {
                      if (nextTour.scheduleId) {
                        router.push(`/tourguide/tours/${nextTour.scheduleId}`);
                      } else {
                        message.info("Hiện tại chưa có tour phân công để xem danh sách khách");
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
                  >
                    Xem danh sách khách
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Bottom: Upcoming Tours List */}
          <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white">
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

          {/* Phản hồi từ khách hàng - Moved from Right Column to Left Column */}
          <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-900">Phản hồi từ khách hàng</h3>
              <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold">{myRating ? myRating.toFixed(1) : "4.8"}</span>
              </div>
            </div>
            <div className="space-y-4">
              {(feedbacks.length > 0 ? feedbacks : recentFeedbacks).map((fb) => (
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

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* 5 Stat Cards Grid */}
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
              value={`${myRating ? myRating.toFixed(1) : "4.8"}/5`}
              change="0.2 điểm"
              changeType="increase"
              icon={Star}
              data={ratingData}
              color="#f59e0b"
            />
            {/* 5th Card: Thu nhập & Công tác phí (Spans 2 columns) */}
            <div className="sm:col-span-2">
              <StatCard
                title="Thu nhập & Công tác phí"
                value="15.800.000 ₫"
                change="12% so với tháng trước"
                changeType="increase"
                icon={Wallet}
                data={incomeData}
                color="#059669"
              />
            </div>
          </div>

          {/* Bảng xếp hạng Hướng dẫn viên */}
          <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bảng xếp hạng Hướng dẫn viên</h3>
                  <p className="text-xs text-slate-500 mt-1">Top HDV xuất sắc tháng này</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                  <Trophy className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                </div>
              </div>

              <div className="space-y-3.5">
                {(leaderboard.length > 0 ? leaderboard : leaderboardData).map((item) => {
                  const medalColors = 
                    item.rank === 1 
                      ? 'bg-amber-100 text-amber-700 border-amber-200' 
                      : item.rank === 2 
                        ? 'bg-slate-100 text-slate-700 border-slate-200' 
                        : 'bg-orange-100 text-orange-700 border-orange-200';
                  return (
                    <div 
                      key={item.id || item.rank} 
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-50 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-100 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-sm shrink-0 ${medalColors}`}>
                          {item.rank}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.tours} tour hoàn thành</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-xs font-bold">{item.rating}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current user rank status */}
            <div className="mt-5 p-3.5 rounded-2xl bg-blue-50 border border-blue-100/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  #{myRank || 4}
                </div>
                <div>
                  <p className="font-bold text-xs text-blue-900">Vị trí của bạn</p>
                  <p className="text-[10px] text-blue-600 font-medium">
                    {myRank && myRank <= 3 ? "Trong nhóm xuất sắc nhất" : "Top 10% hướng dẫn viên"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-blue-900">{myRating.toFixed(1)}/5.0</p>
                <p className="text-[9px] text-blue-500 font-bold uppercase tracking-wider mt-0.5">rating tháng</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Row 2: Bar Chart, Donut Chart, Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Bar Chart (6 months) */}
        <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white flex flex-col justify-between">
          <div>
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
                6 tháng qua
              </div>
            </div>
            {/* Recharts BarChart - No scrollbar, responsive */}
            <div className="mt-6 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyToursData.length > 0 ? monthlyToursData : displayedMonthlyTours} margin={{ top: 10, right: 0, left: -30, bottom: 0 }}>
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  />
                  <RechartsTooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={16}>
                    {(monthlyToursData.length > 0 ? monthlyToursData : displayedMonthlyTours).map((entry, index) => {
                      const barColor =
                        entry.status === 'past'
                          ? '#3b82f6'
                          : entry.status === 'current'
                            ? '#0ea5e9'
                            : '#93c5fd';
                      return <Cell key={`cell-${index}`} fill={barColor} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
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

        {/* 2. Donut Chart (Tour Expertise) */}
        <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Thế mạnh chuyên môn
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  Cơ cấu Chuyên môn
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center">
              <div
                className="relative h-32 w-32 rounded-full font-bold text-slate-800"
                style={{
                  background: `conic-gradient(#3b82f6 0% ${expertiseData.domesticPercent}%, #10b981 ${expertiseData.domesticPercent}% 100%)`,
                }}
              >
                <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center">
                  <span className="text-sm font-black text-slate-700">
                    {expertiseData.domesticPercent > 70 ? "Trong nước" : expertiseData.intlPercent > 70 ? "Quốc tế" : "Đa dạng"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-sm font-medium">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Tour Trong nước
              </span>
              <span className="text-slate-900">
                {expertiseData.domesticPercent}% ({expertiseData.domesticCount} tour)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Tour Nước ngoài
              </span>
              <span className="text-slate-900">
                {expertiseData.intlPercent}% ({expertiseData.intlCount} tour)
              </span>
            </div>
          </div>
        </Card>

        {/* 3. Github Calendar Heatmap */}
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

            {/* Heatmap grid with vertical day names and horizontal weeks */}
            <div className="mt-6 flex flex-col gap-2">
              {/* Header row: Weeks */}
              <div className="grid grid-cols-[40px_repeat(5,1fr)] gap-2 text-center text-[10px] font-bold text-slate-400">
                <div></div> {/* Empty top-left cell */}
                <div>Tuần 1</div>
                <div>Tuần 2</div>
                <div>Tuần 3</div>
                <div>Tuần 4</div>
                <div>Tuần 5</div>
              </div>

              {/* Day rows */}
              <div className="flex flex-col gap-2">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((dayName, dayIdx) => {
                  return (
                    <div key={dayName} className="grid grid-cols-[40px_repeat(5,1fr)] gap-2 items-center">
                      {/* Day Label */}
                      <span className="text-[10px] font-bold text-slate-500 text-right pr-2">
                        {dayName}
                      </span>
                      {/* 5 weeks heatmap squares */}
                      {calendarWeeks.map((week, weekIdx) => {
                        const level = week[dayIdx];
                        const levelClass =
                          level === 0
                            ? "bg-slate-100"
                            : level === 1
                              ? "bg-blue-100"
                              : level === 2
                                ? "bg-blue-300"
                                : "bg-blue-500";
                        const levelText = 
                          level === 0 ? "Rảnh rỗi" : level === 1 ? "Ít bận" : level === 2 ? "Bận rộn" : "Dày đặc";
                        return (
                          <div
                            key={weekIdx}
                            title={`Tuần ${weekIdx + 1}, ${dayName}: ${levelText}`}
                            className={`h-5 rounded-md ${levelClass} transition-all duration-200 hover:scale-110 hover:shadow-sm cursor-pointer`}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-start gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between font-medium">
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
