import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendValidationError } from '../utils/errors.js';
import { wsManager } from '../utils/ws-manager.js';

const participantInclude = {
  user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
};

const messageInclude = {
  sender: { select: { id: true, name: true, avatar: true } },
};

const conversationInclude = {
  participants: { include: participantInclude },
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    include: messageInclude,
  },
};

export async function messengerRoutes(app: FastifyInstance) {
  // ─── WebSocket Route (auth via query param token) ────────
  app.get('/ws', { websocket: true }, async (socket, request) => {
    const { token } = request.query as { token?: string };
    if (!token) {
      socket.close(4001, 'Missing token');
      return;
    }

    try {
      const decoded = app.jwt.verify<{ id: string; email: string; role: string }>(token);
      const userId = decoded.id;

      // Register connection
      wsManager.addConnection(userId, socket);

      // Send initial connection success
      socket.send(JSON.stringify({ event: 'connected', data: { userId } }));

      // Handle incoming messages from client
      socket.on('message', (raw: Buffer | string) => {
        try {
          const msg = JSON.parse(raw.toString());
          handleClientMessage(userId, msg);
        } catch {
          // Ignore malformed messages
        }
      });

      // Heartbeat - respond to ping
      socket.on('pong', () => {
        // Client is alive
      });
    } catch {
      socket.close(4003, 'Invalid token');
    }
  });

  // Handle messages from WebSocket clients
  function handleClientMessage(userId: string, msg: { event: string; data?: Record<string, unknown> }) {
    switch (msg.event) {
      case 'typing:start':
      case 'typing:stop': {
        const conversationId = msg.data?.conversationId as string;
        if (!conversationId) return;
        // Broadcast typing status to other participants (async, fire-and-forget)
        broadcastToConversation(conversationId, userId, msg.event, {
          conversationId,
          userId,
        });
        break;
      }
      case 'ping':
        // Client heartbeat - just acknowledge
        wsManager.sendToUser(userId, 'pong', {});
        break;
    }
  }

  // Broadcast to all participants of a conversation except the sender
  async function broadcastToConversation(conversationId: string, excludeUserId: string, event: string, data: unknown) {
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    const otherUserIds = participants
      .map(p => p.userId)
      .filter(id => id !== excludeUserId);

    wsManager.sendToUsers(otherUserIds, event, data);
  }

  // REST routes require authentication
  app.addHook('preHandler', authenticate);

  // GET /api/messenger/conversations - List my conversations
  app.get('/conversations', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: user.id } },
      },
      include: conversationInclude,
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    });

    // Add unread count per conversation
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const myParticipant = conv.participants.find(p => p.userId === user.id);
        const unreadCount = myParticipant?.lastReadAt
          ? await prisma.message.count({
              where: {
                conversationId: conv.id,
                createdAt: { gt: myParticipant.lastReadAt },
                senderId: { not: user.id },
              },
            })
          : await prisma.message.count({
              where: {
                conversationId: conv.id,
                senderId: { not: user.id },
              },
            });

        return { ...conv, unreadCount };
      })
    );

    return reply.send({ conversations: result });
  });

  // POST /api/messenger/conversations - Create conversation
  app.post('/conversations', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    const schema = z.object({
      title: z.string().max(100).optional(),
      participantIds: z.array(z.string()).min(1, 'At least one participant required'),
      isGroup: z.boolean().optional().default(false),
    });

    try {
      const data = schema.parse(request.body);

      // Ensure creator is included in participants
      const allParticipantIds = [...new Set([user.id, ...data.participantIds])];

      // For 1:1, check if conversation already exists
      if (!data.isGroup && allParticipantIds.length === 2) {
        const existing = await prisma.conversation.findFirst({
          where: {
            isGroup: false,
            participants: { every: { userId: { in: allParticipantIds } } },
            AND: [
              { participants: { some: { userId: allParticipantIds[0] } } },
              { participants: { some: { userId: allParticipantIds[1] } } },
            ],
          },
          include: conversationInclude,
        });

        if (existing) {
          // Check it's exactly 2 participants
          if (existing.participants.length === 2) {
            return reply.send({ conversation: existing, existing: true });
          }
        }
      }

      const conversation = await prisma.conversation.create({
        data: {
          title: data.isGroup ? (data.title || 'Group Chat') : null,
          isGroup: data.isGroup,
          participants: {
            create: allParticipantIds.map(userId => ({ userId })),
          },
        },
        include: conversationInclude,
      });

      return reply.status(201).send({ conversation });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // GET /api/messenger/conversations/:id/messages - Get messages
  app.get('/conversations/:id/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { id: string };
    const { before, limit: limitStr } = request.query as { before?: string; limit?: string };

    // Verify participation
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: user.id } },
    });
    if (!participant) {
      return reply.status(403).send({ error: 'Not a member of this conversation' });
    }

    const limit = Math.min(parseInt(limitStr || '50'), 100);

    const where: Record<string, unknown> = { conversationId: id };
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    const [messages, participants] = await Promise.all([
      prisma.message.findMany({
        where,
        include: messageInclude,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.conversationParticipant.findMany({
        where: { conversationId: id },
        select: { userId: true, lastReadAt: true },
      }),
    ]);

    return reply.send({ messages: messages.reverse(), participants });
  });

  // POST /api/messenger/conversations/:id/messages - Send message
  app.post('/conversations/:id/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { id: string };

    const schema = z.object({
      content: z.string().min(1, 'Message cannot be empty').max(5000),
    });

    try {
      const { content } = schema.parse(request.body);

      // Verify participation
      const participant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId: id, userId: user.id } },
      });
      if (!participant) {
        return reply.status(403).send({ error: 'Not a member of this conversation' });
      }

      // Create message and update conversation + sender's read marker
      const [message] = await prisma.$transaction([
        prisma.message.create({
          data: { conversationId: id, senderId: user.id, content },
          include: messageInclude,
        }),
        prisma.conversation.update({
          where: { id },
          data: { lastMessageAt: new Date() },
        }),
        prisma.conversationParticipant.update({
          where: { conversationId_userId: { conversationId: id, userId: user.id } },
          data: { lastReadAt: new Date() },
        }),
      ]);

      // 🔥 Broadcast new message to all participants via WebSocket
      broadcastToConversation(id, user.id, 'message:new', {
        conversationId: id,
        message,
      });

      return reply.status(201).send({ message });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // POST /api/messenger/conversations/:id/read - Mark as read
  app.post('/conversations/:id/read', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { id: string };

    await prisma.conversationParticipant.updateMany({
      where: { conversationId: id, userId: user.id },
      data: { lastReadAt: new Date() },
    });

    // 🔥 Broadcast read receipt to other participants
    broadcastToConversation(id, user.id, 'message:read', {
      conversationId: id,
      userId: user.id,
      readAt: new Date().toISOString(),
    });

    return reply.send({ success: true });
  });

  // GET /api/messenger/unread - Get total unread count (for sidebar badge)
  app.get('/unread', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    const participations = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      select: { conversationId: true, lastReadAt: true },
    });

    let totalUnread = 0;
    for (const p of participations) {
      const count = p.lastReadAt
        ? await prisma.message.count({
            where: {
              conversationId: p.conversationId,
              createdAt: { gt: p.lastReadAt },
              senderId: { not: user.id },
            },
          })
        : await prisma.message.count({
            where: {
              conversationId: p.conversationId,
              senderId: { not: user.id },
            },
          });
      totalUnread += count;
    }

    return reply.send({ unread: totalUnread });
  });
}
