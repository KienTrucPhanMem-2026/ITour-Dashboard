'use client';

import { LayoutDashboard, TicketIcon, Bookmark, Users, BarChart3, Settings, Shield, Lock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tours', label: 'Tours', icon: TicketIcon },
  { href: '/bookings', label: 'Bookings', icon: Bookmark },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/accounts', label: 'Accounts', icon: Lock },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const staffMenuItems = [
  { href: '/staff/managers', label: 'Quản Lý', icon: Shield },
  { href: '/staff/tourguides', label: 'Hướng Dẫn Viên', icon: Users },
  { href: '/staff/consultants', label: 'Tư Vấn Viên', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isStaffOpen, setIsStaffOpen] = useState(pathname.startsWith('/staff'));

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col bg-white/70 backdrop-blur-xl border-r border-slate-200/50 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8 border-b border-slate-200/30">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
          <span className="text-white font-bold text-lg">T</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">ITour</h1>
          <p className="text-xs text-slate-500">Management</p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-slate-600 hover:bg-slate-100/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Staff Management Section */}
        <div className="mt-0 border-slate-200/30">
          <button
            onClick={() => setIsStaffOpen(!isStaffOpen)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
              pathname.startsWith('/staff')
                ? 'bg-emerald-50 text-emerald-600'
                : 'text-slate-600 hover:bg-slate-100/50'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium flex-1 text-left">Quản Lý Nhân Sự</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isStaffOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isStaffOpen && (
            <div className="mt-2 ml-8 space-y-1">
              {staffMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-6 border-t border-slate-200/30">
        <p className="text-xs text-slate-500 text-center">
          ITour © 2024
        </p>
      </div>
    </aside>
  );
}
