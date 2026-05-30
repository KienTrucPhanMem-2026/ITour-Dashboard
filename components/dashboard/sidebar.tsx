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
  MessageSquareQuote,
  Percent,
  ClipboardCheck,
  Building2,
  Utensils,
  Briefcase,
  Bus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logoImage from "@/assets/3-5.png";

const adminItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tours', label: 'Tours', icon: TicketIcon },
  { href: '/admin/bookings', label: 'Bookings', icon: Bookmark },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/accounts', label: 'Accounts', icon: Lock },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/discounts', label: 'Discounts', icon: Percent },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const staffMenuItems = [
  { href: '/admin/staff/managers', label: 'Quản Lý', icon: Shield },
  { href: '/admin/staff/tourguides', label: 'Hướng Dẫn Viên', icon: Users },
  { href: '/admin/staff/consultants', label: 'Tư Vấn Viên', icon: Users },
];

const partnerMenuItems = [
  { href: '/admin/partners/hotels', label: 'Khách sạn', icon: Building2 },
  { href: '/admin/partners/restaurants', label: 'Nhà hàng', icon: Utensils },
  { href: '/admin/partners/services', label: 'Vé & Tiện ích', icon: TicketIcon },
  { href: '/admin/partners/transports', label: 'Nhà xe & Vận tải', icon: Bus },
];

const tourGuideNavItems = [
  { href: '/tourguide/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tourguide/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/tourguide/checkin', label: 'Tour Check in', icon: ClipboardCheck },
  { href: '/settings', label: 'Settings', icon: Settings },
];
const consultantNavItems = [
  { href: '/consultant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/consultant/messages', label: 'Messages', icon: MessageSquareQuote },
  { href: '/consultant/tours', label: 'Tours', icon: TicketIcon },
  { href: '/settings', label: 'Settings', icon: Settings },
];
const tourPlannerNavItems = [
  { href: '/tourplanner/tours', label: 'Tours', icon: TicketIcon },
  { href: '/tourplanner/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/settings', label: 'Settings', icon: Settings },
];


export function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [isPartnersOpen, setIsPartnersOpen] = useState(false);
  useEffect(() => {
    const match = document.cookie
      .split("; ")
      .find((item) => item.startsWith("itour_role="));
    const value = match?.split("=")[1] || null;
    setRole(value);

    if (pathname.startsWith('/admin/staff')) {
      setIsStaffOpen(true);
    }
    if (pathname.startsWith('/admin/partners')) {
      setIsPartnersOpen(true);
    }
  }, [pathname]);

  const currentNavItems = useMemo(() => {
    if (role === "TOURGUIDE") {
      return tourGuideNavItems;
    }
    if (role === "CONSULTANT") {
      return consultantNavItems;
    }
    if (role === "TOURPLANNER") {
      return tourPlannerNavItems;
    }
    return adminItems;
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
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-2.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
            <Image src={logoImage} alt="ITour Logo" width={32} height={32} />
          </div>
          <div>
            <p className="text-lg uppercase tracking-[0.2em] text-blue-500 font-extrabold">
              ITour
            </p>
          </div>
        </div>
      </div>
      {/* Navigation Items */}
      <nav className="flex-1 px-4 pb-4 space-y-1.5 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/40 [&::-webkit-scrollbar-track]:bg-transparent [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white/80 mb-1">
          Menu
        </p>
        {currentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 ${isActive
                ? "bg-white text-blue-700 shadow-sm"
                : "bg-white/70 text-blue-900 hover:bg-white"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          );
        })}
        {/* Partner Services Management Section */}
        {(role === 'ADMIN' || role === 'MANAGER') && (
          <div className="mt-0 border-slate-200/30">
            <button
              onClick={() => setIsPartnersOpen(!isPartnersOpen)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 ${pathname.startsWith('/admin/partners')
                ? 'bg-white text-blue-700 shadow-sm'
                : 'bg-white/70 text-blue-900 hover:bg-white'
                }`}
            >
              <Briefcase className="w-5 h-5" />
              <span className="font-semibold text-sm flex-1 text-left">Quản Lý Dịch Vụ Đối Tác</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isPartnersOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {isPartnersOpen && (
              <div className="mt-1.5 ml-8 space-y-1">
                {partnerMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 text-xs ${isActive
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'bg-white/70 text-blue-900 hover:bg-white'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-semibold">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* Staff Management Section */}
        {(role === 'ADMIN' || role === 'MANAGER') && (
          <div className="mt-0 border-slate-200/30">
            <button
              onClick={() => setIsStaffOpen(!isStaffOpen)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 ${pathname.startsWith('/admin/staff')
                ? 'bg-white text-blue-700 shadow-sm'
                : 'bg-white/70 text-blue-900 hover:bg-white'
                }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-semibold text-sm flex-1 text-left">Quản Lý Nhân Sự</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isStaffOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {isStaffOpen && (
              <div className="mt-1.5 ml-8 space-y-1">
                {staffMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 text-xs ${isActive
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'bg-white/70 text-blue-900 hover:bg-white'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-semibold">{item.label}</span>
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
        className="px-4 py-4 border-t"
        style={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
      >
        <p className="text-xs text-white/70 text-center">TourHub © 2024</p>
      </div>
    </aside>
  );
}
