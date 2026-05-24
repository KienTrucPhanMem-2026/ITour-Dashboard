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
  updatedAt?: string;
  status?: string;
  lastMessage?: string;
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
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [consultantOnline, setConsultantOnline] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [closingConv, setClosingConv] = useState(false);
  const [queueNotif, setQueueNotif] = useState<string | null>(null);
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
          setConvList(mapped);
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
    const q = search.toLowerCase();
    const cust = c.customer || c.chatCustomer;
    return (
      cust?.fullName?.toLowerCase().includes(q) ||
      cust?.email?.toLowerCase().includes(q)
    );
  });

  /* ── Render ── */
  return (
    <DashboardLayout>
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
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm khách hàng…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                />
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
                          <p
                            className={`text-sm font-semibold truncate ${isSelected ? "text-blue-700" : "text-slate-900"}`}
                          >
                            {conv.customer?.fullName ?? "Khách hàng"}
                          </p>
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
                    <button className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
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
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                              ${isMine
                                  ? "bg-blue-600 text-white rounded-br-sm"
                                  : "bg-white text-slate-800 rounded-bl-sm border border-slate-100"
                                }`}
                            >
                              {msg.text || msg.content}
                            </div>
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
        </div>
      </div>
    </DashboardLayout>
  );
}
