"use client";

import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { apiClient } from "@/lib/api-client";
import { useUserStore } from "@/store/user-store";
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

const avatarGradients = [
  "from-blue-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-purple-400 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-red-500",
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConsultantMessages() {
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
  const [queueNotif, setQueueNotif] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [sideTourId, setSideTourId] = useState<string | null>(null);
  const [sideTourDetails, setSideTourDetails] = useState<any | null>(null);
  const [loadingSideTour, setLoadingSideTour] = useState(false);


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
      await initSocket(user.id, 'CONSULTANT');

      const unsubscribeMessage = onReceiveMessage((msg) => {
        // Only show messages belonging to the currently selected conversation
        setMessages((prev) => {
          const convId = (msg as any).conversationId;
          if (convId && selectedConvRef.current?.id !== convId) return prev;
          if (prev.some((m) => m.id === msg.id)) return prev;

          // Normalize text/content fields
          const normalized: Msg = {
            ...msg,
            text: msg.text || (msg as any).content || '',
            content: (msg as any).content || msg.text || '',
          };

          // Automatically update contextual tour header in selectedConv state in real time
          const textContent = normalized.text || normalized.content || '';
          if (textContent.startsWith('[TOUR_LINK:')) {
            const match = textContent.match(/\[TOUR_LINK:tourId=(.*?)&name=(.*?)&price=(.*?)\]/);
            if (match) {
              const tourId = match[1];
              const tourName = match[2];
              const tourPrice = Number(match[3]) || 0;
              setSelectedConv((prev) => {
                if (prev && !prev.tour) {
                  return {
                    ...prev,
                    tour: { id: tourId, name: tourName, price: tourPrice }
                  };
                }
                return prev;
              });
            }
          }

          // Real-time update sidebar conversation list: update lastMessage, jump to top, mark isUnread if not active chat
          setConvList((prevList) => {
            const index = prevList.findIndex((c) => c.id === convId);
            if (index !== -1) {
              const updatedConv = {
                ...prevList[index],
                lastMessage: textContent,
                updatedAt: new Date().toISOString(),
                isUnread: selectedConvRef.current?.id !== convId && msg.senderType === "CUSTOMER" ? true : prevList[index].isUnread,
              };
              const remaining = prevList.filter((_, idx) => idx !== index);
              return [updatedConv, ...remaining];
            } else {
              // Fetch new/assigned conversations if not found in list
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
                    setConvList(newMapped);
                  }
                });
              }
              return prevList;
            }
          });

          // Try to replace the matching optimistic temporary message if from myself
          const isMine = msg.senderType === "CONSULTANT" || msg.senderType === "AGENT";
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
        try {
          const res = await apiClient.get(`/conversations/consultant/${user.id}`);
          if (res.success && res.data) {
            const mapped = res.data.map((c: any) => ({
              ...c,
              customer: c.customer || c.chatCustomer,
            }));
            setConvList(mapped);
          }
        } catch (e) {
          console.error('Failed to refresh conversation list', e);
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
      setQueueNotif('Cuộc trò chuyện đã đóng. Hàng đợi đã được kiểm tra.');
      setTimeout(() => setQueueNotif(null), 4000);
    } catch (e) {
      console.error('Failed to close conversation', e);
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

  /* ── Render ── */
  return (
    <DashboardLayout isFullWidth={true}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Tin nhắn</h1>
        <p className="text-slate-500 mt-1">Tư vấn và hỗ trợ khách hàng.</p>
      </div>

      {/* Queue notification banner */}
      {queueNotif && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2 animate-fade-in">
          <span>✅</span> {queueNotif}
        </div>
      )}

      {/* ── Chat shell ── */}
      <div
        className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
        style={{ height: "calc(100vh - 220px)", minHeight: 500 }}
      >
        <div className="flex h-full">
          {/* ══ LEFT: Conversation list ══ */}
          <div
            className={`flex flex-col border-r border-slate-100 transition-all
            ${showMobileChat ? "hidden md:flex" : "flex"}
            w-full md:w-80 lg:w-96 shrink-0`}
          >
            {/* search */}
            <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
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

            {/* list */}
            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <MessageSquare className="w-10 h-10" />
                  <p className="text-sm">Chưa có cuộc trò chuyện</p>
                </div>
              ) : (
                filtered.map((conv, i) => {
                  const isSelected = selectedConv?.id === conv.id;
                  const gradient = avatarGradients[i % avatarGradients.length];
                  return (
                    <button
                      key={conv.id}
                      onClick={() => openConv(conv)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-slate-50
                        ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                    >
                      {/* avatar */}
                      <div
                        className={`relative w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base shrink-0`}
                      >
                        {getInitials(conv.customer?.fullName)}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
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
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ══ RIGHT: Chat pane ══ */}
          <div
            className={`flex-1 flex flex-col transition-all
            ${!showMobileChat ? "hidden md:flex" : "flex"}`}
          >
            {selectedConv ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-white">
                  <button
                    className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
                    onClick={() => setShowMobileChat(false)}
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {getInitials(selectedConv.customer?.fullName)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">
                      {selectedConv.customer?.fullName ?? "Khách hàng"}
                    </p>
                    <p className="text-xs text-emerald-500 flex items-center gap-1 mt-0.5">
                      <Circle className="w-1.5 h-1.5 fill-current" />
                      {consultantOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
                      <Video className="w-4 h-4" />
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
                        className="ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        {closingConv ? 'Đang đóng…' : 'Kết thúc'}
                      </button>
                    )}
                    {selectedConv.status === 'CLOSED' && (
                      <span className="ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-500">
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
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-slate-50/40">
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
                              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm w-full my-1 flex flex-col gap-3 border-l-4 border-l-amber-500 text-left">
                                <div className="flex gap-2.5">
                                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                                    🌴
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[9px] uppercase font-bold text-amber-700 tracking-wider block">
                                      Yêu cầu tư vấn Tour
                                    </span>
                                    <h5 className="font-extrabold text-slate-800 text-xs leading-snug line-clamp-2 mt-0.5">
                                      {tourName}
                                    </h5>
                                  </div>
                                </div>

                                <div className="bg-white/80 rounded-xl p-2.5 border border-amber-100 flex items-center justify-between text-xs">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] uppercase font-bold text-slate-400">Giá tham khảo</span>
                                    <span className="text-xs font-black text-amber-600">
                                      {tourPrice ? `${Number(tourPrice.replace(/[^0-9]/g, "")).toLocaleString("vi-VN")} đ` : "Liên hệ"}
                                    </span>
                                  </div>
                                  {tourId && (
                                    <button
                                      onClick={() => handleOpenSideTour(tourId)}
                                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm active:scale-95 text-center cursor-pointer font-sans"
                                    >
                                      Chi tiết Tour →
                                    </button>
                                  )}

                                </div>

                                <div className="text-[11px] font-semibold text-amber-800 bg-amber-100/50 rounded-lg px-2.5 py-1.5 border border-amber-200/50 text-center">
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
                <div className="px-4 py-3 border-t border-slate-100 bg-white">
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors shrink-0">
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
                      className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
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

          {/* ══ SIDE PANEL: Tour details lookup drawer ══ */}
          {sideTourId && (
            <div className="w-80 lg:w-[420px] border-l border-slate-100 bg-slate-50/50 flex flex-col h-full animate-in slide-in-from-right duration-300 shrink-0">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 bg-white flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">Tra cứu nhanh Tour</h3>
                </div>
                <button
                  onClick={() => { setSideTourId(null); setSideTourDetails(null); }}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Đóng bảng tra cứu"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingSideTour ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-slate-400 font-medium">Đang tải chi tiết Tour...</span>
                  </div>
                ) : !sideTourDetails ? (
                  <div className="text-center py-20 text-slate-400 text-xs">
                    ⚠️ Không thể tải dữ liệu Tour hoặc Tour không tồn tại.
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300 text-left">
                    {/* Basic info card */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase border border-blue-100">
                          {sideTourDetails.tourType === "JOIN_IN" ? "Ghép đoàn" : "Riêng biệt"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Mã: {sideTourDetails.id}</span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-800 leading-snug">
                        {sideTourDetails.name}
                      </h4>
                      <div className="flex items-baseline gap-1 mt-2.5">
                        <span className="text-xs text-slate-400">Giá niêm yết:</span>
                        <span className="text-lg font-black text-emerald-600">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(sideTourDetails.price || 0)}
                        </span>
                      </div>
                    </div>



                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500 fill-indigo-50 shrink-0" />
                        <div>
                          <span className="text-[8px] text-slate-400 block uppercase font-bold">Thời gian</span>
                          <span className="text-xs font-bold text-slate-700">
                            {sideTourDetails.durationDays}N{sideTourDetails.durationNights}Đ
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-2">
                        <Bus className="w-5 h-5 text-amber-500 fill-amber-50 shrink-0" />
                        <div>
                          <span className="text-[8px] text-slate-400 block uppercase font-bold">Phương tiện</span>
                          <span className="text-xs font-bold text-slate-700 truncate block max-w-[80px]">
                            {sideTourDetails.vehicleType || "Xe du lịch"}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500 fill-blue-50 shrink-0" />
                        <div>
                          <span className="text-[8px] text-slate-400 block uppercase font-bold">Slot tối đa</span>
                          <span className="text-xs font-bold text-slate-700">
                            {sideTourDetails.maximumSlots} chỗ
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-400 shrink-0" />
                        <div>
                          <span className="text-[8px] text-slate-400 block uppercase font-bold">Đánh giá</span>
                          <span className="text-xs font-bold text-slate-700">
                            {sideTourDetails.rating ? `${sideTourDetails.rating} / 5` : "Chưa có"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Destination details */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3.5">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-5 h-5 text-rose-500 fill-rose-50 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider block">Điểm khởi hành</span>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">{sideTourDetails.startDestinationName || "Hà Nội / TP.HCM"}</p>
                        </div>
                      </div>
                      <div className="border-t border-slate-100 pt-2.5 flex items-start gap-2.5">
                        <Flag className="w-5 h-5 text-slate-500 fill-slate-50 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider block">Điểm kết thúc</span>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">{sideTourDetails.endDestinationName || "Nha Trang / Phú Quốc"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible/Scrolling Description */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
                      <h5 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Mô tả chi tiết</h5>
                      <p className="text-xs text-slate-600 leading-relaxed max-h-48 overflow-y-auto pr-1 whitespace-pre-wrap scrollbar-thin">
                        {sideTourDetails.description || "Chưa có mô tả chi tiết."}
                      </p>
                    </div>

                    {/* Schedules list */}
                    {sideTourDetails.schedules && sideTourDetails.schedules.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Lịch trình & Slot khởi hành</h5>
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                          {sideTourDetails.schedules.map((sch: any, idx: number) => (
                            <div key={sch.id || idx} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-xs flex justify-between items-center gap-2">
                              <div>
                                <p className="font-bold text-slate-700">Khởi hành: {new Date(sch.startDate).toLocaleDateString("vi-VN")}</p>
                                <p className="text-slate-400 text-[9px] mt-0.5">Kết thúc: {new Date(sch.endDate).toLocaleDateString("vi-VN")}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`inline-block font-black px-2.5 py-1 rounded-lg text-[9px] ${sch.availableSlot > 5
                                    ? "bg-emerald-50 text-emerald-700"
                                    : sch.availableSlot > 0
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-rose-50 text-rose-700"
                                  }`}>
                                  {sch.availableSlot > 0 ? `Còn trống ${sch.availableSlot} chỗ` : "Hết chỗ"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
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

