"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Search,
  MessageSquare,
  Circle,
  Phone,
  Video,
  MoreVertical,
  Smile,
  ChevronLeft,
  ArrowLeft,
  Clock,
  Bus,
  Users,
  Star,
  MapPin,
  Flag,
  Building2,
  ReceiptText,
  Compass,
  CreditCard,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { LookupSidePanel } from "@/components/dashboard/lookup-side-panel";
import { apiClient } from "@/lib/api-client";
import { useUserStore } from "@/store/user-store";
import { toast, Toaster } from "sonner";
import {
  initSocket,
  joinConversation,
  sendMessage as sendSocketMessage,
  onReceiveMessage,
  onCustomerTyping,
  onConsultantOnline,
  onConsultantOffline,
  leaveConversation,
  disconnectSocket,
  isConnected,
  onNewConversation,
  updateConversationStatus,
  onConversationStatusUpdated,
  getSocket,
} from "@/services/socketService";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConvItem {
  id: string;
  customer?: { id: string; fullName: string; email: string; phone?: string };
  chatCustomer?: { id: string; fullName: string; email: string; phone?: string };
  tour?: { id: string; name: string; price: number; tourType?: string; description?: string };
  updatedAt?: string;
  status?: string;
  lastMessage?: string;
  isUnread?: boolean;
}

