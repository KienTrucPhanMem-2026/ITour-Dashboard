// ⚠️  This module uses browser-only APIs (WebSocket). Only import from 'use client' components.
import type { Socket } from 'socket.io-client';

let socket: Socket | null = null;
let io: typeof import('socket.io-client')['io'] | null = null;

// Lazy-load socket.io-client only in browser environment
const getIo = async () => {
  if (typeof window === 'undefined') return null;
  if (!io) {
    const mod = await import('socket.io-client');
    io = mod.io;
  }
  return io;
};

// ─── Initialize Socket Connection ─────────────────────────────────────────
export const initSocket = async (userId: string, userType: 'CONSULTANT' | 'CUSTOMER', token?: string) => {
  if (socket?.connected) {
    console.log('✓ Socket already connected');
    return socket;
  }

  // Guard: only run in browser
  const ioFn = await getIo();
  if (!ioFn) {
    console.warn('⚠️  Socket.io not available in SSR context');
    return null;
  }

  const namespace = userType === 'CONSULTANT' ? '/consultant' : '/customer';
  const authKey = userType === 'CONSULTANT' ? 'consultantId' : 'customerId';
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:2902';

  console.log(`📡 [${userType}] Initializing socket connection`, {
    url: socketUrl + namespace,
    namespace,
    userId,
    authKey,
  });

  socket = ioFn(socketUrl + namespace, {
    path: '/socket.io/',
    transports: ['polling', 'websocket'],
    auth: {
      [authKey]: userId,
      ...(token && { token })
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000
    }
  });

  // Global connection events
  socket.on('connect', () => {
    console.log(`✅ [${userType}] Socket.io connected`, {
      socketId: socket?.id,
      userId,
      userType,
      namespace,
    });
  });

  socket.on('connect_error', (error) => {
    console.error(`❌ [${userType}] Connection error`, {
      errorMessage: error?.message || 'Unknown error',
      errorData: error?.data,
      errorType: error?.type,
      errorCode: error?.code,
      error: error,
      userId,
      userType,
      namespace,
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 [${userType}] Socket disconnected`, {
      reason,
      userId,
      userType,
    });
  });

  socket.on('error', (error) => {
    console.error(`⚠️  [${userType}] Socket error`, {
      error,
      userId,
      userType,
    });
  });

  return socket;
};

// ─── Conversation Management ──────────────────────────────────────────────
export const joinConversation = (conversationId: string) => {
  if (!socket?.connected) {
    console.warn('Socket not connected');
    return;
  }
  socket.emit('join-conversation', { conversationId });
};

export const leaveConversation = (conversationId: string) => {
  if (!socket?.connected) return;
  socket.emit('leave-conversation', { conversationId });
};

export const getOnlineStatus = (conversationId: string) => {
  if (!socket?.connected) return;
  socket.emit('get-online-status', { conversationId });
};

// ─── Message Operations ───────────────────────────────────────────────────
export const sendMessage = (conversationId: string, customerId: string, text: string) => {
  if (!socket?.connected) {
    console.error('❌ Socket not connected - cannot send message');
    return;
  }

  const messagePayload = {
    conversationId,
    customerId,
    text,
    senderType: 'CONSULTANT'
  };

  console.log('📨 [CONSULTANT] Sending message', {
    conversationEntity: {
      id: conversationId,
    },
    messageEntity: {
      customerId,
      senderType: 'CONSULTANT',
      textLength: text.length,
      textPreview: text.substring(0, 50),
    },
    socketConnected: socket?.connected,
    socketId: socket?.id,
  });

  socket.emit('send-message', messagePayload);
};

export const markMessageAsRead = (conversationId: string, messageId: string) => {
  if (!socket?.connected) return;
  socket.emit('message-read', { conversationId, messageId });
};

// ─── Typing Indicators ────────────────────────────────────────────────────
export const setTyping = (conversationId: string, isTyping: boolean) => {
  if (!socket?.connected) return;
  socket.emit('typing', { conversationId, isTyping });
};

// ─── Message Listeners ────────────────────────────────────────────────────

/**
 * Listen for incoming messages from other party
 */
export const onReceiveMessage = (callback: (message: {
  id: string;
  conversationId: string;
  customerId?: string;
  senderType: 'CONSULTANT' | 'CUSTOMER';
  text: string;
  createdAt: string;
  status?: string;
}) => void) => {
  if (!socket) {
    console.warn('Socket not initialized');
    return () => {};
  }

  socket.on('receive-message', (message) => {
    console.log('📬 [CONSULTANT] Message received', {
      messageEntity: {
        id: message.id,
        conversationId: message.conversationId,
        customerId: message.customerId,
        senderType: message.senderType,
        textLength: message.text?.length || 0,
        textPreview: message.text?.substring(0, 50),
        createdAt: message.createdAt,
        status: message.status,
      },
    });
    callback(message);
  });
  return () => socket?.off('receive-message', callback);
};

/**
 * Listen for message sent confirmation
 */
export const onMessageSent = (callback: (data: { messageId: string; status: string }) => void) => {
  socket?.on('message-sent', callback);
  return () => socket?.off('message-sent', callback);
};

/**
 * Listen for message error
 */
export const onMessageError = (callback: (data: { message: string }) => void) => {
  socket?.on('message-error', callback);
  return () => socket?.off('message-error', callback);
};

/**
 * Listen for typing indicators
 */
export const onConsultantTyping = (callback: (data: { conversationId: string; isTyping: boolean }) => void) => {
  socket?.on('consultant-typing', callback);
  return () => socket?.off('consultant-typing', callback);
};

export const onCustomerTyping = (callback: (data: { conversationId: string; isTyping: boolean }) => void) => {
  socket?.on('customer-typing', callback);
  return () => socket?.off('customer-typing', callback);
};

/**
 * Listen for new conversations created by customers (consultant auto-refresh)
 */
export const onNewConversation = (callback: (data: { conversation: any; timestamp: string }) => void) => {
  socket?.on('new-conversation-created', callback);
  return () => socket?.off('new-conversation-created', callback);
};

// ─── Online Status Listeners ──────────────────────────────────────────────

export const onConsultantOnline = (callback: (data: { conversationId: string; timestamp: string }) => void) => {
  socket?.on('consultant-online', callback);
  return () => socket?.off('consultant-online', callback);
};

export const onConsultantOffline = (callback: (data: { conversationId: string }) => void) => {
  socket?.on('consultant-offline', callback);
  return () => socket?.off('consultant-offline', callback);
};

export const onCustomerOnline = (callback: (data: { conversationId: string; timestamp: string }) => void) => {
  socket?.on('customer-online', callback);
  return () => socket?.off('customer-online', callback);
};

export const onCustomerOffline = (callback: (data: { conversationId: string }) => void) => {
  socket?.on('customer-offline', callback);
  return () => socket?.off('customer-offline', callback);
};

export const onOnlineStatus = (callback: (data: {
  conversationId: string;
  consultantOnline: boolean;
  customerOnline: boolean;
}) => void) => {
  socket?.on('online-status', callback);
  return () => socket?.off('online-status', callback);
};

// ─── Read Receipts ────────────────────────────────────────────────────────

export const onMessageReadByConsultant = (callback: (data: { messageId: string }) => void) => {
  socket?.on('message-read-by-consultant', callback);
  return () => socket?.off('message-read-by-consultant', callback);
};

export const onMessageReadByCustomer = (callback: (data: { messageId: string }) => void) => {
  socket?.on('message-read-by-customer', callback);
  return () => socket?.off('message-read-by-customer', callback);
};

// ─── Conversation Status ──────────────────────────────────────────────────

export const updateConversationStatus = (conversationId: string, status: string) => {
  if (!socket?.connected) return;
  socket.emit('update-conversation-status', { conversationId, status });
};

export const onConversationStatusUpdated = (callback: (data: { conversationId: string; status: string }) => void) => {
  socket?.on('conversation-status-updated', callback);
  return () => socket?.off('conversation-status-updated', callback);
};

// ─── Connection Management ────────────────────────────────────────────────

export const getSocket = () => socket;

export const isConnected = () => socket?.connected ?? false;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const reconnectSocket = () => {
  if (socket) {
    socket.connect();
  }
};

// ─── Utility Functions ────────────────────────────────────────────────────

export const waitForSocketConnection = (timeout = 5000): Promise<Socket> => {
  return new Promise((resolve, reject) => {
    if (socket?.connected) {
      resolve(socket);
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('Socket connection timeout'));
    }, timeout);

    const onConnect = () => {
      clearTimeout(timer);
      socket?.off('connect', onConnect);
      resolve(socket!);
    };

    socket?.on('connect', onConnect);
  });
};
