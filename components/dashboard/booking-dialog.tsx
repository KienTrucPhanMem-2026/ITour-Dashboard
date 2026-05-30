'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Booking, User as CustomerUser, Tour, Schedule } from '@/types';
import { customerService } from '@/services/customerService';
import { tourService } from '@/services/tourService';

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingData: any) => Promise<void>;
  booking?: Booking | null;
  isLoading?: boolean;
}

export function BookingDialog({
  isOpen,
  onClose,
  onSubmit,
  booking,
  isLoading,
}: BookingDialogProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    tourId: '',
    tourScheduleId: '',
    status: 'Pending',
    paymentStatus: 'Unpaid',
    adults: 1,
    children: 0,
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    discountAmount: 0,
    finalPrice: 0,
    paymentMethod: 'CASH',
    specialRequests: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Load Customers and Tours when dialog opens (only if creating new booking)
  useEffect(() => {
    if (isOpen) {
      if (!booking) {
        const loadInitialData = async () => {
          try {
            const customerResponse = await customerService.getCustomers();
            if (customerResponse.success && customerResponse.data) {
              setCustomers(customerResponse.data);
            }
            const tourResponse = await tourService.getTours({ status: 'ACTIVE' });
            if (tourResponse.success && tourResponse.data) {
              setTours(tourResponse.data);
            }
          } catch (error) {
            console.error('Failed to load customers or tours:', error);
          }
        };
        void loadInitialData();
      }
    }
  }, [isOpen, booking]);

  // Update form data when booking changes
  useEffect(() => {
    if (booking) {
      setFormData({
        customerId: booking.userId || '',
        tourId: booking.tourId || '',
        tourScheduleId: '', // Edit mode doesn't need to change schedule unless exposed
        status: booking.status || 'Pending',
        paymentStatus: booking.paymentStatus || 'Unpaid',
        adults: booking.adults || 0,
        children: booking.children || 0,
        quantity: booking.quantity || booking.numberOfPeople || 0,
        unitPrice: booking.unitPrice || 0,
        totalPrice: booking.totalPrice || 0,
        discountAmount: booking.discountAmount || 0,
        finalPrice: booking.finalPrice || booking.totalPrice || 0,
        paymentMethod: booking.paymentMethod || 'CASH',
        specialRequests: booking.specialRequests || '',
      });
    } else {
      // Clear/Reset form when creating new
      setFormData({
        customerId: '',
        tourId: '',
        tourScheduleId: '',
        status: 'Pending',
        paymentStatus: 'Unpaid',
        adults: 1,
        children: 0,
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        discountAmount: 0,
        finalPrice: 0,
        paymentMethod: 'CASH',
        specialRequests: '',
      });
      setSchedules([]);
    }
    setErrors({});
  }, [booking, isOpen]);

  // Automatically compute quantities and prices when adults, children, unitPrice, or discountAmount changes
  useEffect(() => {
    const totalQty = formData.adults + formData.children;
    const computedTotal = formData.unitPrice * totalQty;
    const computedFinal = Math.max(0, computedTotal - formData.discountAmount);

    setFormData((prev) => {
      if (
        prev.quantity !== totalQty ||
        prev.totalPrice !== computedTotal ||
        prev.finalPrice !== computedFinal
      ) {
        return {
          ...prev,
          quantity: totalQty,
          totalPrice: computedTotal,
          finalPrice: computedFinal,
        };
      }
      return prev;
    });
  }, [formData.adults, formData.children, formData.unitPrice, formData.discountAmount]);

  const handleTourChange = async (tourId: string) => {
    if (!tourId) {
      setSchedules([]);
      setFormData((prev) => ({ ...prev, tourScheduleId: '', unitPrice: 0 }));
      return;
    }

    try {
      const response = await tourService.getTourById(tourId);
      if (response.success && response.data) {
        setSchedules(response.data.schedules || []);
        // Preset unit price to base tour price
        setFormData((prev) => ({
          ...prev,
          unitPrice: response.data?.price || 0,
          tourScheduleId: '',
        }));
      }
    } catch (error) {
      console.error('Failed to load tour details:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!booking) {
      if (!formData.customerId) {
        newErrors.customerId = 'Vui lòng chọn khách hàng';
      }
      if (!formData.tourId) {
        newErrors.tourId = 'Vui lòng chọn tour';
      }
      if (!formData.tourScheduleId) {
        newErrors.tourScheduleId = 'Vui lòng chọn lịch khởi hành';
      }
    }

    if (formData.adults < 0) {
      newErrors.adults = 'Số người lớn không được âm';
    }
    if (formData.children < 0) {
      newErrors.children = 'Số trẻ em không được âm';
    }
    if (formData.adults + formData.children === 0) {
      newErrors.quantity = 'Tổng số hành khách phải lớn hơn 0';
    }
    if (formData.unitPrice < 0) {
      newErrors.unitPrice = 'Đơn giá không được âm';
    }
    if (formData.discountAmount < 0) {
      newErrors.discountAmount = 'Số tiền giảm giá không được âm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['adults', 'children', 'unitPrice', 'discountAmount'];

    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));

    if (name === 'tourScheduleId') {
      const selectedSchedule = schedules.find((s) => s.id === value);
      if (selectedSchedule) {
        setFormData((prev) => ({ ...prev, unitPrice: selectedSchedule.price }));
      }
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (booking) {
        // Edit mode submit
        const submitData = {
          ...booking,
          ...formData,
          numberOfPeople: formData.quantity,
        };
        await onSubmit(submitData);
      } else {
        // Create mode submit (matches BookingRequestDTO)
        const submitData = {
          customerId: formData.customerId,
          tourId: formData.tourId,
          tourScheduleId: formData.tourScheduleId,
          adults: formData.adults,
          children: formData.children,
          paymentMethod: formData.paymentMethod,
          note: formData.specialRequests,
        };
        await onSubmit(submitData);
      }
      onClose();
    } catch (error) {
      console.error('Error submitting booking form:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>{booking ? 'Chỉnh sửa Đặt Tour' : 'Thêm Đặt Tour Mới'}</DialogTitle>
          <DialogDescription>
            {booking
              ? `Cập nhật thông tin chi tiết hóa đơn đặt tour #${booking.id}`
              : 'Điền thông tin để đăng ký đặt tour mới cho khách hàng'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {booking ? (
              /* Edit Mode: Tour & User Info (Read-only labels) */
              <div className="col-span-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-sm text-slate-700">
                <div>
                  <span className="font-semibold block text-[11px] uppercase tracking-wider text-slate-500">Tên Tour</span>
                  {booking.tourName || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold block text-[11px] uppercase tracking-wider text-slate-500">Khách hàng</span>
                  {booking.userName || 'N/A'}
                </div>
              </div>
            ) : (
              /* Create Mode: Selectors for Customer, Tour & Schedule */
              <>
                {/* Customer select */}
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="customerId">Khách hàng *</Label>
                  <select
                    id="customerId"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-2xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-10 ${
                      errors.customerId ? 'border-red-500' : 'border-slate-200'
                    }`}
                  >
                    <option value="">Chọn khách hàng</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                  {errors.customerId && (
                    <p className="text-xs text-red-600">{errors.customerId}</p>
                  )}
                </div>

                {/* Tour select */}
                <div className="space-y-2">
                  <Label htmlFor="tourId">Tour *</Label>
                  <select
                    id="tourId"
                    name="tourId"
                    value={formData.tourId}
                    onChange={(e) => {
                      handleInputChange(e);
                      void handleTourChange(e.target.value);
                    }}
                    className={`w-full px-4 py-2 rounded-2xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-10 ${
                      errors.tourId ? 'border-red-500' : 'border-slate-200'
                    }`}
                  >
                    <option value="">Chọn Tour</option>
                    {tours.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {errors.tourId && (
                    <p className="text-xs text-red-600">{errors.tourId}</p>
                  )}
                </div>

                {/* Tour Schedule select */}
                <div className="space-y-2">
                  <Label htmlFor="tourScheduleId">Lịch khởi hành *</Label>
                  <select
                    id="tourScheduleId"
                    name="tourScheduleId"
                    value={formData.tourScheduleId}
                    onChange={handleInputChange}
                    disabled={!formData.tourId}
                    className={`w-full px-4 py-2 rounded-2xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-10 disabled:bg-slate-50 disabled:text-slate-400 ${
                      errors.tourScheduleId ? 'border-red-500' : 'border-slate-200'
                    }`}
                  >
                    <option value="">Chọn lịch khởi hành</option>
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {new Date(s.startDate).toLocaleDateString('vi-VN')} - {s.price.toLocaleString('vi-VN')}đ ({s.availableSlot} chỗ)
                      </option>
                    ))}
                  </select>
                  {errors.tourScheduleId && (
                    <p className="text-xs text-red-600">{errors.tourScheduleId}</p>
                  )}
                </div>
              </>
            )}

            {/* Status (Only in Edit mode) */}
            {booking && (
              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái Booking</Label>
                <select
                  id="status"
                  name="status"
                  title="Chọn trạng thái"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-10"
                >
                  <option value="Pending">Chờ xử lý</option>
                  <option value="Confirmed">Xác nhận</option>
                  <option value="Cancelled">Hủy bỏ</option>
                  <option value="Completed">Hoàn thành</option>
                </select>
              </div>
            )}

            {/* Payment Status (Only in Edit mode) */}
            {booking && (
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Thanh toán</Label>
                <select
                  id="paymentStatus"
                  name="paymentStatus"
                  title="Trạng thái thanh toán"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-10"
                >
                  <option value="Paid">Đã thanh toán</option>
                  <option value="Unpaid">Chưa thanh toán</option>
                  <option value="Refunded">Hoàn tiền</option>
                </select>
              </div>
            )}

            {/* Adults */}
            <div className="space-y-2">
              <Label htmlFor="adults">Người lớn *</Label>
              <Input
                id="adults"
                name="adults"
                type="number"
                min="0"
                value={formData.adults}
                onChange={handleInputChange}
                className="rounded-2xl"
              />
              {errors.adults && (
                <p className="text-xs text-red-600">{errors.adults}</p>
              )}
            </div>

            {/* Children */}
            <div className="space-y-2">
              <Label htmlFor="children">Trẻ em *</Label>
              <Input
                id="children"
                name="children"
                type="number"
                min="0"
                value={formData.children}
                onChange={handleInputChange}
                className="rounded-2xl"
              />
              {errors.children && (
                <p className="text-xs text-red-600">{errors.children}</p>
              )}
            </div>

            {/* Unit Price (Read-only in Create mode, computed from Schedule) */}
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Đơn giá (đ) *</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                min="0"
                disabled={!booking}
                value={formData.unitPrice}
                onChange={handleInputChange}
                className="rounded-2xl disabled:bg-slate-50 disabled:text-slate-500"
              />
              {errors.unitPrice && (
                <p className="text-xs text-red-600">{errors.unitPrice}</p>
              )}
            </div>

            {/* Discount Amount (Only in Edit mode) */}
            {booking ? (
              <div className="space-y-2">
                <Label htmlFor="discountAmount">Khuyến mãi / Giảm giá (đ) *</Label>
                <Input
                  id="discountAmount"
                  name="discountAmount"
                  type="number"
                  min="0"
                  value={formData.discountAmount}
                  onChange={handleInputChange}
                  className="rounded-2xl"
                />
                {errors.discountAmount && (
                  <p className="text-xs text-red-600">{errors.discountAmount}</p>
                )}
              </div>
            ) : (
              /* Spacing filler */
              <div />
            )}

            {/* Read-only Computed Fields */}
            <div className="space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 col-span-2 grid grid-cols-3 gap-2 text-xs font-medium text-slate-700">
              <div>
                <span className="block text-[10px] text-slate-500">Số lượng người:</span>
                <span className="text-sm font-bold text-slate-900">{formData.quantity}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Tổng cộng (đ):</span>
                <span className="text-sm font-bold text-slate-900">{formData.totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Thành tiền (đ):</span>
                <span className="text-sm font-bold text-emerald-600">{formData.finalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="paymentMethod">Phương thức thanh toán</Label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                title="Chọn phương thức"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-10"
              >
                <option value="CASH">Tiền mặt</option>
                <option value="CREDIT_CARD">Thẻ tín dụng</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
                <option value="E_WALLET">Ví điện tử</option>
              </select>
            </div>

            {/* Special Requests / Note */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="specialRequests">Yêu cầu đặc biệt / Ghi chú</Label>
              <Textarea
                id="specialRequests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
                className="rounded-2xl"
                rows={2}
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-2xl"
              disabled={isLoading}
            >
              Hủy
              {errors.quantity && (
                <p className="text-xs text-red-600 absolute -bottom-5 left-4">{errors.quantity}</p>
              )}
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl"
              disabled={isLoading}
            >
              {isLoading ? 'Đang xử lý...' : booking ? 'Cập nhật' : 'Đặt Tour'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
