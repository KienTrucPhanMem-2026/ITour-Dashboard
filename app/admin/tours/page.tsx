'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { TourTable } from '@/components/dashboard/tour-table';
import { TourViewerDrawer } from '@/components/dashboard/tour-viewer-drawer';
import { tourService } from '@/services/tourService';
import { locationService } from '@/services/locationService';
import { Tour } from '@/types';
import { message, Modal } from 'antd';

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [locations, setLocations] = useState<any[]>([]);
  const [locationFilter, setLocationFilter] = useState<string>('');

  // Tour Viewer Drawer states
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerStep, setViewerStep] = useState(0);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  useEffect(() => {
    fetchTours();
    fetchLocations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tours, searchQuery, statusFilter, locationFilter, locations]);

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

    // Apply location filter (hierarchical matching)
    if (locationFilter) {
      // Collect descendants of selected location
      const descendantIds = [locationFilter];
      const descendantNames: string[] = [];
      const selectedLoc = locations.find((l) => l.id === locationFilter);
      if (selectedLoc) {
        descendantNames.push(selectedLoc.name.toLowerCase());
      }

      let checked = 0;
      while (checked < descendantIds.length) {
        const currentId = descendantIds[checked];
        const children = locations.filter((l) => l.parentId === currentId);
        for (const child of children) {
          if (child.id && !descendantIds.includes(child.id)) {
            descendantIds.push(child.id);
            descendantNames.push(child.name.toLowerCase());
          }
        }
        checked++;
      }

      // Filter tours based on direct IDs OR name matching
      filtered = filtered.filter((tour) => {
        // 1. Direct ID match
        const startMatch = tour.startDestinationId && descendantIds.includes(tour.startDestinationId);
        const endMatch = tour.endDestinationId && descendantIds.includes(tour.endDestinationId);
        if (startMatch || endMatch) return true;

        // 2. Name matching with destination string (e.g. tour goes through the city or attraction)
        if (tour.destination) {
          const tourDestLower = tour.destination.toLowerCase();
          return descendantNames.some((name) => tourDestLower.includes(name));
        }

        return false;
      });
    }

    setFilteredTours(filtered);
  };

  const fetchLocations = async () => {
    try {
      const response = await locationService.getLocations();
      if (response.success && response.data) {
        setLocations(response.data);
      }
    } catch (err) {
      console.error('❌ Lỗi khi fetch locations:', err);
    }
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

      if (response.data && Array.isArray(response.data)) {
        setTours(response.data);
      } else {
        setTours([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      console.error('❌ Lỗi khi fetch tours:', msg, err);
      setError(msg);
      setTours([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to fetch full details and open viewer drawer
  const openTourViewer = async (tour: Tour, step: number = 0) => {
    setIsLoading(true);
    try {
      const response = await tourService.getTourById(tour.id);
      if (response.success && response.data) {
        setSelectedTour(response.data);
      } else {
        setSelectedTour(tour);
      }
      setViewerStep(step);
      setIsViewerOpen(true);
    } catch (err) {
      console.error('❌ Lỗi khi fetch tour chi tiết:', err);
      setSelectedTour(tour);
      setViewerStep(step);
      setIsViewerOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Actions mapped to Viewer Drawer steps
  const handleEdit = (tour: Tour) => {
    openTourViewer(tour, 0); // Step 0: General Info
  };

  const handleEditItinerary = (tour: Tour) => {
    openTourViewer(tour, 1); // Step 1: Itinerary
  };

  const handleEditImage = (tour: Tour) => {
    openTourViewer(tour, 2); // Step 2: Media Gallery
  };

  const handleEditSchedule = (tour: Tour) => {
    openTourViewer(tour, 3); // Step 3: Pricing & Policies
  };

  const handleViewSchedules = (tour: Tour) => {
    openTourViewer(tour, 4); // Step 4: Actual Departures (Tab 5)
  };

  // Disable / Deactivate tour using AntD Modal.confirm for Admin
  const handleDisableTour = async (tourId: string) => {
    const tour = tours.find(t => t.id === tourId);
    if (!tour) return;

    const isAct = String(tour.status).toUpperCase() === 'ACTIVE';

    Modal.confirm({
      title: <span className="font-bold text-slate-900 text-lg">{isAct ? 'Vô hiệu hóa' : 'Kích hoạt'} khuôn mẫu tour</span>,
      content: (
        <p className="text-slate-600 text-sm mt-2">
          Bạn có chắc chắn muốn {isAct ? 'vô hiệu hóa' : 'kích hoạt'} khuôn mẫu tour{' '}
          <strong className="text-slate-900 font-extrabold">"{tour.name}"</strong>? 
          {isAct 
            ? ' Khách hàng sẽ không thể nhìn thấy hoặc đặt tour này trên website cho đến khi được kích hoạt trở lại.' 
            : ' Tour này sẽ xuất hiện trở lại trên danh mục đặt tour của khách hàng.'
          }
        </p>
      ),
      okText: isAct ? 'Vô hiệu hóa' : 'Kích hoạt',
      okType: isAct ? 'danger' : 'primary',
      cancelText: 'Hủy bỏ',
      centered: true,
      className: 'custom-confirm-modal',
      okButtonProps: { 
        className: `rounded-xl font-bold border-0 h-9 ${
          isAct 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }` 
      },
      cancelButtonProps: { className: 'rounded-xl font-bold border-slate-200 h-9' },
      onOk: async () => {
        try {
          if (isAct) {
            await tourService.disableTour(tourId);
            setTours(prev => prev.map(t => t.id === tourId ? { ...t, status: 'INACTIVE' } : t));
            message.success(`Đã vô hiệu hóa tour "${tour.name}" thành công!`);
          } else {
            // Activate the tour (by updating status)
            const updateData = { ...tour, status: 'ACTIVE' as const };
            await tourService.updateTour(tourId, updateData);
            setTours(prev => prev.map(t => t.id === tourId ? { ...t, status: 'ACTIVE' } : t));
            message.success(`Đã kích hoạt hoạt động cho tour "${tour.name}" thành công!`);
          }
        } catch (err) {
          console.error('Failed to change tour status:', err);
          message.error('Có lỗi xảy ra khi thực hiện tác vụ này.');
        }
      }
    });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Quản Lý Khuôn Mẫu Tour</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý danh sách, nội dung, lịch khởi hành và lịch trình của các khuôn mẫu tour du lịch</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-sm text-red-700 font-semibold mb-2">⚠️ Lỗi:</p>
          <p className="text-sm text-red-600 break-words">{error}</p>
        </div>
      )}

      {/* Tours Table */}
      <div className="mb-6">
        <TourTable 
          tours={filteredTours} 
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onEdit={handleEdit}
          onDisable={handleDisableTour}
          onEditImage={handleEditImage}
          onEditSchedule={handleEditSchedule}
          onEditItinerary={handleEditItinerary}
          onViewSchedules={handleViewSchedules}
          locationFilter={locationFilter}
          onLocationFilterChange={setLocationFilter}
          locations={locations}
          onResetFilters={() => {
            setSearchQuery('');
            setStatusFilter('');
            setLocationFilter('');
          }}
        />
      </div>

      {/* Tour Viewer Drawer (Calculated calc(100vw - 260px) sized wizard in Read-only mode) */}
      <TourViewerDrawer
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedTour(null);
        }}
        tour={selectedTour}
        initialStep={viewerStep}
      />
    </DashboardLayout>
  );
}
