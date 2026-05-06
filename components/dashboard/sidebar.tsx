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
import logoImage from "@/assets/3-3.png";

const defaultNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tours", label: "Tours", icon: TicketIcon },
  { href: "/bookings", label: "Bookings", icon: Bookmark },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const tourGuideNavItems = [
  { href: "/tourguide", label: "Schedule", icon: CalendarDays },
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
      <div
        className="flex items-center gap-3 px-6 py-8 border-b"
        style={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
      >
        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
          <Image src={logoImage} alt="TourHub Logo" width={28} height={28} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">TourHub</h1>
          <p className="text-xs text-white/70">Management</p>
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
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10"
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
