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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logoImage from "@/assets/3-5.png";

const defaultNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tours", label: "Tours", icon: TicketIcon },
  { href: "/bookings", label: "Bookings", icon: Bookmark },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const tourGuideNavItems = [
  { href: "/tourguide/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tourguide/schedule", label: "Schedule", icon: CalendarDays },
];

export function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie
      .split("; ")
      .find((item) => item.startsWith("itour_role="));
    const value = match?.split("=")[1] || null;
    setRole(value);
  }, []);

  const navItems = useMemo(() => {
    if (role === "TOURGUIDE") {
      return tourGuideNavItems;
    }
    return defaultNavItems;
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
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "bg-white text-blue-700 shadow-sm"
                  : "bg-white/70 text-blue-900 hover:bg-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
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
