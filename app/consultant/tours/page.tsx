"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Compass, Calendar, DollarSign, Users, Eye, MapPin } from "lucide-react";
import { tourService } from "@/services/tourService";
import { Tour } from "@/types";

export default function ConsultantToursPage() {
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchTours();
  }, []);

  useEffect(() => {
    let filtered = tours;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (tour) =>
          tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tour.destination.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((tour) => tour.status === statusFilter);
    }

    setFilteredTours(filtered);
  }, [tours, searchQuery, statusFilter]);

  const fetchTours = async () => {
    setIsLoading(true);
    try {
      const response = await tourService.getTours();
      if (response.success && response.data) {
        setTours(Array.isArray(response.data) ? response.data : []);
      } else {
        // Fallback to empty
        setTours([]);
      }
    } catch (err) {
      console.error("Failed to fetch tours", err);
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Completed: "bg-blue-100 text-blue-700 border-blue-200",
    Cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Danh sách Tours du lịch</h1>
        <p className="text-slate-500 mt-2">Tra cứu và tư vấn thông tin chi tiết các tour du lịch hiện hành.</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo tên tour hoặc điểm đến..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3 rounded-2xl border-slate-200 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Đang hoạt động</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="Completed">Hoàn thành</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-3xl border border-slate-100 h-96 animate-pulse" />
          ))}
        </div>
      ) : filteredTours.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Compass className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800">Không tìm thấy tour</h4>
            <p className="text-xs text-slate-400 mt-1">Vui lòng thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
          </div>
        </div>
      ) : (
        /* Tours Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTours.map((tour) => (
            <div
              key={tour.id}
              onClick={() => router.push(`/consultant/tours/${tour.id}`)}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer flex flex-col group"
            >
              {/* Image & Status */}
              <div className="h-48 overflow-hidden relative bg-slate-100 shrink-0">
                <img
                  src={tour.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop"}
                  alt={tour.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <span
                  className={`absolute top-4 right-4 px-3 py-1 text-[10px] font-bold rounded-full border shadow-sm ${
                    statusColors[tour.status] || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {tour.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{tour.destination}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-lg leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                    {tour.name}
                  </h3>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Giá từ</span>
                    <span className="text-lg font-black text-emerald-600">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(tour.price)}
                    </span>
                  </div>
                  <span className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <Eye className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
