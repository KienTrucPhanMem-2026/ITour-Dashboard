"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Compass, Calendar, DollarSign, Users, ChevronLeft, MapPin, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { tourService } from "@/services/tourService";
import { Tour } from "@/types";

export default function ConsultantTourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tour, setTour] = useState<Tour | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTourDetail();
    }
  }, [id]);

  const fetchTourDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tourService.getTourById(id);
      if (response.success && response.data) {
        setTour(response.data);
      } else {
        setError(response.message || "Không thể lấy thông tin chi tiết tour.");
      }
    } catch (err) {
      console.error(err);
      setError("Đã xảy ra lỗi khi kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Completed: "bg-blue-50 text-blue-700 border-blue-200",
    Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <DashboardLayout>
      {/* Back button */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/consultant/tours")}
          className="flex items-center gap-2 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-20 animate-pulse h-96" />
      ) : error || !tour ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold text-xl">
            ⚠️
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">Không tìm thấy thông tin tour</h4>
            <p className="text-sm text-slate-400 mt-1">{error || "Tour không tồn tại hoặc đã bị xóa."}</p>
          </div>
        </div>
      ) : (
        /* Visual Detail Container */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image & Details */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
              {/* Main Banner */}
              <div className="h-[300px] md:h-[450px] relative w-full bg-slate-100">
                <img
                  src={tour.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=450&fit=crop"}
                  alt={tour.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3.5 py-1 bg-blue-500/80 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider">
                      {tour.destination}
                    </span>
                    <span
                      className={`px-3.5 py-1 text-xs font-bold rounded-full border backdrop-blur-md shadow-sm ${
                        statusColors[tour.status] || "bg-slate-50 text-slate-700"
                      }`}
                    >
                      {tour.status}
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-black leading-tight tracking-tight drop-shadow-md">
                    {tour.name}
                  </h1>
                </div>
              </div>

              {/* Main Info */}
              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  Mô tả hành trình
                </h3>
                <p className="text-slate-600 leading-relaxed font-light text-base whitespace-pre-wrap">
                  {tour.description || "Chưa có mô tả chi tiết cho tour du lịch này."}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Booking Summary */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Quick Specs */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col gap-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Giá tham khảo
                </span>
                <span className="text-3xl font-black text-emerald-600 tracking-tight">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(tour.price)}
                </span>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Thời gian</p>
                    <p className="font-bold text-slate-800 text-sm">{tour.duration}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Khởi hành</p>
                    <p className="font-bold text-slate-800 text-sm">
                      {tour.startDate ? new Date(tour.startDate).toLocaleDateString("vi-VN") : "Liên hệ"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Số chỗ tối đa</p>
                    <p className="font-bold text-slate-800 text-sm">{tour.capacity} khách</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-6 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>Bảo hiểm & Chất lượng cam kết</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
