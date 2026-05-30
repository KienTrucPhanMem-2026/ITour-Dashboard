'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { tourService } from '@/services/tourService';

interface TourCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BasicTourInfo {
  name: string;
  destination: string;
  description: string;
  duration: string;
  capacity: number;
  price: number;
  startDate: string;
}

interface ItineraryItem {
  locationName: string;
  visitOrder: number;
  days: number;
  note: string;
}

interface ScheduleItem {
  startDate: string;
  endDate: string;
  vehicleId: string;
  price: number;
}

export function TourCreationWizard({ isOpen, onClose, onSuccess }: TourCreationWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdTourId, setCreatedTourId] = useState<string | null>(null);

  // Step 1: Basic Tour Info
  const [basicInfo, setBasicInfo] = useState<BasicTourInfo>({
    name: '',
    destination: '',
    description: '',
    duration: '',
    capacity: 20,
    price: 0,
    startDate: '',
  });

  // Step 2: Itinerary
  const [itineraries, setItineraries] = useState<ItineraryItem[]>([]);
  const [itineraryForm, setItineraryForm] = useState<ItineraryItem>({
    locationName: '',
    visitOrder: 1,
    days: 1,
    note: '',
  });

  // Step 3: Schedule
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [scheduleForm, setScheduleForm] = useState<ScheduleItem>({
    startDate: '',
    endDate: '',
    vehicleId: '',
    price: 0,
  });

  const handleBasicInfoChange = (field: keyof BasicTourInfo, value: any) => {
    setBasicInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddItinerary = () => {
    if (!itineraryForm.locationName.trim()) {
      setError('Vui lòng nhập tên địa điểm');
      return;
    }
    setItineraries((prev) => [...prev, { ...itineraryForm, visitOrder: prev.length + 1 }]);
    setItineraryForm({
      locationName: '',
      visitOrder: itineraries.length + 2,
      days: 1,
      note: '',
    });
    setError(null);
  };

  const handleRemoveItinerary = (index: number) => {
    setItineraries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSchedule = () => {
    if (!scheduleForm.startDate || !scheduleForm.endDate) {
      setError('Vui lòng nhập ngày bắt đầu và kết thúc');
      return;
    }
    setSchedules((prev) => [...prev, { ...scheduleForm }]);
    setScheduleForm({
      startDate: '',
      endDate: '',
      vehicleId: '',
      price: 0,
    });
    setError(null);
  };

  const handleRemoveSchedule = (index: number) => {
    setSchedules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!basicInfo.name.trim() || !basicInfo.destination.trim()) {
        setError('Vui lòng nhập tên tour và điểm đến');
        return;
      }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      if (itineraries.length === 0) {
        setError('Vui lòng thêm ít nhất một điểm trong lịch trình');
        return;
      }
      setError(null);
      setStep(3);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  const generateTourId = (): string => {
    // Format: C | ddmmyyyy | Random 6 digits
    // Example: C29052026123456
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const random6Digits = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    
    return `C${day}${month}${year}${random6Digits}`;
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Step 1: Create tour with generated ID
      const newTourId = generateTourId();
      const tourPayload = {
        ...basicInfo,
        id: newTourId,
        status: 'ACTIVE',
      };
      console.log('📝 Creating tour with info:', tourPayload);
      const tourResponse = await tourService.createTour(tourPayload as any);
      
      if (!tourResponse.success || !tourResponse.data) {
        throw new Error('Không thể tạo tour: ' + tourResponse.message);
      }

      const createdTourId = tourResponse.data.id;
      setCreatedTourId(createdTourId);
      console.log('✅ Tour created with ID:', createdTourId);

      // Step 2: Add itineraries
      console.log('📝 Adding itineraries...');
      for (const itinerary of itineraries) {
        const itineraryPayload = {
          tourId: createdTourId,
          locationName: itinerary.locationName,
          visitOrder: itinerary.visitOrder,
          days: itinerary.days,
          note: itinerary.note,
        };
        console.log('➕ Creating itinerary:', itineraryPayload);
        const itineraryResponse = await tourService.createTourItinerary(itineraryPayload);
        if (!itineraryResponse.success) {
          throw new Error('Không thể thêm lịch trình: ' + itineraryResponse.message);
        }
      }
      console.log('✅ All itineraries added');

      // Step 3: Add schedules (optional)
      if (schedules.length > 0) {
        console.log('📝 Adding schedules...');
        for (const schedule of schedules) {
          const schedulePayload = {
            tourId: createdTourId,
            startDate: schedule.startDate,
            endDate: schedule.endDate,
            vehicleId: schedule.vehicleId,
            price: schedule.price,
          };
          console.log('➕ Creating schedule:', schedulePayload);
          const scheduleResponse = await tourService.createTourSchedule(schedulePayload);
          if (!scheduleResponse.success) {
            throw new Error('Không thể thêm lịch: ' + scheduleResponse.message);
          }
        }
        console.log('✅ All schedules added');
      }

      setSuccessMessage('✅ Tour được tạo thành công!');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      console.error('❌ Error creating tour:', message);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setStep(1);
    setError(null);
    setSuccessMessage(null);
    setCreatedTourId(null);
    setBasicInfo({
      name: '',
      destination: '',
      description: '',
      duration: '',
      capacity: 20,
      price: 0,
      startDate: '',
    });
    setItineraries([]);
    setItineraryForm({
      locationName: '',
      visitOrder: 1,
      days: 1,
      note: '',
    });
    setSchedules([]);
    setScheduleForm({
      startDate: '',
      endDate: '',
      vehicleId: '',
      price: 0,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Tạo Tour Mới - Bước {step}/3
          </DialogTitle>
        </DialogHeader>

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-emerald-700 font-semibold">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên Tour *</label>
              <Input
                placeholder="e.g., Bali Beach Paradise"
                value={basicInfo.name}
                onChange={(e) => handleBasicInfoChange('name', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điểm Đến *</label>
              <Input
                placeholder="e.g., Bali, Indonesia"
                value={basicInfo.destination}
                onChange={(e) => handleBasicInfoChange('destination', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô Tả</label>
              <Textarea
                placeholder="Mô tả chi tiết về tour"
                value={basicInfo.description}
                onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời Gian (ngày)</label>
                <Input
                  placeholder="e.g., 7"
                  type="number"
                  value={basicInfo.duration}
                  onChange={(e) => handleBasicInfoChange('duration', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sức Chứa (người)</label>
                <Input
                  type="number"
                  min="1"
                  value={basicInfo.capacity}
                  onChange={(e) => handleBasicInfoChange('capacity', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND)</label>
                <Input
                  type="number"
                  min="0"
                  value={basicInfo.price}
                  onChange={(e) => handleBasicInfoChange('price', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Bắt Đầu</label>
                <Input
                  type="date"
                  value={basicInfo.startDate}
                  onChange={(e) => handleBasicInfoChange('startDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Itinerary */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">Thêm Điểm Trong Lịch Trình</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên Địa Điểm *</label>
                  <Input
                    placeholder="e.g., Bali Beach"
                    value={itineraryForm.locationName}
                    onChange={(e) => setItineraryForm((prev) => ({ ...prev, locationName: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thứ Tự Thăm</label>
                    <Input
                      type="number"
                      min="1"
                      value={itineraryForm.visitOrder}
                      onChange={(e) => setItineraryForm((prev) => ({ ...prev, visitOrder: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số Ngày Tại Đó</label>
                    <Input
                      type="number"
                      min="1"
                      value={itineraryForm.days}
                      onChange={(e) => setItineraryForm((prev) => ({ ...prev, days: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi Chú</label>
                  <Textarea
                    placeholder="Thông tin thêm về địa điểm"
                    value={itineraryForm.note}
                    onChange={(e) => setItineraryForm((prev) => ({ ...prev, note: e.target.value }))}
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleAddItinerary}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Thêm Điểm
                </Button>
              </div>
            </div>

            {/* List of added itineraries */}
            {itineraries.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Lịch Trình Đã Thêm ({itineraries.length})</h3>
                <div className="space-y-2">
                  {itineraries.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.visitOrder}. {item.locationName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.days} ngày
                          {item.note && ` • ${item.note}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveItinerary(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Xóa điểm lịch trình"
                        aria-label="Xóa điểm lịch trình"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">Thêm Lịch (Tùy Chọn)</h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Bắt Đầu</label>
                    <Input
                      type="date"
                      value={scheduleForm.startDate}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Kết Thúc</label>
                    <Input
                      type="date"
                      value={scheduleForm.endDate}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Xe</label>
                    <Input
                      placeholder="e.g., VH001"
                      value={scheduleForm.vehicleId}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, vehicleId: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND)</label>
                    <Input
                      type="number"
                      min="0"
                      value={scheduleForm.price}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, price: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAddSchedule}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Thêm Lịch
                </Button>
              </div>
            </div>

            {/* List of added schedules */}
            {schedules.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Lịch Đã Thêm ({schedules.length})</h3>
                <div className="space-y-2">
                  {schedules.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.startDate} → {item.endDate}
                        </p>
                        <p className="text-sm text-gray-600">
                          Xe: {item.vehicleId} • Giá: {item.price.toLocaleString()} VND
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveSchedule(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Xóa lịch"
                        aria-label="Xóa lịch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800">
              💡 Lịch là tùy chọn. Bạn có thể bỏ qua bước này hoặc thêm lịch sau.
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between gap-3">
          <Button
            onClick={handlePrevious}
            variant="outline"
            disabled={step === 1 || isSubmitting}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay Lại
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isSubmitting}
            >
              Hủy
            </Button>

            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                Tiếp Theo
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? 'Đang tạo...' : 'Hoàn Thành'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
