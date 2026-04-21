'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, MapPin, Users, Calendar } from 'lucide-react';

interface Tour {
  id: string;
  name: string;
  destination: string;
  image: string;
  status: 'Active' | 'Pending' | 'Completed';
  startDate: string;
  duration: string;
  capacity: number;
  booked: number;
  price: number;
}

const mockTours: Tour[] = [
  {
    id: '1',
    name: 'Bali Beach Paradise',
    destination: 'Bali, Indonesia',
    image: 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=400&h=300&fit=crop',
    status: 'Active',
    startDate: 'Mar 15, 2024',
    duration: '7 days',
    capacity: 30,
    booked: 24,
    price: 1299,
  },
  {
    id: '2',
    name: 'Paris City Tour',
    destination: 'Paris, France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop',
    status: 'Active',
    startDate: 'Mar 20, 2024',
    duration: '5 days',
    capacity: 25,
    booked: 22,
    price: 1599,
  },
  {
    id: '3',
    name: 'Tokyo Adventure',
    destination: 'Tokyo, Japan',
    image: 'https://images.unsplash.com/photo-1540959375944-7049f642e9a4?w=400&h=300&fit=crop',
    status: 'Pending',
    startDate: 'Apr 10, 2024',
    duration: '8 days',
    capacity: 35,
    booked: 18,
    price: 1899,
  },
  {
    id: '4',
    name: 'New York Explorer',
    destination: 'New York, USA',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop',
    status: 'Active',
    startDate: 'Mar 25, 2024',
    duration: '4 days',
    capacity: 40,
    booked: 35,
    price: 999,
  },
  {
    id: '5',
    name: 'Safari Expedition',
    destination: 'Kenya, Africa',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=300&fit=crop',
    status: 'Completed',
    startDate: 'Feb 28, 2024',
    duration: '6 days',
    capacity: 20,
    booked: 20,
    price: 2499,
  },
];

function StatusBadge({ status }: { status: Tour['status'] }) {
  const styles = {
    Active: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-amber-100 text-amber-700',
    Completed: 'bg-slate-100 text-slate-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

export function TourTable() {
  return (
    <Card className="rounded-3xl border-0 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">Tour Management</h2>
        <p className="text-sm text-slate-500 mt-1">Manage and oversee all your active tours</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Tour</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Destination</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Dates</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Booking</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Price</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockTours.map((tour) => (
              <tr key={tour.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                {/* Tour Info */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0">
                      <img
                        src={tour.image}
                        alt={tour.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{tour.name}</p>
                      <p className="text-xs text-slate-500">{tour.duration}</p>
                    </div>
                  </div>
                </td>

                {/* Destination */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium">{tour.destination}</span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <StatusBadge status={tour.status} />
                </td>

                {/* Dates */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">{tour.startDate}</span>
                  </div>
                </td>

                {/* Booking */}
                <td className="px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">
                        {tour.booked}/{tour.capacity}
                      </span>
                    </div>
                    <div className="w-24 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{ width: `${(tour.booked / tour.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Price */}
                <td className="px-6 py-4">
                  <span className="font-semibold text-emerald-600">${tour.price}</span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Tour</DropdownMenuItem>
                      <DropdownMenuItem>View Bookings</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Archive</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-500">Showing 1-5 of 24 tours</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl">
            Previous
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl">
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
