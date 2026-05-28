'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { TourTable } from '@/components/dashboard/tour-table';
import { TourDialog } from '@/components/dashboard/tour-dialog';
import { TourImageDialog } from '@/components/dashboard/tour-image-dialog';
import { TourScheduleDialog } from '@/components/dashboard/tour-schedule-dialog';
import { TourItineraryDialog } from '@/components/dashboard/tour-itinerary-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import { tourService } from '@/services/tourService';
import { Tour } from '@/types';

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isItineraryDialogOpen, setIsItineraryDialogOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTours();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tours, searchQuery, statusFilter]);

  const applyFilters = () => {
    let filtered = tours;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (tour) =>
          tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tour.destination?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter - use uppercase for backend compatibility
    if (statusFilter) {
      filtered = filtered.filter((tour) => {
        const tourStatus = String(tour.status).toUpperCase();
        return tourStatus === statusFilter.toUpperCase();
      });
    }

    setFilteredTours(filtered);
  };

  const fetchTours = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tourService.getTours();
      
      if (!response.success) {
        console.warn('⚠️ Không thể lấy dữ liệu từ backend');
        setError(response.message || 'Không thể lấy dữ liệu từ backend');
        setTours([]);
        return;
      }

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setTours(response.data);
      } else {
        console.warn('⚠️ Backend trả về danh sách tours TRỐNG');
        setTours([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      console.error('❌ Lỗi khi fetch tours:', message, err);
      setError(message);
      setTours([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTour = () => {
    setSelectedTour(null);
    setIsDialogOpen(true);
  };

  const handleEdit = async (tour: Tour) => {
    // Load full tour data from backend before opening dialog
    try {
      const response = await tourService.getTourById(tour.id);
      if (response.success && response.data) {
        setSelectedTour(response.data);
        setIsDialogOpen(true);
      } else {
        console.warn('⚠️ Không thể lấy dữ liệu tour, dùng dữ liệu từ table');
        setSelectedTour(tour);
        setIsDialogOpen(true);
      }
    } catch (err) {
      console.error('❌ Lỗi khi fetch tour chi tiết:', err);
      setSelectedTour(tour);
      setIsDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedTour(null);
  };

  const handleImageDialogClose = () => {
    setIsImageDialogOpen(false);
    setSelectedTour(null);
  };

  const handleEditImage = (tour: Tour) => {
    setSelectedTour(tour);
    setIsImageDialogOpen(true);
  };

  const handleItineraryDialogClose = () => {
    setIsItineraryDialogOpen(false);
    setSelectedTour(null);
  };

  const handleEditItinerary = async (tour: Tour) => {
    // Load full tour data from backend before opening dialog
    try {
      const response = await tourService.getTourById(tour.id);
      if (response.success && response.data) {
        setSelectedTour(response.data);
        setIsItineraryDialogOpen(true);
      } else {
        alert('Lỗi: Không thể tải dữ liệu tour');
      }
    } catch (err) {
      console.error('❌ Error loading tour:', err);
      alert('Lỗi: Không thể tải dữ liệu tour');
    }
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (selectedTour) {
        // Update existing tour
        await tourService.updateTour(selectedTour.id, formData);
        setTours(
          tours.map((tour) =>
            tour.id === selectedTour.id
              ? { ...tour, ...formData, updatedAt: new Date().toISOString() }
              : tour
          )
        );
      } else {
        // Create new tour
        const response = await tourService.createTour(formData as any);
        if (response.success && response.data) {
          setTours([...tours, response.data]);
        }
      }
      handleDialogClose();
    } catch (err) {
      console.error('Failed to save tour:', err);
      alert('Lỗi: Không thể lưu tour. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisableTour = async (tourId: string) => {
    if (confirm('Bạn có chắc chắn muốn vô hiệu hóa tour này?')) {
      try {
        await tourService.disableTour(tourId);
        setTours(
          tours.map((tour) =>
            tour.id === tourId
              ? { ...tour, status: 'INACTIVE' }
              : tour
          )
        );
      } catch (err) {
        console.error('Failed to disable tour:', err);
        alert('Lỗi: Không thể vô hiệu hóa tour. Vui lòng thử lại.');
      }
    }
  };

  const handleAddImage = (tourId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          await tourService.addTourImage(tourId, file);
          alert('Thêm ảnh thành công!');
          fetchTours();
        } catch (err) {
          console.error('Failed to add image:', err);
          alert('Lỗi: Không thể thêm ảnh. Vui lòng thử lại.');
        }
      }
    };
    input.click();
  };

  const handleDeleteImage = async (tourId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa ảnh này?')) {
      try {
        await tourService.deleteTourImage(tourId);
        alert('Xóa ảnh thành công!');
        fetchTours();
      } catch (err) {
        console.error('Failed to delete image:', err);
        alert('Lỗi: Không thể xóa ảnh. Vui lòng thử lại.');
      }
    }
  };

  const handleEditSchedule = async (tour: Tour) => {
    // Load full tour data from backend before opening schedule dialog
    try {
      const response = await tourService.getTourById(tour.id);
      if (response.success && response.data) {
        setSelectedTour(response.data);
        setIsScheduleDialogOpen(true);
      } else {
        console.warn('⚠️ Không thể lấy dữ liệu tour, dùng dữ liệu từ table');
        setSelectedTour(tour);
        setIsScheduleDialogOpen(true);
      }
    } catch (err) {
      console.error('❌ Lỗi khi fetch tour schedules:', err);
      setSelectedTour(tour);
      setIsScheduleDialogOpen(true);
    }
  };

  const handleScheduleDialogClose = () => {
    setIsScheduleDialogOpen(false);
    setSelectedTour(null);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Quản Lý Tours</h1>
            <p className="text-slate-500 mt-2">Quản lý tất cả các tours và gói tour</p>
          </div>
          <Button
            onClick={handleCreateTour}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo Tour Mới
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo tên tour hoặc điểm đến..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-2 rounded-2xl border border-slate-200"
          />
        </div>
        
        <div className="flex gap-2">
          <Filter className="w-5 h-5 text-slate-500 mt-2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Lọc theo trạng thái"
            className="flex-1 px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Không hoạt động</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-sm text-red-700 font-semibold mb-2">⚠️ Lỗi:</p>
          <p className="text-sm text-red-600 break-words">{error}</p>
        </div>
      )}

      {/* Loading Message */}
      {isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <p className="text-sm text-blue-700">
            ⏳ Đang tải dữ liệu tours...
          </p>
        </div>
      )}

      {/* Tours Table */}
      <div>
        <TourTable 
          tours={filteredTours} 
          isLoading={isLoading}
          onEdit={handleEdit}
          onDisable={handleDisableTour}
          onEditImage={handleEditImage}
          onEditSchedule={handleEditSchedule}
          onEditItinerary={handleEditItinerary}
        />
      </div>

      {/* Tour Dialog */}
      <TourDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleSubmit}
        tour={selectedTour}
        isLoading={isSubmitting}
      />

      {/* Tour Image Dialog */}
      {selectedTour && (
        <TourImageDialog
          isOpen={isImageDialogOpen}
          onClose={handleImageDialogClose}
          tourId={selectedTour.id}
          tourName={selectedTour.name}
          onImageAdded={fetchTours}
          onImageDeleted={fetchTours}
        />
      )}

      {/* Tour Schedule Dialog */}
      {selectedTour && (
        <TourScheduleDialog
          isOpen={isScheduleDialogOpen}
          onClose={handleScheduleDialogClose}
          tourId={selectedTour.id}
          tourName={selectedTour.name}
          schedules={selectedTour.schedules}
          onSchedulesUpdate={(schedules) => {
            setSelectedTour({
              ...selectedTour,
              schedules,
            });
          }}
        />
      )}

      {/* Tour Itinerary Dialog */}
      {selectedTour && (
        <TourItineraryDialog
          isOpen={isItineraryDialogOpen}
          onClose={handleItineraryDialogClose}
          tourId={selectedTour.id}
          tourName={selectedTour.name}
          itineraries={selectedTour.itinerary}
          onItinerariesUpdate={(itineraries) => {
            setSelectedTour({
              ...selectedTour,
              itinerary: itineraries,
            });
          }}
        />
      )}
    </DashboardLayout>
  );
}

