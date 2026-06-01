'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { apiClient } from '@/lib/api-client';
import { tourService } from '@/services/tourService';
import { Tour } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader } from 'lucide-react';
import Swal from 'sweetalert2';

export default function TourPlannerCertificationsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [trainings, setTrainings] = useState<any[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Approved tab
  const [searchGuide, setSearchGuide] = useState('');
  const [selectedTourFilter, setSelectedTourFilter] = useState('ALL');

  // Modal actions
  const [actionItem, setActionItem] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revoke' | null>(null);
  const [noteText, setNoteText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, tourRes] = await Promise.all([
        apiClient.get<any[]>('/guide-trainings'),
        tourService.getTours()
      ]);
      if (tRes.success && Array.isArray(tRes.data)) {
        setTrainings(tRes.data);
      }
      if (tourRes.success && Array.isArray(tourRes.data)) {
        setTours(tourRes.data);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (item: any, type: 'approve' | 'reject' | 'revoke') => {
    setActionItem(item);
    setActionType(type);
    setNoteText('');
  };

  const handleConfirmAction = async () => {
    if (!actionItem || !actionType) return;
    setSubmitting(true);
    try {
      let res;
      if (actionType === 'approve') {
        res = await apiClient.post<any>(`/guide-trainings/${actionItem.id}/approve`, { note: noteText });
      } else if (actionType === 'reject') {
        if (!noteText.trim()) {
          Swal.fire({ icon: 'warning', title: 'Lưu ý', text: 'Vui lòng điền lý do từ chối.' });
          setSubmitting(false);
          return;
        }
        res = await apiClient.post<any>(`/guide-trainings/${actionItem.id}/reject`, { note: noteText });
      } else if (actionType === 'revoke') {
        res = await apiClient.delete<any>(`/guide-trainings/${actionItem.id}`);
      }

      if (res && res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: actionType === 'approve'
            ? 'Đã phê duyệt quyền dẫn tour.'
            : actionType === 'reject'
            ? 'Đã từ chối yêu cầu dẫn tour.'
            : 'Đã thu hồi quyền dẫn tour.',
          timer: 1500,
          showConfirmButton: false
        });
        setActionItem(null);
        setActionType(null);
        loadData();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Thao tác thất bại',
          text: res?.message || 'Có lỗi xảy ra trong quá trình xử lý.'
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.message || 'Không thể kết nối đến máy chủ.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter lists
  const pendingRequests = trainings.filter(t => t.status === 'PENDING');
  const approvedList = trainings.filter(t => {
    if (t.status !== 'APPROVED') return false;
    const matchGuide = t.tourGuideName?.toLowerCase().includes(searchGuide.toLowerCase()) ||
                       t.tourGuidePhone?.includes(searchGuide);
    const matchTour = selectedTourFilter === 'ALL' || t.tourId === selectedTourFilter;
    return matchGuide && matchTour;
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <i className="fa-solid fa-graduation-cap text-violet-600" />
          Quản Lý Cấp Phép & Đào Tạo HDV
        </h1>
        <p className="text-slate-500 text-xs mt-1">Phê duyệt năng lực hoặc phân công, thu hồi quyền dẫn tour của các hướng dẫn viên.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'pending'
              ? 'border-violet-600 text-violet-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <i className="fa-solid fa-clock-rotate-left" />
          Yêu cầu chờ duyệt
          {pendingRequests.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black ml-1 animate-pulse">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-5 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'approved'
              ? 'border-violet-600 text-violet-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <i className="fa-solid fa-circle-check" />
          Danh sách Cấp phép
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader className="w-8 h-8 text-violet-600 animate-spin" />
          <p className="text-sm text-slate-500 font-semibold">Đang tải dữ liệu...</p>
        </div>
      )}

      {/* Tab 1: Pending requests */}
      {!loading && activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <i className="fa-solid fa-circle-check text-4xl text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-slate-500">Tuyệt vời! Không có yêu cầu nào đang chờ duyệt</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map(item => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all gap-4"
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 font-black text-sm flex items-center justify-center flex-shrink-0">
                      {item.tourGuideName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-slate-800 truncate">{item.tourGuideName}</h3>
                      <p className="text-[10px] text-slate-400">Username: @{item.tourGuideUsername}</p>
                      {item.tourGuidePhone && <p className="text-[10px] text-slate-500 mt-0.5"><i className="fa-solid fa-phone text-[8px] mr-1" />{item.tourGuidePhone}</p>}
                      <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-xs font-black text-indigo-700">Đăng ký dẫn: {item.tourName}</p>
                        <p className="text-[9px] text-slate-400 mt-1">Ngày gửi: {item.requestDate ? new Date(item.requestDate).toLocaleString('vi-VN') : ''}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <Button
                      onClick={() => handleActionClick(item, 'reject')}
                      variant="outline"
                      size="sm"
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Từ chối
                    </Button>
                    <Button
                      onClick={() => handleActionClick(item, 'approve')}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Phê duyệt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Approved list */}
      {!loading && activeTab === 'approved' && (
        <div className="space-y-4">
          {/* Lọc ngang */}
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <div className="relative w-full sm:w-72">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Tìm tên Hướng dẫn viên..."
                value={searchGuide}
                onChange={e => setSearchGuide(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 font-semibold text-slate-700"
              />
            </div>
            <div className="w-full sm:w-60">
              <select
                value={selectedTourFilter}
                onChange={e => setSelectedTourFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 font-semibold text-slate-700 cursor-pointer"
              >
                <option value="ALL">-- Lọc theo tất cả Tour --</option>
                {tours.map(tour => (
                  <option key={tour.id} value={tour.id}>{tour.name}</option>
                ))}
              </select>
            </div>
            <div className="text-[10px] font-bold text-slate-500 ml-auto">
              Tìm thấy {approvedList.length} kết quả
            </div>
          </div>

          {approvedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <i className="fa-solid fa-folder-open text-4xl text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500">Không tìm thấy hướng dẫn viên nào được cấp phép</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-xs text-slate-600">Hướng dẫn viên</TableHead>
                    <TableHead className="font-bold text-xs text-slate-600">Mã HDV</TableHead>
                    <TableHead className="font-bold text-xs text-slate-600">Tour cấp phép</TableHead>
                    <TableHead className="font-bold text-xs text-slate-600">Ngày cấp phép</TableHead>
                    <TableHead className="font-bold text-xs text-slate-600">Ghi chú</TableHead>
                    <TableHead className="font-bold text-xs text-slate-600 text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedList.map(item => (
                    <TableRow key={item.id} className="hover:bg-slate-50/60">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center">
                            {item.tourGuideName?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{item.tourGuideName}</p>
                            <p className="text-[10px] text-slate-400">{item.tourGuidePhone || '---'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-600">{item.tourGuideId}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-800">{item.tourName}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {item.approvalDate ? new Date(item.approvalDate).toLocaleDateString('vi-VN') : '---'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 italic max-w-xs truncate" title={item.note}>{item.note || '---'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleActionClick(item, 'revoke')}
                          variant="outline"
                          size="xs"
                          className="border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 text-[10px] font-bold rounded-lg cursor-pointer"
                        >
                          Thu hồi quyền
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={actionItem !== null} onOpenChange={open => !open && setActionItem(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-800 flex items-center gap-2">
              {actionType === 'approve' && <i className="fa-solid fa-circle-check text-emerald-500" />}
              {actionType === 'reject' && <i className="fa-solid fa-circle-xmark text-rose-500" />}
              {actionType === 'revoke' && <i className="fa-solid fa-circle-exclamation text-amber-500" />}
              {actionType === 'approve' && 'Phê duyệt Yêu cầu'}
              {actionType === 'reject' && 'Từ chối Yêu cầu'}
              {actionType === 'revoke' && 'Thu hồi Quyền dẫn Tour'}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <p className="text-xs text-slate-500">Hướng dẫn viên: <strong className="text-slate-800">{actionItem?.tourGuideName}</strong></p>
              <p className="text-xs text-slate-500">Tour đăng ký: <strong className="text-slate-800">{actionItem?.tourName}</strong></p>
            </div>

            {actionType === 'revoke' ? (
              <p className="text-xs text-slate-500 font-bold bg-amber-50 border border-amber-100 text-amber-700 p-2.5 rounded-lg">
                ⚠️ Cảnh báo: Thao tác này sẽ xóa quyền dẫn tour này của HDV. HDV sẽ không thể được gán lịch cho tour này nữa.
              </p>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600">Ghi chú / Lý do {actionType === 'reject' && '(bắt buộc)'}:</label>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder={actionType === 'reject' ? "Vui lòng nhập lý do từ chối..." : "Nhập ghi chú phản hồi..."}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 font-semibold text-slate-700 min-h-[80px]"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setActionItem(null)}
              className="text-xs font-bold rounded-xl"
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmAction}
              className={`text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer ${
                actionType === 'reject' || actionType === 'revoke'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              disabled={submitting}
            >
              {submitting && <Loader className="w-3.5 h-3.5 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
