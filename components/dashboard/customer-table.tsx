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
import { MoreHorizontal, Mail, Phone, MapPin } from 'lucide-react';
import { User } from '@/types';

interface CustomerTableProps {
  customers: User[];
  onEdit?: (customerId: string) => void;
  onDelete?: (customerId: string) => void;
  isLoading?: boolean;
}

function StatusBadge({ status }: { status: User['status'] }) {
  const styles = {
    Active: 'bg-emerald-100 text-emerald-700',
    Inactive: 'bg-slate-100 text-slate-700',
    Suspended: 'bg-red-100 text-red-700',
  };

  return (
    <Badge variant="outline" className={`${styles[status]} border-0 font-semibold`}>
      {status}
    </Badge>
  );
}

export function CustomerTable({ customers, onEdit, onDelete, isLoading }: CustomerTableProps) {
  return (
    <Card className="rounded-3xl border-0 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">Customer Management</h2>
        <p className="text-sm text-slate-500 mt-1">View and manage registered customers</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">No customers found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Bookings</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Total Spent</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {customer.profileImage && (
                        <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0">
                          <img
                            src={customer.profileImage}
                            alt={customer.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{customer.name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(customer.joinDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-900">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-slate-900">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">{customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium">
                        {customer.city && customer.country
                          ? `${customer.city}, ${customer.country}`
                          : customer.city || customer.country || 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Bookings */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-900">{customer.totalBookings}</span>
                  </td>

                  {/* Total Spent */}
                  <td className="px-6 py-4">
                    <span className="font-semibold text-emerald-600">${customer.totalSpent}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={customer.status} />
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
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(customer.id)}>
                          Edit Customer
                        </DropdownMenuItem>
                        <DropdownMenuItem>View Bookings</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete?.(customer.id)}>
                          Delete Customer
                        </DropdownMenuItem>
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
      {customers.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {customers.length} customers</p>
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
