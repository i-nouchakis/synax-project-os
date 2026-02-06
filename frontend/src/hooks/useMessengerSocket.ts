import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

type WsEvent = {
  event: string;
  data: Record<string, unknown>;
};

type EventHandler = (data: Record<string, unknown>) => void;

const RECONNECT_DELAY_MS = 3000;
const HEARTBEAT_INTERVAL_MS = 30000;

// Singleton WebSocket manager - shared across all hook instances
let globalWs: WebSocket | null = null;
let globalReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let globalHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
let globalListeners = new Map<string, Set<EventHandler>>();
let globalRefCount = 0;
let isConnecting = false;

function getWsUrl(): string {
  const token = api.getToken();
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/messenger/ws?token=${token}`;
}

function connect() {
  if (isConnecting || (globalWs && globalWs.readyState === WebSocket.OPEN)) return;
  if (!api.getToken()) return;

  isConnecting = true;

  try {
    const ws = new WebSocket(getWsUrl());

    ws.onopen = () => {
      isConnecting = false;
      globalWs = ws;

      // Start heartbeat
      if (globalHeartbeatTimer) clearInterval(globalHeartbeatTimer);
      globalHeartbeatTimer = setInterval(() => {
        if (globalWs?.readyState === WebSocket.OPEN) {
          globalWs.send(JSON.stringify({ event: 'ping' }));
        }
      }, HEARTBEAT_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsEvent = JSON.parse(event.data);
        const handlers = globalListeners.get(msg.event);
        if (handlers) {
          for (const handler of handlers) {
            handler(msg.data);
          }
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      isConnecting = false;
      globalWs = null;
      if (globalHeartbeatTimer) {
        clearInterval(globalHeartbeatTimer);
        globalHeartbeatTimer = null;
      }

      // Auto-reconnect if still needed
      if (globalRefCount > 0) {
        if (globalReconnectTimer) clearTimeout(globalReconnectTimer);
        globalReconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    ws.onerror = () => {
      isConnecting = false;
      ws.close();
    };
  } catch {
    isConnecting = false;
  }
}

function disconnect() {
  if (globalReconnectTimer) {
    clearTimeout(globalReconnectTimer);
    globalReconnectTimer = null;
  }
  if (globalHeartbeatTimer) {
    clearInterval(globalHeartbeatTimer);
    globalHeartbeatTimer = null;
  }
  if (globalWs) {
    globalWs.close();
    globalWs = null;
  }
}

function subscribe(event: string, handler: EventHandler) {
  if (!globalListeners.has(event)) {
    globalListeners.set(event, new Set());
  }
  globalListeners.get(event)!.add(handler);

  return () => {
    const handlers = globalListeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        globalListeners.delete(event);
      }
    }
  };
}

function sendEvent(event: string, data: Record<string, unknown>) {
  if (globalWs?.readyState === WebSocket.OPEN) {
    globalWs.send(JSON.stringify({ event, data }));
  }
}

/**
 * Hook that manages WebSocket connection lifecycle.
 * Call this in components that need real-time messenger updates.
 * The connection is shared (singleton) and auto-reconnects.
 */
export function useMessengerSocket() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const handlersRef = useRef<Array<() => void>>([]);

  // Connect/disconnect based on auth state
  useEffect(() => {
    if (!isAuthenticated) return;

    globalRefCount++;
    connect();

    return () => {
      globalRefCount--;
      if (globalRefCount <= 0) {
        globalRefCount = 0;
        disconnect();
      }
    };
  }, [isAuthenticated]);

  // Default handler: invalidate queries on message:new
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsub1 = subscribe('message:new', (data) => {
      const conversationId = data.conversationId as string;
      // Invalidate messages for the specific conversation
      queryClient.invalidateQueries({ queryKey: ['messenger-messages', conversationId] });
      // Invalidate conversations list (for last message + unread count)
      queryClient.invalidateQueries({ queryKey: ['messenger-conversations'] });
      // Invalidate unread count for sidebar
      queryClient.invalidateQueries({ queryKey: ['messenger-unread'] });
    });

    const unsub2 = subscribe('message:read', (data) => {
      const conversationId = data.conversationId as string;
      queryClient.invalidateQueries({ queryKey: ['messenger-messages', conversationId] });
    });

    handlersRef.current = [unsub1, unsub2];

    return () => {
      handlersRef.current.forEach(fn => fn());
      handlersRef.current = [];
    };
  }, [isAuthenticated, queryClient]);

  const on = useCallback((event: string, handler: EventHandler) => {
    return subscribe(event, handler);
  }, []);

  const emit = useCallback((event: string, data: Record<string, unknown>) => {
    sendEvent(event, data);
  }, []);

  return { on, emit };
}
