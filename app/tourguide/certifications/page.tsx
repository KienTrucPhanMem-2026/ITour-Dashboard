'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { useCurrentUser } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { tourService } from '@/services/tourService';
import { Tour } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader } from 'lucide-react';
import Swal from 'sweetalert2';

export default function TourGuideCertificationsPage() {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');
  const [trainings, setTrainings] = useState<any[]>([]);
  const [allTours, setAllTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load certifications of this guide
      const tRes = await apiClient.get<any[]>(`/guide-trainings/guide/${user?.id}`);
      if (tRes.success && Array.isArray(tRes.data)) {
        setTrainings(tRes.data);
      }

      // 2. Load all tours
      const tourRes = await tourService.getTours();
      if (tourRes.success && Array.isArray(tourRes.data)) {
        setAllTours(tourRes.data);
      }
    } catch (err) {
      console.error('Lỗi load data:', err);
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const approvedCount = trainings.filter(t => t.status === 'APPROVED').length;
  const pendingCount = trainings.filter(t => t.status === 'PENDING').length;
  const rejectedCount = trainings.filter(t => t.status === 'REJECTED').length;

  // Filtered trainings
  const filteredTrainings = trainings.filter(t => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  // Filter tours that guide doesn't have training profile for
  const discoverTours = allTours.filter(tour => {
    // Check if there is already a training record for this tour (APPROVED or PENDING)
    const hasRecord = trainings.some(t => t.tourId === tour.id && (t.status === 'APPROVED' || t.status === 'PENDING'));
    return !hasRecord;
  });

  const handleApplyClick = (tour: Tour) => {
    setSelectedTour(tour);
    setIsModalOpen(true);
  };

  const handleConfirmApply = async () => {
    if (!selectedTour || !user?.id) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post<any>(`/guide-trainings/apply`, null, {
        params: {
          tourId: selectedTour.id,
          tourGuideId: user.id
        }
      });
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Đã gửi yêu cầu!',
          text: 'Yêu cầu xin cấp phép dẫn tour của bạn đã được gửi tới Tour Planner.',
          timer: 2000,
          showConfirmButton: false,
        });
        setIsModalOpen(false);
        loadData();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Đăng ký thất bại',
          text: res.message || 'Đã có lỗi xảy ra, vui lòng thử lại.'
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi kết nối',
        text: error.message || 'Không thể kết nối đến máy chủ.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <i className="fa-solid fa-graduation-cap text-indigo-600" />
          Chứng nhận & Đăng ký Tuyến điểm
        </h1>
        <p className="text-slate-500 text-xs mt-1">Đăng ký và quản lý các tuyến tour bạn đủ năng lực hướng dẫn.</p>
      </div>

      {/* KPI Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <i className="fa-solid fa-shield-halved text-xl" />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-800">{approvedCount}</p>
            <p className="text-xs font-bold text-emerald-600/80 uppercase tracking-wider mt-0.5">Tour đã cấp phép</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <i className="fa-solid fa-hourglass-half text-xl" />
          </div>
          <div>
            <p className="text-2xl font-black text-amber-800">{pendingCount}</p>
            <p className="text-xs font-bold text-amber-600/80 uppercase tracking-wider mt-0.5">Yêu cầu chờ duyệt</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-red-50 border border-rose-100 rounded-2xl p-5 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
            <i className="fa-solid fa-circle-exclamation text-xl" />
          </div>
          <div>
            <p className="text-2xl font-black text-rose-800">{rejectedCount}</p>
            <p className="text-xs font-bold text-rose-600/80 uppercase tracking-wider mt-0.5">Yêu cầu bị từ chối</p>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-5 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'my'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <i className="fa-solid fa-award" />
          Chứng nhận của tôi
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`px-5 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'discover'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <i className="fa-solid fa-compass" />
          Khám phá & Đăng ký
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 font-semibold">Đang tải dữ liệu...</p>
        </div>
      )}

      {/* Tab 1: My Certifications */}
      {!loading && activeTab === 'my' && (
        <div className="space-y-4">
          {/* Status filters */}
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filterStatus === status
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'ALL' && 'Tất cả'}
                {status === 'APPROVED' && 'Đã cấp phép'}
                {status === 'PENDING' && 'Chờ duyệt'}
                {status === 'REJECTED' && 'Bị từ chối'}
              </button>
            ))}
          </div>

          {filteredTrainings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <i className="fa-solid fa-folder-open text-4xl text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500">Chưa có chứng nhận nào ở trạng thái này</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTrainings.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all flex gap-4 p-4 items-center group"
                >
                  <img
                    src={item.tourImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&h=150&fit=crop'}
                    alt={item.tourName}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {item.tourName}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                      <i className="fa-solid fa-clock mr-1" />
                      Ngày đăng ký: {item.requestDate ? new Date(item.requestDate).toLocaleDateString('vi-VN') : '---'}
                    </p>
                    {item.approvalDate && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        <i className="fa-solid fa-circle-check text-emerald-500 mr-1" />
                        Được duyệt: {new Date(item.approvalDate).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                    {item.status === 'REJECTED' && item.note && (
                      <p className="text-[10px] text-rose-500 font-bold mt-1.5 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                        Lý do từ chối: {item.note}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {item.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200">
                        <i className="fa-solid fa-shield-check" /> Đã cấp phép
                      </span>
                    )}
                    {item.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-200">
                        <i className="fa-solid fa-circle-notch animate-spin" /> Chờ duyệt
                      </span>
                    )}
                    {item.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-rose-200">
                        <i className="fa-solid fa-circle-xmark" /> Từ chối
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Discover & Apply */}
      {!loading && activeTab === 'discover' && (
        <div>
          {discoverTours.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <i className="fa-solid fa-circle-check text-4xl text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-slate-500">Bạn đã đăng ký toàn bộ các tour có trong hệ thống!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {discoverTours.map(tour => (
                <div
                  key={tour.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="h-44 overflow-hidden relative">
                    <img
                      src={tour.image}
                      alt={tour.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                      {tour.duration}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 line-clamp-1">{tour.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <i className="fa-solid fa-route text-slate-400" />
                        Tuyến: {tour.destination}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{tour.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-600">
                        {tour.price > 0 ? tour.price.toLocaleString('vi-VN') + ' đ' : 'Liên hệ'}
                      </span>
                      <Button
                        onClick={() => handleApplyClick(tour)}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Đăng ký dẫn tour
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-circle-question text-indigo-600" />
              Xác nhận Đăng ký
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn gửi yêu cầu cấp phép dẫn tour cho:
            </p>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-sm font-black text-slate-800">{selectedTour?.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">Tuyến điểm: {selectedTour?.destination}</p>
            </div>
            <p className="text-xs text-slate-400 mt-1 italic">
              * Yêu cầu sẽ được gửi tới Tour Planner để phê duyệt năng lực của bạn.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs font-bold rounded-xl"
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmApply}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              disabled={submitting}
            >
              {submitting && <Loader className="w-3.5 h-3.5 animate-spin" />}
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
