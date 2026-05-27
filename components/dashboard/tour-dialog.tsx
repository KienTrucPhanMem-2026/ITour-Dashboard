'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tour } from '@/types';

interface TourDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  tour: Tour | null;
  isLoading?: boolean;
}

export function TourDialog({
  isOpen,
  onClose,
  onSubmit,
  tour,
  isLoading = false,
}: TourDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tourType: 'PRIVATE',
    price: 0,
    priceType: '',
    rating: 0,
    startDate: '',
    durationDays: 1,
    durationNights: 0,
    maximumSlots: 1,
    minPeople: 1,
    status: 'ACTIVE',
    startDestinationName: '',
    endDestinationName: '',
    availableSlots: 0,
    vehicleType: '',
  });

  useEffect(() => {
    if (tour) {
      setFormData({
        name: tour.name || '',
        description: tour.description || '',
        tourType: tour.tourType || 'PRIVATE',
        price: tour.price || 0,
        priceType: tour.priceType || '',
        rating: tour.rating || 0,
        startDate: tour.startDate || '',
        durationDays: tour.durationDays || 1,
        durationNights: tour.durationNights || 0,
        maximumSlots: tour.maximumSlots || 1,
        minPeople: tour.minPeople || 1,
        status: tour.status as any || 'ACTIVE',
        startDestinationName: tour.startDestinationName || '',
        endDestinationName: tour.endDestinationName || '',
        availableSlots: tour.availableSlots || 0,
        vehicleType: tour.vehicleType || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        tourType: 'PRIVATE',
        price: 0,
        priceType: '',
        rating: 0,
        startDate: '',
        durationDays: 1,
        durationNights: 0,
        maximumSlots: 1,
        minPeople: 1,
        status: 'ACTIVE',
        startDestinationName: '',
        endDestinationName: '',
        availableSlots: 0,
        vehicleType: '',
      });
    }
  }, [tour, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'rating' || name === 'durationDays' || 
               name === 'durationNights' || name === 'maximumSlots' || 
               name === 'minPeople' || name === 'availableSlots'
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Chỉ gửi những field mà user sửa (formData), loại bỏ NULL/empty values
    const dataToSubmit = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    await onSubmit(dataToSubmit);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tour ? 'Chỉnh Sửa Tour' : 'Tạo Tour Mới'}
          </DialogTitle>
          <DialogDescription>
            {tour
              ? 'Cập nhật thông tin tour'
              : 'Tạo một tour mới với thông tin chi tiết'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tên Tour */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Tên Tour
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập tên tour"
              required
              className="rounded-2xl"
            />
          </div>

          {/* Mô Tả */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Mô Tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nhập mô tả tour"
              rows={3}
              className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Loại Tour */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Loại Tour
              </label>
              <select
                name="tourType"
                value={formData.tourType}
                onChange={handleChange}
                title="Loại Tour"
                className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="PRIVATE">Riêng tư</option>
                <option value="GROUP">Nhóm</option>
                <option value="PUBLIC">Công cộng</option>
              </select>
            </div>

            {/* Giá */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Giá
              </label>
              <Input
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                placeholder="0"
                className="rounded-2xl"
              />
            </div>

            {/* Loại Giá */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Loại Giá
              </label>
              <Input
                name="priceType"
                value={formData.priceType}
                onChange={handleChange}
                placeholder="VND, USD, ..."
                className="rounded-2xl"
              />
            </div>

            {/* Đánh Giá */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Đánh Giá
              </label>
              <Input
                name="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={handleChange}
                placeholder="0-5"
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Điểm Xuất Phát */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Điểm Xuất Phát
              </label>
              <Input
                name="startDestinationName"
                value={formData.startDestinationName}
                onChange={handleChange}
                placeholder="Nhập điểm xuất phát"
                className="rounded-2xl"
              />
            </div>

            {/* Điểm Kết Thúc */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Điểm Kết Thúc
              </label>
              <Input
                name="endDestinationName"
                value={formData.endDestinationName}
                onChange={handleChange}
                placeholder="Nhập điểm kết thúc"
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Ngày Bắt Đầu */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Ngày Bắt Đầu
              </label>
              <Input
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className="rounded-2xl"
              />
            </div>

            {/* Số Ngày */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Số Ngày
              </label>
              <Input
                name="durationDays"
                type="number"
                min="1"
                value={formData.durationDays}
                onChange={handleChange}
                className="rounded-2xl"
              />
            </div>

            {/* Số Đêm */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Số Đêm
              </label>
              <Input
                name="durationNights"
                type="number"
                min="0"
                value={formData.durationNights}
                onChange={handleChange}
                className="rounded-2xl"
              />
            </div>

            {/* Loại Phương Tiện */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Loại Phương Tiện
              </label>
              <Input
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                placeholder="Ô tô, Máy bay, ..."
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Số Chỗ Tối Đa */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Số Chỗ Tối Đa
              </label>
              <Input
                name="maximumSlots"
                type="number"
                min="1"
                value={formData.maximumSlots}
                onChange={handleChange}
                className="rounded-2xl"
              />
            </div>

            {/* Số Người Tối Thiểu */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Số Người Tối Thiểu
              </label>
              <Input
                name="minPeople"
                type="number"
                min="1"
                value={formData.minPeople}
                onChange={handleChange}
                className="rounded-2xl"
              />
            </div>

            {/* Chỗ Có Sẵn */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Chỗ Có Sẵn
              </label>
              <Input
                name="availableSlots"
                type="number"
                min="0"
                value={formData.availableSlots}
                onChange={handleChange}
                className="rounded-2xl"
              />
            </div>
          </div>

          {/* Trạng Thái */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Trạng Thái
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              title="Trạng Thái Tour"
              className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ACTIVE">Đang Hoạt Động</option>
              <option value="INACTIVE">Không Hoạt Động</option>
              <option value="PENDING">Đợi Phê Duyệt</option>
              <option value="COMPLETED">Hoàn Thành</option>
              <option value="CANCELLED">Hủy</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-2xl"
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl"
              disabled={isLoading}
            >
              {isLoading ? 'Đang Lưu...' : tour ? 'Cập Nhật' : 'Tạo Tour'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