interface Msg {
  id: string;
  senderType: "CUSTOMER" | "CONSULTANT" | "AGENT" | string;
  text?: string;     // from socket broadcasts
  content?: string;  // from backend REST responses
  createdAt?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtTime = (d?: string) =>
  d
    ? new Date(d).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
    : "";

const fmtDate = (d?: string) => {
  if (!d) return "";
  const now = new Date();
  const date = new Date(d);
  const diff = now.getDate() - date.getDate();
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Hôm qua";
  return date.toLocaleDateString("vi-VN");
};

const getInitials = (name?: string) => {
  if (!name) return "K";
  return name.split(" ").slice(-1)[0]?.[0]?.toUpperCase() ?? "K";
};

const getHotelPrice = (hotelId: string) => {
  let hash = 0;
  for (let i = 0; i < hotelId.length; i++) {
    hash = hotelId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const basePrice = Math.abs(hash % 8) * 150000 + 400000; // 400k to 1.45M VND
  return basePrice;
};

const getHotelRating = (hotelId: string) => {
  let hash = 0;
  for (let i = 0; i < hotelId.length; i++) {
    hash = hotelId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const baseRate = 3.5 + Math.abs(hash % 4) * 0.5; // 3.5, 4.0, 4.5, 5.0
  return baseRate;
};

const avatarGradients = [
  "from-blue-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-purple-400 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-red-500",
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConsultantMessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ConsultantMessages />
    </Suspense>
  );
}

function ConsultantMessages() {
  const user = useUserStore();
  const searchParams = useSearchParams();
  const initConvId = searchParams.get("conv") ?? null;

  const [convList, setConvList] = useState<ConvItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConvItem | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ACTIVE" | "ALL">("ACTIVE");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [consultantOnline, setConsultantOnline] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [closingConv, setClosingConv] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [sideTourId, setSideTourId] = useState<string | null>(null);
  const [sideTourDetails, setSideTourDetails] = useState<any | null>(null);
  const [loadingSideTour, setLoadingSideTour] = useState(false);

  // Unified Side Panel states
  const [sidePanelMode, setSidePanelMode] = useState<"TOUR_DETAILS" | "UNIVERSAL_SEARCH" | null>(null);
  const [activePanelTab, setActivePanelTab] = useState<"TOURS" | "HOTELS" | "BOOKINGS">("TOURS");
  const [panelSearchQuery, setPanelSearchQuery] = useState("");
  const [panelToursList, setPanelToursList] = useState<any[]>([]);
  const [panelHotelsList, setPanelHotelsList] = useState<any[]>([]);
  const [panelBookingsList, setPanelBookingsList] = useState<any[]>([]);
  const [loadingPanelData, setLoadingPanelData] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Tour advanced filter states
  const [tourStartDest, setTourStartDest] = useState("");
  const [tourEndDest, setTourEndDest] = useState("");
  const [tourPriceRange, setTourPriceRange] = useState("ALL");
  const [tourMinRating, setTourMinRating] = useState(0);

  // Hotel advanced filter states
  const [hotelLocation, setHotelLocation] = useState("");
  const [hotelPriceRange, setHotelPriceRange] = useState("ALL");
  const [hotelMinRating, setHotelMinRating] = useState(0);



  // Ref to always have latest selectedConv inside socket listener closures
  const selectedConvRef = useRef<ConvItem | null>(null);
  useEffect(() => { selectedConvRef.current = selectedConv; }, [selectedConv]);

  /* fetch conversations */
  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoadingConvs(true);
      try {
        const res = await apiClient.get(`/conversations/consultant/${user.id}`);
        if (res.success && res.data) {
          const mapped = res.data.map((c: any) => ({
            ...c,
            customer: c.customer || c.chatCustomer,
          }));
          const sorted = mapped.sort((a: any, b: any) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
          setConvList(sorted);

          // Auto-join all active conversation rooms so we receive messages in real-time
          // without needing to click on each conversation first
          sorted.forEach((c: ConvItem) => {
            if (c.status !== 'CLOSED') {
              joinConversation(c.id);
            }
          });

          if (initConvId) {
            const found = mapped.find((c: ConvItem) => c.id === initConvId);
            if (found) openConv(found);
          }
        }
      } finally {
        setLoadingConvs(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* Initialize Socket.io */
  useEffect(() => {
    if (!user?.id) return;

    // useEffect callback cannot be async directly — use inner async function
    const connectSocket = async () => {
      await initSocket(user.id!, 'CONSULTANT');

      const unsubscribeMessage = onReceiveMessage((msg) => {
        const convId = (msg as any).conversationId;

        // Normalize text/content fields
        const normalized: Msg = {
          ...msg,
          text: msg.text || (msg as any).content || '',
          content: (msg as any).content || msg.text || '',
        };
        const textContent = normalized.text || normalized.content || '';

        // ── Sidebar update: ALWAYS runs regardless of selected conversation ──────
        setConvList((prevList) => {
          const index = prevList.findIndex((c) => c.id === convId);
          if (index !== -1) {
            const updatedConv = {
              ...prevList[index],
              lastMessage: textContent,
              updatedAt: new Date().toISOString(),
              isUnread: selectedConvRef.current?.id !== convId && msg.senderType === "CUSTOMER"
                ? true
                : prevList[index].isUnread,
            };
            const remaining = prevList.filter((_, idx) => idx !== index);
            return [updatedConv, ...remaining];
          } else {
            // New conversation not yet in list → re-fetch and auto-join the room
            if (user?.id) {
              apiClient.get(`/conversations/consultant/${user.id}`).then((res) => {
                if (res.success && res.data) {
                  const newMapped = res.data.map((c: any) => ({
                    ...c,
                    customer: c.customer || c.chatCustomer,
                  })).sort((a: any, b: any) => {
                    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                    return dateB - dateA;
                  });
                  setConvList((prev) => {
                    const prevIds = new Set(prev.map((c) => c.id));
                    newMapped.forEach((c: ConvItem) => {
                      if (!prevIds.has(c.id) && c.status !== 'CLOSED') {
                        joinConversation(c.id);
                      }
                    });
                    return newMapped;
                  });
                }
              });
            }
            return prevList;
          }
        });

        // ── Message bubble: only update if this is the currently open conversation ──
        if (convId && selectedConvRef.current?.id !== convId) return;

        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;

          // Automatically update contextual tour header in selectedConv state in real time
          if (textContent.startsWith('[TOUR_LINK:')) {
            const match = textContent.match(/\[TOUR_LINK:tourId=(.*?)&name=(.*?)&price=(.*?)\]/);
            if (match) {
              const tourId = match[1];
              const tourName = match[2];
              const tourPrice = Number(match[3]) || 0;
              setSelectedConv((prev) => {
                if (prev && !prev.tour) {
                  return { ...prev, tour: { id: tourId, name: tourName, price: tourPrice } };
                }
                return prev;
              });
            }
          }

          // Try to replace the matching optimistic temporary message if from myself
          const isMine = msg.senderType !== "CUSTOMER";
          if (isMine) {
            const tempIndex = prev.findIndex(
              (m) => m.id.startsWith("tmp-") && (m.text === normalized.text || m.content === normalized.content)
            );
            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = normalized;
              return updated;
            }
          }

          return [...prev, normalized];
        });
      });

      const unsubscribeTyping = onCustomerTyping((data) => {
        setCustomerTyping(data.isTyping);
      });

      // Auto-refresh conversation list when customer creates a new conversation
      const unsubscribeNewConv = onNewConversation(async (data) => {
        console.log('📢 [CONSULTANT] New conversation detected, refreshing list...', data);
        if (!user?.id) return;

        // Always re-fetch from database — the conversation might not yet have consultant info
        // when the event arrives (race condition between assign and emit)
        try {
          const res = await apiClient.get(`/conversations/consultant/${user.id}`);
          if (res.success && res.data) {
            const mapped = res.data.map((c: any) => ({
              ...c,
              customer: c.customer || c.chatCustomer,
            }));
            const sorted = mapped.sort((a: any, b: any) => {
              const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
              const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
              return dateB - dateA;
            });

            setConvList((prevList) => {
              // Find newly appeared conversations not yet in the current list
              const currentIds = new Set(prevList.map((c) => c.id));
              const newOnes = sorted.filter((c: ConvItem) => !currentIds.has(c.id));

              // For each new conversation, join its socket room so we receive messages immediately
              newOnes.forEach((c: ConvItem) => {
                joinConversation(c.id);
                console.log(`📡 [CONSULTANT] Auto-joined new conversation room: ${c.id}`);
              });

              return sorted;
            });
          }
        } catch (e) {
          console.error('Failed to refresh conversation list after new-conversation event', e);
        }
      });

      // Listen for conversation status changes (e.g., CLOSED from queue release)
      const unsubscribeStatus = onConversationStatusUpdated((data) => {
        setConvList((prev) =>
          prev.map((c) => c.id === data.conversationId ? { ...c, status: data.status } : c)
        );
        if (selectedConvRef.current?.id === data.conversationId && data.status === 'CLOSED') {
          setSelectedConv((prev) => prev ? { ...prev, status: 'CLOSED' } : prev);
        }
      });

      return { unsubscribeMessage, unsubscribeTyping, unsubscribeNewConv, unsubscribeStatus };
    };

    let cleanupFns: { unsubscribeMessage: () => void; unsubscribeTyping: () => void; unsubscribeNewConv?: () => void; unsubscribeStatus?: () => void } | null = null;

    connectSocket().then((fns) => {
      cleanupFns = fns ?? null;
    });

    return () => {
      cleanupFns?.unsubscribeMessage();
      cleanupFns?.unsubscribeTyping();
      cleanupFns?.unsubscribeNewConv?.();
      cleanupFns?.unsubscribeStatus?.();
      disconnectSocket();
    };
  }, [user]);

  /* fetch messages for selected conversation */
  const openConv = async (conv: ConvItem) => {
    setSelectedConv(conv);
    setShowMobileChat(true);
    setLoadingMsgs(true);
    setMessages([]); // clear previous messages
    setShowCustomerModal(false);
    setSideTourId(null);
    setSideTourDetails(null);
    setSidePanelMode(null);
    setPanelSearchQuery("");
    setExpandedBookingId(null);




    // Clear unread flag for this conversation
    setConvList((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, isUnread: false } : c))
    );

    // ── Join conversation room reliably ──────────────────────────────────────
    const joinRoom = () => joinConversation(conv.id);
    const s = getSocket();

    if (isConnected()) {
      // Socket already connected — join immediately
      joinRoom();
    } else if (s) {
      // Socket exists but still connecting — join as soon as connect fires
      const onFirstConnect = () => {
        joinRoom();
        s.off('connect', onFirstConnect); // one-shot only
      };
      s.on('connect', onFirstConnect);
    }

    // Auto-rejoin on reconnect (Socket.io rooms reset on reconnect)
    if (s) {
      const rejoinKey = '__rejoinRoom__';
      const prevRejoin = (s as any)[rejoinKey];
      if (prevRejoin) s.off('connect', prevRejoin);
      const rejoinHandler = () => {
        console.log(`🔄 [CONSULTANT] Reconnected — re-joining room ${conv.id}`);
        joinConversation(conv.id);
      };
      (s as any)[rejoinKey] = rejoinHandler;
      s.on('connect', rejoinHandler);
    }

    try {
      const res = await apiClient.get(`/messages/conversation/${conv.id}/ordered`);
      if (res.success && res.data) {
        // Normalize content/text fields from REST response
        setMessages(res.data.map((m: any) => ({
          ...m,
          text: m.text || m.content || '',
          content: m.content || m.text || '',
          senderType: m.senderType === 'AGENT' ? 'CONSULTANT' : m.senderType,
        })));
      }
    } finally {
      setLoadingMsgs(false);
    }
  };

