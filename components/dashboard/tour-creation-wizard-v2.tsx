'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, ChevronRight, ChevronLeft, Plus, Trash2, Upload, Loader } from 'lucide-react';
import { tourService } from '@/services/tourService';
import { locationService } from '@/services/locationService';
import { vehicleService } from '@/services/vehicleService';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useCurrentUser } from '../../hooks/useAuth';

interface TourCreationWizardV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Location {
  id?: string;
  name: string;
  type: string;
  description: string;
  address: string;
}

interface Vehicle {
  id?: string;
  type: string;
  seatCount: number;
  description: string;
  transportCompanyId: string;
}

interface TourBasicInfo {
  id: string;
  name: string;
  description: string;
  tourType: 'JOIN_IN' | 'PRIVATE';
  price: number;
  rating: number;
  startDate: string;
  durationDays: number;
  durationNights: number;
  maximumSlots: number;
  minPeople: number;
  startDestinationId: string;
  endDestinationId: string;
  vehicleId: string;
}

interface ItineraryItem {
  locationId: string;
  visitOrder: number;
  days: number;
  note: string;
}

interface ScheduleItem {
  startDate: string;
  endDate: string;
  vehicleId: string;
  price: number;
  bookedPeople: number;
  note: string;
}

export function TourCreationWizardV2({ isOpen, onClose, onSuccess }: TourCreationWizardV2Props) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get current user for manager_id and tourPlannerId
  const user = useCurrentUser();

  // Data lists
  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Step 1: Basic Tour Info
  const [basicInfo, setBasicInfo] = useState<TourBasicInfo>({
    id: '',
    name: '',
    description: '',
    tourType: 'JOIN_IN',
    price: 0,
    rating: 0,
    startDate: '',
    durationDays: 0,
    durationNights: 0,
    maximumSlots: 20,
    minPeople: 2,
    startDestinationId: '',
    endDestinationId: '',
    vehicleId: '',
  });

  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newLocation, setNewLocation] = useState<Location>({
    name: '',
    type: '',
    description: '',
    address: '',
  });

  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Vehicle>({
    type: '',
    seatCount: 0,
    description: '',
    transportCompanyId: '',
  });

  // Step 2: Tour Images (3 images)
  const [tourImages, setTourImages] = useState<File[]>([]);
  const [tourImageUrls, setTourImageUrls] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);
  const [createdTourId, setCreatedTourId] = useState<string | null>(null);

  // Step 3: Itinerary
  const [itineraries, setItineraries] = useState<ItineraryItem[]>([]);
  const [itineraryForm, setItineraryForm] = useState<ItineraryItem>({
    locationId: '',
    visitOrder: 1,
    days: 1,
    note: '',
  });

  // Step 4: Schedule
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [scheduleForm, setScheduleForm] = useState<ScheduleItem>({
    startDate: '',
    endDate: '',
    vehicleId: '',
    price: 0,
    bookedPeople: 0,
    note: '',
  });

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadLocationsAndVehicles();
    }
  }, [isOpen]);

  const loadLocationsAndVehicles = async () => {
    setLoadingData(true);
    try {
      console.log('⏳ Loading locations and vehicles...');

      // Load locations
      const locResponse = await locationService.getLocations();
      if (locResponse.success && locResponse.data) {
        setLocations(locResponse.data);
        console.log('✅ Loaded', locResponse.data.length, 'locations');
      } else {
        console.warn('⚠️ Failed to load locations:', locResponse.message);
      }

      // Load vehicles
      const vehResponse = await vehicleService.getVehicles();
      if (vehResponse.success && vehResponse.data) {
        setVehicles(vehResponse.data);
        console.log('✅ Loaded', vehResponse.data.length, 'vehicles');
      } else {
        console.warn('⚠️ Failed to load vehicles:', vehResponse.message);
      }
    } catch (err) {
      console.error('❌ Error loading data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const generateId = (prefix: string): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const random6Digits = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    return `${prefix}${day}${month}${year}${random6Digits}`;
  };

  const generateTourId = (): string => {
    return generateId('C');
  };

  const handleBasicInfoChange = (field: keyof TourBasicInfo, value: any) => {
    setBasicInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddLocation = async () => {
    if (!newLocation.name.trim() || !newLocation.type.trim()) {
      setError('Vui lòng nhập tên và loại địa điểm');
      return;
    }
    try {
      console.log('📍 Creating location...');
      const response = await locationService.createLocation(newLocation);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Không thể tạo địa điểm');
      }

      setLocations([...locations, response.data]);
      setBasicInfo((prev) => ({
        ...prev,
        startDestinationId: response.data?.id || '',
      }));

      setShowNewLocation(false);
      setNewLocation({
        name: '',
        type: '',
        description: '',
        address: '',
      });
      setError(null);
      console.log('✅ Location created:', response.data.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tạo địa điểm';
      setError(message);
      console.error('❌ Error:', message);
    }
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.type.trim() || !newVehicle.seatCount) {
      setError('Vui lòng nhập loại xe và số chỗ');
      return;
    }
    try {
      console.log('🚌 Creating vehicle...');
      const response = await vehicleService.createVehicle(newVehicle);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Không thể tạo phương tiện');
      }

      setVehicles([...vehicles, response.data]);
      setBasicInfo((prev) => ({
        ...prev,
        vehicleId: response.data?.id || '',
      }));

      setShowNewVehicle(false);
      setNewVehicle({
        type: '',
        seatCount: 0,
        description: '',
        transportCompanyId: '',
      });
      setError(null);
      console.log('✅ Vehicle created:', response.data.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tạo phương tiện';
      setError(message);
      console.error('❌ Error:', message);
    }
  };

  const handleAddItinerary = () => {
    if (!itineraryForm.locationId) {
      setError('Vui lòng chọn địa điểm');
      return;
    }
    setItineraries((prev) => [...prev, { ...itineraryForm, visitOrder: prev.length + 1 }]);
    setItineraryForm({
      locationId: '',
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
    if (!scheduleForm.startDate || !scheduleForm.endDate || !scheduleForm.vehicleId) {
      setError('Vui lòng nhập đầy đủ thông tin lịch');
      return;
    }
    setSchedules((prev) => [...prev, { ...scheduleForm }]);
    setScheduleForm({
      startDate: '',
      endDate: '',
      vehicleId: '',
      price: 0,
      bookedPeople: 0,
      note: '',
    });
    setError(null);
  };

  const handleRemoveSchedule = (index: number) => {
    setSchedules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, imageIndex: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setError(null);

      // Upload to Cloudinary immediately
      setUploadingImageIndex(imageIndex);
      try {
        console.log(`☁️ Uploading image ${imageIndex + 1} to Cloudinary...`);
        const result = await uploadToCloudinary(file);

        if (result.success && result.imageUrl) {
          const newUrls = [...tourImageUrls];
          newUrls[imageIndex] = result.imageUrl;
          setTourImageUrls(newUrls);

          const newFiles = [...tourImages];
          newFiles[imageIndex] = file;
          setTourImages(newFiles);

          console.log(`✅ Image ${imageIndex + 1} uploaded to Cloudinary:`, result.imageUrl);
          setSuccessMessage(`✅ Ảnh ${imageIndex + 1} đã tải lên Cloudinary thành công!`);
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(result.error || `Không thể tải lên ảnh ${imageIndex + 1}`);
          console.error('❌ Upload failed:', result.error);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload error';
        setError(message);
        console.error('❌ Error:', message);
      } finally {
        setUploadingImageIndex(null);
      }
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!basicInfo.name.trim() || !basicInfo.startDestinationId || !basicInfo.endDestinationId || !basicInfo.vehicleId) {
        setError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      if (tourImageUrls.length < 3 || tourImageUrls.some(url => !url)) {
        setError('Vui lòng chọn và tải lên đầy đủ 3 ảnh');
        return;
      }
      setError(null);
      setStep(3);
    } else if (step === 3) {
      if (itineraries.length === 0) {
        setError('Vui lòng thêm ít nhất một điểm trong lịch trình');
        return;
      }
      setError(null);
      setStep(4);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!user || !user.id) {
        throw new Error('Bạn phải đăng nhập để tạo tour');
      }

      const tourId = generateTourId();
      const now = new Date().toISOString();
      const tourPayload = {
        ...basicInfo,
        id: tourId,
        availableSlots: basicInfo.maximumSlots,
        status: 'ACTIVE',
        managerId: '30052610000',
        tourPlannerId: user.id,
        createdAt: now,
        updatedAt: now,
      };

      // Add image data to payload if available (base64 string)
      const tourPayloadWithImage = {
        ...tourPayload,
      };

      console.log('📝 Creating tour...');
      const tourResponse = await tourService.createTour(tourPayloadWithImage as any);

      if (!tourResponse.success || !tourResponse.data) {
        throw new Error('Không thể tạo tour: ' + tourResponse.message);
      }

      const createdId = tourResponse.data.id;
      setCreatedTourId(createdId);
      console.log('✅ Tour created:', createdId);

      // Upload image URLs (from Cloudinary) to backend
      if (tourImageUrls.length > 0 && tourImageUrls.some(url => url)) {
        console.log('🖼️ Saving tour image URLs to backend:', tourImageUrls);
        for (let i = 0; i < tourImageUrls.length; i++) {
          if (tourImageUrls[i]) {
            const imagePayload = {
              id: generateId('TI'),
              tour: { id: createdId },
              imageUrl: tourImageUrls[i],
            };
            const imageResponse = await tourService.createTourImage(imagePayload);
            if (imageResponse.success) {
              console.log(`✅ Image ${i + 1} URL saved`);
            } else {
              console.warn(`⚠️ Failed to save image ${i + 1} URL:`, imageResponse.message);
            }
          }
        }
      }

      // Add itineraries
      console.log('📝 Adding itineraries...');
      for (const itinerary of itineraries) {
        const itineraryPayload = {
          id: generateId('TL'),
          tour: { id: createdId },
          location: { id: itinerary.locationId },
          visitOrder: itinerary.visitOrder,
          days: itinerary.days,
          note: itinerary.note,
        };
        const itineraryResponse = await tourService.createTourItinerary(itineraryPayload);
        if (!itineraryResponse.success) {
          throw new Error('Không thể thêm lịch trình: ' + itineraryResponse.message);
        }
      }
      console.log('✅ Itineraries added');

      // Add schedules
      if (schedules.length > 0) {
        console.log('📝 Adding schedules...');
        for (const schedule of schedules) {
          const schedulePayload = {
            id: generateId('TS'),
            tour: { id: createdId },
            vehicle: { id: schedule.vehicleId },
            startDate: schedule.startDate,
            endDate: schedule.endDate,
            price: schedule.price,
            bookedPeople: schedule.bookedPeople,
            availableSlot: basicInfo.maximumSlots - schedule.bookedPeople,
            isActive: true,
            note: schedule.note,
            status: 'UPCOMING',
          };
          const scheduleResponse = await tourService.createTourSchedule(schedulePayload);
          if (!scheduleResponse.success) {
            throw new Error('Không thể thêm lịch: ' + scheduleResponse.message);
          }
        }
        console.log('✅ Schedules added');
      }

      setSuccessMessage('✅ Tour được tạo thành công!');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      console.error('❌ Error:', message);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setError(null);
    setSuccessMessage(null);
    setCreatedTourId(null);
    setTourImages([]);
    setTourImageUrls([]);
    setIsUploadingImage(false);
    setUploadingImageIndex(null);
    setBasicInfo({
      id: '',
      name: '',
      description: '',
      tourType: 'JOIN_IN',
      price: 0,
      rating: 0,
      startDate: '',
      durationDays: 0,
      durationNights: 0,
      maximumSlots: 20,
      minPeople: 2,
      startDestinationId: '',
      endDestinationId: '',
      vehicleId: '',
    });
    setItineraries([]);
    setSchedules([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Tạo Tour Mới - Bước {step}/4
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
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              💡 Điền thông tin cơ bản về tour
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên Tour *</label>
              <Input
                placeholder="e.g., Tour Khám Phá Phú Quốc 5N4Đ"
                value={basicInfo.name}
                onChange={(e) => handleBasicInfoChange('name', e.target.value)}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại Tour *</label>
                <select
                  value={basicInfo.tourType}
                  onChange={(e) => handleBasicInfoChange('tourType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  title="Chọn loại tour"
                  aria-label="Loại Tour"
                >
                  <option value="JOIN_IN">Tham Gia Nhóm (JOIN_IN)</option>
                  <option value="PRIVATE">Riêng Tư (PRIVATE)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND) *</label>
                <Input
                  type="number"
                  min="0"
                  value={basicInfo.price}
                  onChange={(e) => handleBasicInfoChange('price', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đánh Giá (0-5)</label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={basicInfo.rating}
                  onChange={(e) => handleBasicInfoChange('rating', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Bắt Đầu *</label>
                <Input
                  type="date"
                  value={basicInfo.startDate}
                  onChange={(e) => handleBasicInfoChange('startDate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày (Số Đêm)</label>
                <Input
                  type="number"
                  min="1"
                  value={basicInfo.durationDays}
                  onChange={(e) => handleBasicInfoChange('durationDays', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đêm</label>
                <Input
                  type="number"
                  min="0"
                  value={basicInfo.durationNights}
                  onChange={(e) => handleBasicInfoChange('durationNights', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số Khách Tối Đa *</label>
                <Input
                  type="number"
                  min="1"
                  value={basicInfo.maximumSlots}
                  onChange={(e) => handleBasicInfoChange('maximumSlots', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số Khách Tối Thiểu *</label>
                <Input
                  type="number"
                  min="1"
                  value={basicInfo.minPeople}
                  onChange={(e) => handleBasicInfoChange('minPeople', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điểm Khởi Hành *</label>
                <div className="flex gap-2">
                  <select
                    value={basicInfo.startDestinationId}
                    onChange={(e) => handleBasicInfoChange('startDestinationId', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    title="Chọn điểm khởi hành"
                    aria-label="Điểm Khởi Hành"
                  >
                    <option value="">Chọn địa điểm</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => setShowNewLocation(!showNewLocation)}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {showNewLocation && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
                    <Input
                      placeholder="Tên địa điểm"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    />
                    <Input
                      placeholder="Loại (Thành phố, Huyện...)"
                      value={newLocation.type}
                      onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value })}
                    />
                    <Textarea
                      placeholder="Mô tả"
                      value={newLocation.description}
                      onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                      rows={2}
                    />
                    <Input
                      placeholder="Địa chỉ"
                      value={newLocation.address}
                      onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                    />
                    <Button onClick={handleAddLocation} size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Tạo Địa Điểm
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điểm Kết Thúc *</label>
                <div className="flex gap-2">
                  <select
                    value={basicInfo.endDestinationId}
                    onChange={(e) => handleBasicInfoChange('endDestinationId', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    title="Chọn điểm kết thúc"
                    aria-label="Điểm Kết Thúc"
                  >
                    <option value="">Chọn địa điểm</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => setShowNewLocation(!showNewLocation)}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phương Tiện *</label>
              <div className="flex gap-2">
                <select
                  value={basicInfo.vehicleId}
                  onChange={(e) => handleBasicInfoChange('vehicleId', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  title="Chọn phương tiện"
                  aria-label="Phương Tiện"
                >
                  <option value="">Chọn phương tiện</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.type} ({vehicle.seatCount} chỗ)
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => setShowNewVehicle(!showNewVehicle)}
                  size="sm"
                  variant="outline"
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Thêm
                </Button>
              </div>
              {showNewVehicle && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
                  <Input
                    placeholder="Loại xe (Xe buýt, Xe van...)"
                    value={newVehicle.type}
                    onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Số chỗ ngồi"
                    value={newVehicle.seatCount}
                    onChange={(e) => setNewVehicle({ ...newVehicle, seatCount: parseInt(e.target.value) })}
                  />
                  <Textarea
                    placeholder="Mô tả"
                    value={newVehicle.description}
                    onChange={(e) => setNewVehicle({ ...newVehicle, description: e.target.value })}
                    rows={2}
                  />
                  <Input
                    placeholder="ID Công Ty Vận Tải"
                    value={newVehicle.transportCompanyId}
                    onChange={(e) => setNewVehicle({ ...newVehicle, transportCompanyId: e.target.value })}
                  />
                  <Button onClick={handleAddVehicle} size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Tạo Phương Tiện
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Tour Images */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              ☁️ Tải lên 3 hình ảnh cho tour (qua Cloudinary)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((imageIndex) => (
                <div key={imageIndex} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {tourImageUrls[imageIndex] ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-green-600 text-sm">✅ Ảnh {imageIndex + 1}</p>
                      <img
                        src={tourImageUrls[imageIndex]}
                        alt={`Preview ${imageIndex + 1}`}
                        className="w-24 h-24 object-cover rounded mx-auto"
                      />
                      <p className="text-xs text-gray-600 truncate">
                        {tourImageUrls[imageIndex].substring(0, 40)}...
                      </p>
                      <Button
                        onClick={() => {
                          const newUrls = [...tourImageUrls];
                          newUrls[imageIndex] = '';
                          setTourImageUrls(newUrls);

                          const newFiles = [...tourImages];
                          newFiles.splice(imageIndex, 1);
                          setTourImages(newFiles);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-red-600 w-full"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Chọn lại
                      </Button>
                    </div>
                  ) : uploadingImageIndex === imageIndex ? (
                    <div className="space-y-2">
                      <Loader className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
                      <p className="text-xs text-blue-600 font-semibold">⏳ Đang tải...</p>
                    </div>
                  ) : (
                    <div>
                      <label className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                        <span className="text-xs text-gray-600 block">
                          Ảnh {imageIndex + 1}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageSelect(e, imageIndex)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800">
              💡 Vui lòng chọn 3 ảnh chính cho tour
            </div>
          </div>
        )}

        {/* Step 3: Itinerary */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              🗺️ Thêm các địa điểm lịch trình
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa Điểm *</label>
                <select
                  value={itineraryForm.locationId}
                  onChange={(e) => setItineraryForm({ ...itineraryForm, locationId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  title="Chọn địa điểm"
                  aria-label="Địa Điểm"
                >
                  <option value="">Chọn địa điểm</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thứ Tự</label>
                  <Input
                    type="number"
                    min="1"
                    value={itineraryForm.visitOrder}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, visitOrder: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số Ngày</label>
                  <Input
                    type="number"
                    min="1"
                    value={itineraryForm.days}
                    onChange={(e) => setItineraryForm({ ...itineraryForm, days: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi Chú</label>
                <Textarea
                  placeholder="Thông tin thêm"
                  value={itineraryForm.note}
                  onChange={(e) => setItineraryForm({ ...itineraryForm, note: e.target.value })}
                  rows={2}
                />
              </div>

              <Button onClick={handleAddItinerary} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Plus className="w-4 h-4" />
                Thêm Điểm
              </Button>
            </div>

            {itineraries.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Lịch Trình ({itineraries.length})</h3>
                <div className="space-y-2">
                  {itineraries.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.visitOrder}. Địa điểm
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.days} ngày {item.note && `• ${item.note}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveItinerary(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Xóa"
                        aria-label="Xóa"
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

        {/* Step 4: Schedule */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              📅 Thêm lịch tour (tuỳ chọn)
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Bắt Đầu</label>
                  <Input
                    type="date"
                    value={scheduleForm.startDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Kết Thúc</label>
                  <Input
                    type="date"
                    value={scheduleForm.endDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phương Tiện</label>
                <select
                  value={scheduleForm.vehicleId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  title="Chọn phương tiện"
                  aria-label="Phương Tiện"
                >
                  <option value="">Chọn phương tiện</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND)</label>
                  <Input
                    type="number"
                    min="0"
                    value={scheduleForm.price}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, price: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đã Đặt</label>
                  <Input
                    type="number"
                    min="0"
                    value={scheduleForm.bookedPeople}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, bookedPeople: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi Chú</label>
                <Textarea
                  placeholder="Thông tin thêm"
                  value={scheduleForm.note}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, note: e.target.value })}
                  rows={2}
                />
              </div>

              <Button onClick={handleAddSchedule} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Plus className="w-4 h-4" />
                Thêm Lịch
              </Button>
            </div>

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
                          {item.price.toLocaleString()} VND • Đã đặt: {item.bookedPeople}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveSchedule(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Xóa"
                        aria-label="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800">
              💡 Lịch là tùy chọn. Bạn có thể bỏ qua hoặc thêm sau.
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

            {step < 4 ? (
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
