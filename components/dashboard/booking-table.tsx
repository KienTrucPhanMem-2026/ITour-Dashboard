'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, MapPin, Calendar } from 'lucide-react';
import { Booking } from '@/types';

interface BookingTableProps {
  bookings: Booking[];
  onStatusChange?: (bookingId: string, status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed') => void;
  isLoading?: boolean;
}

function StatusBadge({ status }: { status: Booking['status'] }) {
  const styles = {
    Pending: 'bg-amber-100 text-amber-700',
    Confirmed: 'bg-emerald-100 text-emerald-700',
    Cancelled: 'bg-red-100 text-red-700',
    Completed: 'bg-slate-100 text-slate-700',
  };

  return (
    <Badge variant="outline" className={`${styles[status]} border-0 font-semibold`}>
      {status}
    </Badge>
  );
}

export function BookingTable({ bookings, onStatusChange, isLoading }: BookingTableProps) {
  return (
    <Card className="rounded-3xl border-0 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">Bookings Management</h2>
        <p className="text-sm text-slate-500 mt-1">Manage and track all reservations</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">No bookings found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Tour</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Passengers</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  {/* Tour */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{booking.tourName || 'N/A'}</p>
                      {booking.destination && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <p className="text-xs text-slate-500">{booking.destination}</p>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{booking.userName || 'N/A'}</p>
                      <p className="text-xs text-slate-500">{booking.userEmail || 'N/A'}</p>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">
                        {booking.startDate
                          ? new Date(booking.startDate).toLocaleDateString()
                          : booking.bookingDate
                          ? new Date(booking.bookingDate).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Passengers */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-900">{booking.numberOfPeople}</span>
                  </td>

                  {/* Total Price */}
                  <td className="px-6 py-4">
                    <span className="font-semibold text-emerald-600">${booking.totalPrice}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={booking.status} />
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
                        {booking.status === 'Pending' && (
                          <DropdownMenuItem onClick={() => onStatusChange?.(booking.id, 'Confirmed')}>
                            Confirm Booking
                          </DropdownMenuItem>
                        )}
                        {booking.status !== 'Cancelled' && booking.status !== 'Completed' && (
                          <DropdownMenuItem onClick={() => onStatusChange?.(booking.id, 'Cancelled')} className="text-red-600">
                            Cancel Booking
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {bookings.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {bookings.length} bookings</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" disabled>
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
