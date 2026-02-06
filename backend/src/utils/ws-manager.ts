import { WebSocket } from 'ws';

// In-memory connection map: userId → Set of WebSocket connections (multi-tab support)
const connections = new Map<string, Set<WebSocket>>();

export const wsManager = {
  // Register a new connection for a user
  addConnection(userId: string, ws: WebSocket) {
    if (!connections.has(userId)) {
      connections.set(userId, new Set());
    }
    connections.get(userId)!.add(ws);

    // Clean up on close
    ws.on('close', () => {
      const userConns = connections.get(userId);
      if (userConns) {
        userConns.delete(ws);
        if (userConns.size === 0) {
          connections.delete(userId);
        }
      }
    });
  },

  // Send a message to a specific user (all their tabs)
  sendToUser(userId: string, event: string, data: unknown) {
    const userConns = connections.get(userId);
    if (!userConns) return;

    const payload = JSON.stringify({ event, data });
    for (const ws of userConns) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  },

  // Send to multiple users
  sendToUsers(userIds: string[], event: string, data: unknown) {
    for (const userId of userIds) {
      this.sendToUser(userId, event, data);
    }
  },

  // Check if user is online
  isOnline(userId: string): boolean {
    const userConns = connections.get(userId);
    return !!userConns && userConns.size > 0;
  },

  // Get all online user IDs
  getOnlineUserIds(): string[] {
    return Array.from(connections.keys());
  },

  // Get connection count (for debugging)
  getStats() {
    let totalConnections = 0;
    for (const conns of connections.values()) {
      totalConnections += conns.size;
    }
    return {
      onlineUsers: connections.size,
      totalConnections,
    };
  },
};