  /* scroll to bottom whenever messages change */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);



  const handleOpenSideTour = async (tourId: string) => {
    setSideTourId(tourId);
    setSidePanelMode("TOUR_DETAILS");
    setLoadingSideTour(true);
    setSideTourDetails(null);
    try {
      const res = await apiClient.get(`/tours/${tourId}`);
      if (res.success && res.data) {
        setSideTourDetails(res.data);
      }
    } catch (e) {
      console.error("Failed to load side tour details", e);
    } finally {
      setLoadingSideTour(false);
    }
  };

  const handleOpenUniversalSearch = async () => {
    setSidePanelMode("UNIVERSAL_SEARCH");
    setPanelSearchQuery("");
    fetchPanelData("TOURS");
  };

  const handleSecureBookingSearch = async () => {
    const code = panelSearchQuery.trim();
    if (!code) return;
    setLoadingPanelData(true);
    setPanelBookingsList([]);
    setExpandedBookingId(null);
    try {
      const res = await apiClient.get(`/bookings/${code}`);
      if (res.success && res.data && res.data.id) {
        setPanelBookingsList([res.data]);
        setExpandedBookingId(res.data.id);
      } else {
        setPanelBookingsList([]);
      }
    } catch (e) {
      console.error("Failed to fetch booking by code: " + code, e);
      setPanelBookingsList([]);
    } finally {
      setLoadingPanelData(false);
    }
  };

  const fetchPanelData = async (tab: "TOURS" | "HOTELS" | "BOOKINGS") => {
    setActivePanelTab(tab);
    setLoadingPanelData(true);
    setPanelSearchQuery("");

    // Reset filters
    setTourStartDest("");
    setTourEndDest("");
    setTourPriceRange("ALL");
    setTourMinRating(0);
    setHotelLocation("");
    setHotelPriceRange("ALL");
    setHotelMinRating(0);

    try {
      if (tab === "TOURS") {
        const res = await apiClient.get("/tours");
        if (res.success && res.data) {
          setPanelToursList(res.data);
        }
      } else if (tab === "HOTELS") {
        const res = await apiClient.get("/hotels");
        if (res.success && res.data) {
          setPanelHotelsList(res.data);
        }
      } else if (tab === "BOOKINGS") {
        // Secure booking: do not load all bookings
        setPanelBookingsList([]);
      }
    } catch (e) {
      console.error("Failed to fetch panel data for tab: " + tab, e);
    } finally {
      setLoadingPanelData(false);
    }
  };

  /* send message */

  const sendMessage = async () => {

    const text = input.trim();
    if (!text || !selectedConv || !user?.id) {
      console.warn("📨 Cannot send message - missing required data", {
        hasText: !!text,
        hasSelectedConv: !!selectedConv,
        hasUserId: !!user?.id,
      });
      return;
    }
    setInput("");

    console.log("📨 [CONSULTANT PAGE] Attempting to send message", {
      conversationEntity: {
        id: selectedConv.id,
        customerId: selectedConv.customer?.id,
      },
      messageEntity: {
        text: text.substring(0, 50),
        textLength: text.length,
      },
      socketStatus: {
        isConnected: isConnected(),
      },
    });

    const optimistic: Msg = {
      id: "tmp-" + Date.now(),
      senderType: "CONSULTANT",
      text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);

    // Send via Socket.io (real-time)
    if (isConnected()) {
      console.log(
        "✅ [CONSULTANT PAGE] Socket connected - sending via socket",
        {
          conversationId: selectedConv.id,
          customerId: selectedConv.customer?.id,
        },
      );
      sendSocketMessage(selectedConv.id, selectedConv.customer?.id || "", text);
    } else {
      console.warn(
        "⚠️  [CONSULTANT PAGE] Socket not connected - fallback to REST API",
        {
          conversationId: selectedConv.id,
        },
      );
      // Fallback to REST API if socket not connected
      try {
        await apiClient.post("/messages", {
          conversationId: selectedConv.id,
          chatCustomerId: selectedConv.customer?.id,
          senderType: "AGENT",
          text,
          content: text,
          messageType: "TEXT",
          isActive: true,
          isRead: false,
        });
        console.log("✅ [CONSULTANT PAGE] Message sent via REST API fallback");
      } catch (e) {
        console.error(
          "❌ [CONSULTANT PAGE] Failed to send message via REST API",
          e,
        );
      }
    }
  };

  /* close conversation */
  const closeConversation = async () => {
    if (!selectedConv || !user?.id) return;
    setClosingConv(true);
    try {
      // Emit via socket (triggers backend queue release)
      if (isConnected()) {
        updateConversationStatus(selectedConv.id, 'CLOSED');
      }
      // REST call to persist and trigger queue release
      await apiClient.post(`/conversations/${selectedConv.id}/close`, {
        onlineConsultantIds: [] // ChatServer tracks this; backend falls back to empty = no queue release
      });
      setSelectedConv((prev) => prev ? { ...prev, status: 'CLOSED' } : prev);
      setConvList((prev) => prev.map((c) => c.id === selectedConv.id ? { ...c, status: 'CLOSED' } : c));
      toast.success('Cuộc trò chuyện đã đóng. Hàng đợi đã được kiểm tra.');
    } catch (e) {
      console.error('Failed to close conversation', e);
      toast.error('Không thể kết thúc cuộc trò chuyện. Vui lòng thử lại sau.');
    } finally {
      setClosingConv(false);
    }
  };

  const filtered = convList.filter((c) => {
    // 1. Filter by search query
    const q = search.toLowerCase();
    const cust = c.customer || c.chatCustomer;
    const matchesSearch =
      cust?.fullName?.toLowerCase().includes(q) ||
      cust?.email?.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    // 2. Filter by status
    if (filterStatus === "ACTIVE") {
      return c.status !== "CLOSED";
    }
    return true; // Show all in History mode
  });

  // Dynamic list computations for filter dropdowns
  const startDestinations = Array.from(new Set(panelToursList.map(t => t.startDestinationName || t.startDestination?.name).filter(Boolean))) as string[];
  const endDestinations = Array.from(new Set(panelToursList.map(t => t.endDestinationName || t.endDestination?.name).filter(Boolean))) as string[];
  const hotelLocations = Array.from(new Set(panelHotelsList.map(h => {
    const addr = h.address || "";
    if (addr.includes("Hà Nội")) return "Hà Nội";
    if (addr.includes("Hồ Chí Minh") || addr.includes("TP.HCM")) return "Hồ Chí Minh";
    if (addr.includes("Nha Trang")) return "Nha Trang";
    if (addr.includes("Đà Nẵng")) return "Đà Nẵng";
    if (addr.includes("Đà Lạt")) return "Đà Lạt";
    if (addr.includes("Phú Quốc")) return "Phú Quốc";
    if (addr.includes("Sapa") || addr.includes("Sa Pa")) return "Sa Pa";
    if (addr.includes("Hạ Long")) return "Hạ Long";
    const parts = addr.split(",");
    return parts[parts.length - 1]?.trim() || "";
  }).filter(Boolean))) as string[];

  const filteredTours = panelToursList.filter((t) => {
    const q = panelSearchQuery.toLowerCase();
    const nameMatch =
      t.name?.toLowerCase().includes(q) ||
      String(t.id || "").toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q);

    // Điểm đi
    const startName = t.startDestinationName || t.startDestination?.name || "";
    if (tourStartDest && startName !== tourStartDest) return false;

    // Điểm đến
    const endName = t.endDestinationName || t.endDestination?.name || "";
    if (tourEndDest && endName !== tourEndDest) return false;

    // Range khoảng giá
    const price = t.price || 0;
    if (tourPriceRange === "UNDER_5M" && price > 5000000) return false;
    if (tourPriceRange === "5M_10M" && (price < 5000000 || price > 10000000)) return false;
    if (tourPriceRange === "ABOVE_10M" && price < 10000000) return false;

    // Rate
    const rating = t.rating || 0;
    if (tourMinRating > 0 && rating < tourMinRating) return false;

    return nameMatch;
  });

  const filteredHotels = panelHotelsList.filter((h) => {
    const q = panelSearchQuery.toLowerCase();
    const nameMatch =
      h.name?.toLowerCase().includes(q) ||
      h.address?.toLowerCase().includes(q) ||
      h.phone?.toLowerCase().includes(q) ||
      h.description?.toLowerCase().includes(q);

    // Địa điểm
    if (hotelLocation && !h.address?.toLowerCase().includes(hotelLocation.toLowerCase())) {
      return false;
    }

    const price = getHotelPrice(h.id);
    const rating = getHotelRating(h.id);

    // Range giá
    if (hotelPriceRange === "UNDER_500K" && price > 500000) return false;
    if (hotelPriceRange === "500K_1M" && (price < 500000 || price > 1000000)) return false;
    if (hotelPriceRange === "ABOVE_1M" && price < 1000000) return false;

    // Rate
    if (hotelMinRating > 0 && rating < hotelMinRating) return false;

    return nameMatch;
  });

  const filteredBookings = panelBookingsList.filter((b) => {
    const q = panelSearchQuery.toLowerCase();
    const custName = b.customer?.fullName || b.customerName || "";
    const custEmail = b.customer?.email || b.customerEmail || "";
    const idStr = String(b.id || "");
    return (
      idStr.toLowerCase().includes(q) ||
      custName.toLowerCase().includes(q) ||
      custEmail.toLowerCase().includes(q)
    );
  });

  /* ── Render ── */
  return (
    <DashboardLayout isFullWidth={true}>
      {/* Page header – hide on mobile to save screen space */}
      <div className="hidden sm:block mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Tin nhắn</h1>
        <p className="text-slate-500 mt-0.5 text-sm">Tư vấn và hỗ trợ khách hàng.</p>
      </div>

      {/* Sonner Toast Container */}
      <Toaster richColors position="top-right" />

      {/* ── Chat shell ── */}
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
        style={{
          height: "calc(100dvh - 160px)",
          minHeight: 420,
        }}
      >
        <div className="flex h-full relative">
          {/* ══ LEFT: Conversation list ══ */}
          <div
            className={`flex flex-col border-r border-slate-100 transition-all duration-300 overflow-hidden
            ${
              showMobileChat
                ? "hidden md:flex"
                : "flex absolute md:relative inset-0 z-10 bg-white"
            }
            ${
              sidePanelMode
                ? "w-20 shrink-0"
                : "w-full md:w-72 lg:w-80 xl:w-96 md:shrink-0"
            }`}
          >
            {/* search */}
            {!sidePanelMode && (
              <div className="p-4 border-b border-slate-100 flex flex-col gap-3 transition-opacity duration-300">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm khách hàng…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                {/* Status Filter Tab */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                  <button
                    onClick={() => setFilterStatus("ACTIVE")}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${filterStatus === "ACTIVE"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "hover:text-slate-900"
                      }`}
                  >
                    Đang hỗ trợ
                  </button>
                  <button
                    onClick={() => setFilterStatus("ALL")}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${filterStatus === "ALL"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "hover:text-slate-900"
                      }`}
                  >
                    Lịch sử chat
                  </button>
                </div>
              </div>
            )}

            {/* list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {loadingConvs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <MessageSquare className="w-10 h-10" />
                  <p className="text-sm">{sidePanelMode ? "" : "Chưa có cuộc trò chuyện"}</p>
                </div>
              ) : (
                filtered.map((conv, i) => {
                  const isSelected = selectedConv?.id === conv.id;
                  const gradient = avatarGradients[i % avatarGradients.length];
                  return (
                    <button
                      key={conv.id}
                      onClick={() => openConv(conv)}
                      className={`w-full flex items-center transition-all duration-300 border-b border-slate-50 relative
                        ${sidePanelMode ? "justify-center px-2 py-4" : "gap-3 px-4 py-3.5 text-left"}
                        ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                      title={sidePanelMode ? conv.customer?.fullName ?? "Khách hàng" : undefined}
                    >
                      {/* avatar */}
                      <div
                        className={`relative w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base shrink-0 transition-transform duration-300 ${isSelected ? "scale-105" : ""}`}
                      >
                        {getInitials(conv.customer?.fullName)}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                        {conv.isUnread && sidePanelMode && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white animate-pulse" title="Tin nhắn mới" />
                        )}
                      </div>
                      {!sidePanelMode && (
                        <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p
                                className={`text-sm font-semibold truncate ${isSelected ? "text-blue-700" : "text-slate-900"}`}
                              >
                                {conv.customer?.fullName ?? "Khách hàng"}
                              </p>
                              {conv.isUnread && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shrink-0" title="Tin nhắn mới" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {fmtDate(conv.updatedAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-xs text-slate-400 truncate">
                              {conv.lastMessage ?? conv.customer?.email ?? "–"}
                            </p>
                            {conv.status === 'WAITING' && (
                              <span className="shrink-0 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">Hàng đợi</span>
                            )}
                            {conv.status === 'CLOSED' && (
                              <span className="shrink-0 text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-semibold">Đã đóng</span>
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ══ RIGHT: Chat pane ══ */}
          <div
            className={`flex-1 flex flex-col transition-all duration-300 min-w-0
            ${
              !showMobileChat
                ? "hidden md:flex"
                : "flex absolute md:relative inset-0 z-10 bg-white"
            }`}
          >
            {selectedConv ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-2 px-3 sm:px-5 py-3 border-b border-slate-100 bg-white shrink-0">
                  {/* Back button (mobile only) */}
                  <button
                    className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
                    onClick={() => setShowMobileChat(false)}
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                  </button>

                  {/* Avatar */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {getInitials(selectedConv.customer?.fullName)}
                  </div>

                  {/* Name + status */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {selectedConv.customer?.fullName ?? "Khách hàng"}
                    </p>
                    <p className="text-xs text-emerald-500 flex items-center gap-1 mt-0.5">
                      <Circle className="w-1.5 h-1.5 fill-current" />
                      {consultantOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    <button className="hidden sm:flex p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="hidden sm:flex p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
                      <Video className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleOpenUniversalSearch}
                      className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-extrabold text-xs transition-all shadow-sm active:scale-95 border border-blue-100 shrink-0"
                      title="Tra cứu nhanh thông tin (Tour, Khách sạn, Booking)"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Tra cứu</span>
                    </button>

                    <button
                      onClick={() => setShowCustomerModal(true)}
                      className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
                      title="Xem thông tin khách hàng"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {selectedConv.status !== 'CLOSED' && (
                      <button
                        onClick={closeConversation}
                        disabled={closingConv}
                        className="px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        {closingConv ? '…' : 'Kết thúc'}
                      </button>
                    )}
                    {selectedConv.status === 'CLOSED' && (
                      <span className="px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-500 whitespace-nowrap">
                        Đã đóng
                      </span>
                    )}
                  </div>
                </div>

                {/* Contextual Tour Information Card */}
                {selectedConv.tour && (
                  <div
                    onClick={() => selectedConv.tour?.id && handleOpenSideTour(selectedConv.tour.id)}
                    title="Click để tra cứu nhanh thông tin Tour bên hông"
                    className="px-6 py-3 bg-sky-50/50 hover:bg-sky-100/40 border-b border-sky-100/50 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">
                        Khách hàng đang quan tâm Tour (Click để tra cứu):
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 truncate mt-0.5">
                        {selectedConv.tour.name}
                      </h4>
                      {selectedConv.tour.tourType && (
                        <span className="inline-block mt-1 text-[10px] font-medium bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                          {selectedConv.tour.tourType}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Giá niêm yết</span>
                      <span className="text-sm font-black text-emerald-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(selectedConv.tour.price)}
                      </span>
                    </div>
                  </div>
                )}


                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3 bg-slate-50/40">
                  {loadingMsgs ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-10">
                      <MessageSquare className="w-10 h-10" />
                      <p className="text-sm">
                        Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderType === "CONSULTANT" || msg.senderType === "AGENT";

                      const textContent = msg.text || msg.content || "";
                      const isTourLink = textContent.startsWith("[TOUR_LINK:");
                      let tourId = "";
                      let tourName = "";
                      let tourPrice = "";

                      if (isTourLink) {
                        const match = textContent.match(/\[TOUR_LINK:tourId=(.*?)&name=(.*?)&price=(.*?)\]/);
                        if (match) {
                          tourId = match[1];
                          tourName = match[2];
                          tourPrice = match[3];
                        }
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
                        >
                          {!isMine && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {getInitials(selectedConv.customer?.fullName)}
                            </div>
                          )}
                          <div className={`max-w-[70%] group`}>
                            {isTourLink ? (
                              <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-100 rounded-2xl p-4 shadow-sm w-full my-1 flex flex-col gap-3 border-l-4 border-l-blue-500 text-left animate-in fade-in duration-300">
                                <div className="flex gap-2.5">
                                  <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm shrink-0">
                                    <img src="/assets/3-5.png" alt="Tour" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[9px] uppercase font-bold text-blue-700 tracking-wider block">
                                      Yêu cầu tư vấn Tour
                                    </span>
                                    <h5 className="font-extrabold text-slate-800 text-xs leading-snug line-clamp-2 mt-0.5">
                                      {tourName}
                                    </h5>
                                  </div>
                                </div>

                                <div className="bg-white/90 rounded-xl p-2.5 border border-blue-50 flex items-center justify-between text-xs">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] uppercase font-bold text-slate-400">Giá tham khảo</span>
                                    <span className="text-xs font-black text-blue-600">
                                      {tourPrice ? `${Number(tourPrice.replace(/[^0-9]/g, "")).toLocaleString("vi-VN")} đ` : "Liên hệ"}
                                    </span>
                                  </div>
                                  {tourId && (
                                    <button
                                      onClick={() => handleOpenSideTour(tourId)}
                                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm active:scale-95 text-center cursor-pointer font-sans"
                                    >
                                      Chi tiết Tour →
                                    </button>
                                  )}

                                </div>

                                <div className="text-[11px] font-semibold text-blue-800 bg-blue-50/50 rounded-lg px-2.5 py-1.5 border border-blue-100/30 text-center">
                                  💬 "Khách hàng gửi yêu cầu nhờ hỗ trợ tư vấn tour này"
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                                ${isMine
                                    ? "bg-blue-600 text-white rounded-br-sm"
                                    : "bg-white text-slate-800 rounded-bl-sm border border-slate-100"
                                  }`}
                              >
                                {msg.text || msg.content}
                              </div>
                            )}
                            <p
                              className={`text-[10px] text-slate-400 mt-1 ${isMine ? "text-right" : "text-left"}`}
                            >
                              {fmtTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}{" "}
                  {customerTyping && (
                    <div className="flex items-end gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(selectedConv.customer?.fullName)}
                      </div>
                      <div className="px-4 py-2.5 rounded-2xl bg-white text-slate-800 border border-slate-100">
                        <div className="flex gap-1">
                          <div
                            className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <div
                            className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}{" "}
                  <div ref={bottomRef} />
                </div>

                {/* Input bar */}
                <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-slate-100 bg-white shrink-0">
                  <div className="flex items-center gap-2">
                    <button className="hidden sm:flex p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors shrink-0">
                      <Smile className="w-5 h-5" />
                    </button>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && !e.shiftKey && sendMessage()
                      }
                      placeholder="Nhập tin nhắn…"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim()}
                      className="p-2.5 sm:p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 p-8">
                <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-slate-600">
                    Chưa chọn cuộc trò chuyện
                  </p>
                  <p className="text-sm mt-1">
                    Chọn một cuộc hội thoại bên trái để bắt đầu tư vấn
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ══ SIDEBAR: Quick Lookup Side Panel ══ */}
          {/* On mobile this becomes a full-screen overlay slide-in from right */}
          <LookupSidePanel
            sidePanelMode={sidePanelMode}
            setSidePanelMode={setSidePanelMode}
            activePanelTab={activePanelTab}
            setActivePanelTab={setActivePanelTab}
            panelSearchQuery={panelSearchQuery}
            setPanelSearchQuery={setPanelSearchQuery}
            loadingPanelData={loadingPanelData}
            loadingSideTour={loadingSideTour}
            sideTourDetails={sideTourDetails}
            sideTourId={sideTourId}
            setSideTourId={setSideTourId}
            setSideTourDetails={setSideTourDetails}
            expandedBookingId={expandedBookingId}
            setExpandedBookingId={setExpandedBookingId}
            filteredTours={filteredTours}
            filteredHotels={filteredHotels}
            filteredBookings={filteredBookings}
            panelBookingsList={panelBookingsList}
            startDestinations={startDestinations}
            endDestinations={endDestinations}
            hotelLocations={hotelLocations}
            tourStartDest={tourStartDest}
            setTourStartDest={setTourStartDest}
            tourEndDest={tourEndDest}
            setTourEndDest={setTourEndDest}
            tourPriceRange={tourPriceRange}
            setTourPriceRange={setTourPriceRange}
            tourMinRating={tourMinRating}
            setTourMinRating={setTourMinRating}
            hotelLocation={hotelLocation}
            setHotelLocation={setHotelLocation}
            hotelPriceRange={hotelPriceRange}
            setHotelPriceRange={setHotelPriceRange}
            hotelMinRating={hotelMinRating}
            setHotelMinRating={setHotelMinRating}
            handleOpenSideTour={handleOpenSideTour}
            handleSecureBookingSearch={handleSecureBookingSearch}
            fetchPanelData={fetchPanelData}
          />
        </div>
      </div>


      {/* ══ Customer Profile Modal ══ */}
      {showCustomerModal && selectedConv && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowCustomerModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden p-6 border border-slate-100 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header X close button */}
            <button
              onClick={() => setShowCustomerModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all duration-200"
              title="Đóng"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Avatar and name */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-md border-4 border-white">
                {getInitials(selectedConv.customer?.fullName)}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-3">
                {selectedConv.customer?.fullName ?? "Khách hàng"}
              </h3>
              <span className="inline-block px-2.5 py-0.5 mt-1.5 text-[9px] font-bold bg-blue-50 text-blue-600 rounded-full border border-blue-100 uppercase tracking-wider">
                Khách hàng vãng lai
              </span>
            </div>

            {/* Detailed list */}
            <div className="space-y-4 mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  📧
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Email</span>
                  <span className="text-sm font-semibold text-slate-700 break-all">
                    {selectedConv.customer?.email || "Chưa cung cấp"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  📞
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Số điện thoại</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {selectedConv.customer?.phone || "Chưa cung cấp"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                  💬
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Mã cuộc trò chuyện</span>
                  <span className="text-xs font-mono text-slate-500 truncate block">
                    {selectedConv.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Interested Tour Context Section */}
            {selectedConv.tour && (
              <div className="mt-5 p-4 bg-sky-50/50 border border-sky-100 rounded-2xl animate-in fade-in duration-300">
                <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider block">
                  Tour đang quan tâm:
                </span>
                <h4 className="text-sm font-bold text-slate-800 mt-1 truncate">
                  {selectedConv.tour.name}
                </h4>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-sky-100/50">
                  <span className="text-xs font-black text-emerald-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(selectedConv.tour.price)}
                  </span>
                  {selectedConv.tour.id && (
                    <a
                      href={`/consultant/tours/${selectedConv.tour.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 hover:underline"
                    >
                      Chi tiết tour ↗
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Footer close button */}
            <button
              onClick={() => setShowCustomerModal(false)}
              className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer font-sans"
            >
              Đóng thông tin
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

