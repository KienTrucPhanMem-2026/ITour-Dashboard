'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { reportService } from '@/services/reportService';

interface TourReportProps {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  isLoading: boolean;
}

interface TourData {
  id: string;
  name: string;
  destination: string;
  status: 'Active' | 'Pending' | 'Completed' | 'Cancelled';
  startDate: string;
  endDate: string;
  capacity: number;
  booked: number;
  price: number;
  revenue: number;
}

export function TourReport({ dateRange, isLoading }: TourReportProps) {
  const [tours, setTours] = useState<TourData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTours = async () => {
      if (!dateRange.startDate || !dateRange.endDate) return;

      setLoading(true);
      try {
        const response = await reportService.getTours();

        if (!response.success) {
          console.error('Failed to fetch tours');
          setLoading(false);
          return;
        }

        const allTours = response.data || [];

        // Filter by date range
        const filteredTours = reportService.filterToursByDateRange(
          allTours,
          dateRange.startDate,
          dateRange.endDate
        );

        // Transform API data to match TourData interface
        const transformedTours: TourData[] = filteredTours.map((t: any) => ({
          id: t.id,
          name: t.name || t.tourName || 'Unknown',
          destination: t.destination || 'Unknown',
          status: t.status || 'Active',
          startDate: t.startDate || new Date().toISOString(),
          endDate: t.endDate || t.startDate || new Date().toISOString(),
          capacity: t.capacity || 0,
          booked: t.booked || t.numberOfBookings || 0,
          price: t.price || 0,
          revenue: (t.booked || t.numberOfBookings || 0) * (t.price || 0),
        }));

        setTours(transformedTours);
        const total = transformedTours.reduce((sum, item) => sum + item.revenue, 0);
        setTotalRevenue(total);
      } catch (error) {
        console.error('Failed to fetch tours:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, [dateRange]);

  const getStatusColor = (status: TourData['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'Active': 'Hoạt động',
      'Completed': 'Hoàn thành',
      'Pending': 'Chờ xử lý',
      'Cancelled': 'Hủy',
    };
    return labels[status] || status;
  };

  const getOccupancyPercentage = (booked: number, capacity: number) => {
    if (capacity === 0) return 0;
    return Math.round((booked / capacity) * 100);
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Báo cáo tour du lịch</h3>
          <div className="text-right">
            <p className="text-sm text-slate-500">Tổng doanh thu</p>
            <p className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên tour</TableHead>
                <TableHead>Điểm đến</TableHead>
                <TableHead>Ngày bắt đầu</TableHead>
                <TableHead className="text-center">Dung tích</TableHead>
                <TableHead className="text-center">Đã đặt</TableHead>
                <TableHead className="text-center">Lấp đầy</TableHead>
                <TableHead className="text-right">Giá</TableHead>
                <TableHead className="text-right">Doanh thu</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading || isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : tours.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    Không có dữ liệu tour trong khoảng thời gian này
                  </TableCell>
                </TableRow>
              ) : (
                tours.map((tour) => {
                  const occupancyPercentage = getOccupancyPercentage(tour.booked, tour.capacity);
                  return (
                    <TableRow key={tour.id}>
                      <TableCell className="font-medium text-slate-900 max-w-xs">
                        {tour.name}
                      </TableCell>
                      <TableCell>{tour.destination}</TableCell>
                      <TableCell>
                        {format(new Date(tour.startDate), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-center">{tour.capacity}</TableCell>
                      <TableCell className="text-center">{tour.booked}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${getOccupancyColor(occupancyPercentage)}`}>
                          {occupancyPercentage}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">${tour.price.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${tour.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(tour.status)}>
                          {getStatusLabel(tour.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
          <div>
            <p className="text-slate-500 mb-1">Tổng số tour</p>
            <p className="text-lg font-semibold text-slate-900">{tours.length}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Tổng dung tích</p>
            <p className="text-lg font-semibold text-slate-900">
              {tours.reduce((sum, t) => sum + t.capacity, 0)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Tổng số đặt</p>
            <p className="text-lg font-semibold text-slate-900">
              {tours.reduce((sum, t) => sum + t.booked, 0)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Tỷ lệ lấp đầy trung bình</p>
            <p className="text-lg font-semibold text-slate-900">
              {tours.length > 0
                ? Math.round(
                    (tours.reduce((sum, t) => sum + t.booked, 0) /
                      tours.reduce((sum, t) => sum + t.capacity, 0)) *
                      100
                  )
                : 0}
              %
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
