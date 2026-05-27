"use client";

import { useRouter } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { clearUser, useUserStore } from "@/store/user-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export function Navbar() {
  const router = useRouter();
  const user = useUserStore();

  const displayName = user?.fullName || user?.userName || "User";
  const roleLabel = user?.role || "User";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "U";

  const handleSignOut = async () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore network errors on logout
    }

    document.cookie = "itour_role=; path=/; max-age=0";
    clearUser();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <nav
      className="sticky top-0 z-40 w-full backdrop-blur-xl border-b shadow-sm"
      style={{
        backgroundColor: "rgba(63, 94, 168, 0.08)",
        borderColor: "rgba(63, 94, 168, 0.2)",
      }}
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-8 gap-4">
        {/* Left side - Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Search tours, bookings..."
              className="w-full pl-10 h-10 rounded-2xl bg-white/90 border-slate-200 text-sm placeholder:text-slate-400 focus-visible:ring-[var(--color-primary)]"
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
            <Bell className="w-5 h-5 text-slate-700" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-primary)]" />
          </Button>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-2xl h-10 px-3 gap-2 hover:bg-slate-100"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                  {initials}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-slate-900">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-500">{roleLabel}</p>
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
              <DropdownMenuItem
                className="text-red-600"
                onSelect={(event) => {
                  event.preventDefault();
                  void handleSignOut();
                }}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
