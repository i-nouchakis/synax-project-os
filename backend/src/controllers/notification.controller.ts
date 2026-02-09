import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import { prisma } from '../utils/prisma.js';

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /api/notifications - Get user's notifications
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const { limit = '20', offset = '0', unreadOnly = 'false' } = request.query as {
      limit?: string;
      offset?: string;
      unreadOnly?: string;
    };

    const where: any = { userId: user.id };
    if (unreadOnly === 'true') where.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);

    return reply.send({ notifications, total, unreadCount });
  });

  // GET /api/notifications/unread-count - Quick unread count
  app.get('/unread-count', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    const count = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });

    return reply.send({ count });
  });

  // PATCH /api/notifications/:id/read - Mark single notification as read
  app.patch('/:id/read', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const { id } = request.params as { id: string };

    const notification = await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });

    if (notification.count === 0) {
      return reply.status(404).send({ error: 'Notification not found' });
    }

    return reply.send({ message: 'Marked as read' });
  });

  // POST /api/notifications/read-all - Mark all as read
  app.post('/read-all', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    return reply.send({ message: 'All notifications marked as read' });
  });

  // DELETE /api/notifications/:id - Delete a notification
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const { id } = request.params as { id: string };

    await prisma.notification.deleteMany({
      where: { id, userId: user.id },
    });

    return reply.send({ message: 'Notification deleted' });
  });
}
