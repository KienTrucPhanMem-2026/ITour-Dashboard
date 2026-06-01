"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Trash2, Calendar, CheckCircle2, MessageSquare, AlertTriangle, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { clearUser, useUserStore } from "@/store/user-store";
import { apiClient } from "@/lib/api-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatRelativeTime(dateString?: string) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return "Vừa xong";
    
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHr < 24) return `${diffHr} giờ trước`;
    if (diffDay === 1) return "Hôm qua";
    return date.toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function getNotificationIcon(type?: string) {
  const t = String(type || "").toUpperCase();
  if (t.includes("BOOKING_CREATED") || t.includes("BOOKING_AWAITING")) {
    return {
      icon: <Calendar className="w-4 h-4 text-blue-600" />,
      bgClass: "bg-blue-50"
    };
  }
  if (t.includes("BOOKING_PAID") || t.includes("SUCCESS")) {
    return {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      bgClass: "bg-emerald-50"
    };
  }
  if (t.includes("BOOKING_CANCELLED") || t.includes("EXPIRED") || t.includes("FAIL")) {
    return {
      icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
      bgClass: "bg-rose-50"
    };
  }
  if (t.includes("REVIEW") || t.includes("FEEDBACK")) {
    return {
      icon: <MessageSquare className="w-4 h-4 text-amber-600" />,
      bgClass: "bg-amber-50"
    };
  }
  if (t.includes("CERTIFICATION") || t.includes("TRAINING") || t.includes("GUIDE")) {
    return {
      icon: <ShieldCheck className="w-4 h-4 text-violet-600" />,
      bgClass: "bg-violet-50"
    };
  }
  return {
    icon: <Bell className="w-4 h-4 text-slate-600" />,
    bgClass: "bg-slate-50"
  };
}


export function Navbar() {
  const router = useRouter();
  const user = useUserStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = async () => {
    if (!user?.id) return;
    try {
      const res = await apiClient.get<any[]>(`/notifications/user/${user.id}`);
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
      }
      
      const countRes = await apiClient.get<number>(`/notifications/user/${user.id}/unread-count`);
      if (countRes.success && typeof countRes.data === 'number') {
        setUnreadCount(countRes.data);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadNotifications();
    }
  }, [isOpen, user?.id]);

  const handleMarkAsRead = async (item: any) => {
    const isUnread = !(item.isRead || item.read);
    if (isUnread) {
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, isRead: true, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      try {
        await apiClient.patch(`/notifications/${item.id}/read`);
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }
    
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true, read: true }))
    );
    setUnreadCount(0);

    try {
      await apiClient.patch(`/notifications/user/${user.id}/read-all`);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    const target = notifications.find(n => n.id === id);
    const wasUnread = target && !(target.isRead || target.read);
    
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await apiClient.delete(`/notifications/${id}`);
    } catch (err) {
      console.error("Failed to delete notification:", err);
      loadNotifications();
    }
  };

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
          {/* Notification Dropdown */}
          <DropdownMenu onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl h-10 w-10 hover:bg-slate-100 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white border-2 border-white shadow-sm animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[360px] p-0 rounded-2xl overflow-hidden shadow-xl border border-slate-100 bg-white animate-in fade-in-50 zoom-in-95 duration-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50/75 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Thông báo</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Bạn có {unreadCount} thông báo chưa đọc</p>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    className="text-[10px] font-black text-blue-600 hover:bg-slate-100 px-2 h-7 rounded-lg"
                    onClick={handleMarkAllAsRead}
                  >
                    Đọc tất cả
                  </Button>
                )}
              </div>
              
              {/* List */}
              <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 scrollbar-none">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-slate-400">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                      <Bell className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-xs font-bold text-slate-500">Chưa có thông báo</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Chúng tôi sẽ báo cho bạn khi có tin mới</p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isUnread = !(item.isRead || item.read);
                    const iconInfo = getNotificationIcon(item.type);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleMarkAsRead(item)}
                        className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-slate-50/60 relative group ${
                          isUnread ? "bg-blue-50/15" : ""
                        }`}
                      >
                        {/* Unread indicator dot */}
                        {isUnread && (
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        )}
                        
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconInfo.bgClass} ${isUnread ? "" : "opacity-75"}`}>
                          {iconInfo.icon}
                        </div>

                        <div className="flex-1 min-w-0 pr-4 pl-1">
                          <p className={`text-xs text-slate-800 line-clamp-1 ${isUnread ? "font-bold" : "font-semibold"}`}>
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>
                          <span className="text-[9px] text-slate-400 font-bold block mt-1.5 uppercase tracking-wide">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>

                        {/* Delete button visible on hover */}
                        <button
                          onClick={(e) => handleDeleteNotification(e, item.id)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:text-rose-500 p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 transition-all duration-150"
                          title="Xóa thông báo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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
