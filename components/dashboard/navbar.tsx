'use client';

import { Search, Bell, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8 gap-4">
        {/* Left side - Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search tours, bookings..."
              className="w-full pl-10 h-10 rounded-2xl bg-slate-50 border-slate-200 text-sm placeholder:text-slate-400 focus-visible:ring-emerald-600"
            />
          </div>
        </div>

        {/* Right side - Icons & User */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl h-10 w-10 hover:bg-slate-100"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-600" />
          </Button>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-2xl h-10 px-3 gap-2 hover:bg-slate-100"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                  JD
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-slate-900">John Doe</p>
                  <p className="text-xs text-slate-500">Admin</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Account</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Help & Support</DropdownMenuItem>
              <DropdownMenuItem>Documentation</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
