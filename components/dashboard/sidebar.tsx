'use client';

import { LayoutDashboard, TicketIcon, Bookmark, Users, BarChart3, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tours', label: 'Tours', icon: TicketIcon },
  { href: '/bookings', label: 'Bookings', icon: Bookmark },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col bg-white/70 backdrop-blur-xl border-r border-slate-200/50 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8 border-b border-slate-200/30">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
          <span className="text-white font-bold text-lg">T</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">TourHub</h1>
          <p className="text-xs text-slate-500">Management</p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
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
      </nav>

      {/* Footer */}
      <div className="px-4 py-6 border-t border-slate-200/30">
        <p className="text-xs text-slate-500 text-center">
          TourHub © 2024
        </p>
      </div>
    </aside>
  );
}
