"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  TicketIcon,
  Bookmark,
  Users,
  BarChart3,
  Settings,
  CalendarDays,
  Shield,
  ChevronDown,
  Lock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logoImage from "@/assets/3-5.png";

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

const tourGuideNavItems = [
  { href: '/tourguide/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tourguide/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/settings', label: 'Settings', icon: Settings },
];


export function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  const [isStaffOpen, setIsStaffOpen] = useState(false);
  useEffect(() => {
    const match = document.cookie
      .split("; ")
      .find((item) => item.startsWith("itour_role="));
    const value = match?.split("=")[1] || null;
    setRole(value);
  }, []);

  const currentNavItems = useMemo(() => {
    if (role === "TOURGUIDE") {
      return tourGuideNavItems;
    }
    return navItems;
  }, [role]);

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r shadow-sm"
      style={{
        background: "var(--gradient-main)",
        borderColor: "rgba(255, 255, 255, 0.15)",
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center">
            <Image src={logoImage} alt="ITour Logo" width={40} height={40} />
          </div>
          <div>
            <p className="text-xl uppercase tracking-[0.2em] text-blue-500">
              ITour
            </p>
          </div>
        </div>
      </div>
      {/* Navigation Items */}
      <nav className="flex-1 px-4 pb-6 space-y-2">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
          Menu
        </p>
        {currentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${isActive
                ? "bg-white text-blue-700 shadow-sm"
                : "bg-white/70 text-blue-900 hover:bg-white"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Staff Management Section */}
        {role !== 'TOURGUIDE' && (
          <div className="mt-0 border-slate-200/30">
            <button
              onClick={() => setIsStaffOpen(!isStaffOpen)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${pathname.startsWith('/staff')
                ? 'bg-emerald-50 text-emerald-600'
                : 'text-slate-600 hover:bg-slate-100/50'
                }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium flex-1 text-left">Quản Lý Nhân Sự</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isStaffOpen ? 'rotate-180' : ''
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${isActive
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
        )}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-6 border-t"
        style={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
      >
        <p className="text-xs text-white/70 text-center">TourHub © 2024</p>
      </div>
    </aside>
  );
}