// Mock data as fallback
const mockTours: Tour[] = [
  {
    id: '1',
    name: 'Bali Beach Paradise',
    destination: 'Bali, Indonesia',
    status: 'ACTIVE',
    startDate: 'Mar 15, 2024',
    duration: '7 days',
    capacity: 30,
    booked: 24,
    price: 1299,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Paris City Tour',
    destination: 'Paris, France',
    status: 'ACTIVE',
    startDate: 'Mar 20, 2024',
    duration: '5 days',
    capacity: 25,
    booked: 22,
    price: 1599,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '3',
    name: 'Tokyo Adventure',
    destination: 'Tokyo, Japan',
    status: 'PENDING',
    startDate: 'Apr 10, 2024',
    duration: '8 days',
    capacity: 35,
    booked: 18,
    price: 1899,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '4',
    name: 'New York Explorer',
    destination: 'New York, USA',
    status: 'ACTIVE',
    startDate: 'Mar 25, 2024',
    duration: '4 days',
    capacity: 40,
    booked: 35,
    price: 999,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '5',
    name: 'Safari Expedition',
    destination: 'Kenya, Africa',
    status: 'COMPLETED',
    startDate: 'Feb 28, 2024',
    duration: '6 days',
    capacity: 20,
    booked: 20,
    price: 2499,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];
