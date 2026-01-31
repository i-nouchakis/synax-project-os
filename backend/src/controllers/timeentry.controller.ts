import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const createTimeEntrySchema = z.object({
  projectId: z.string(),
  roomId: z.string().optional(),
  assetId: z.string().optional(),
  type: z.enum(['INSTALLATION', 'CONFIGURATION', 'TESTING', 'TROUBLESHOOTING', 'TRAVEL', 'MEETING', 'OTHER']),
  description: z.string().optional(),
  date: z.string().optional(), // ISO date string
  startTime: z.string().optional(), // ISO datetime string
  endTime: z.string().optional(), // ISO datetime string
  hours: z.number().min(0.1).max(24),
  notes: z.string().optional(),
});

const updateTimeEntrySchema = createTimeEntrySchema.partial();

export async function timeEntryRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // IMPORTANT: Register specific routes BEFORE parametric routes in Fastify

  // POST /api/time-entries/start - Start time tracking (creates entry with startTime)
  // Must be registered before /:id routes
  app.post('/start', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const { projectId, type, description, roomId, assetId } = request.body as {
      projectId: string;
      type?: string;
      description?: string;
      roomId?: string;
      assetId?: string;
    };

    const timeEntry = await prisma.timeEntry.create({
      data: {
        projectId,
        userId: user.id,
        type: (type as 'INSTALLATION' | 'CONFIGURATION' | 'TESTING' | 'TROUBLESHOOTING' | 'TRAVEL' | 'MEETING' | 'OTHER') || 'OTHER',
        description,
        roomId,
        assetId,
        date: new Date(),
        startTime: new Date(),
        hours: 0,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return reply.status(201).send({ timeEntry });
  });

  // GET /api/time-entries - Get all time entries (with filters)
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId, userId, startDate, endDate } = request.query as {
      projectId?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    };

    const user = request.user as { id: string; role: string };

    const where: Record<string, unknown> = {};

    // Non-admins can only see their own entries
    if (user.role !== 'ADMIN' && user.role !== 'PM') {
      where.userId = user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (projectId) where.projectId = projectId;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate);
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        room: { select: { id: true, name: true } },
        asset: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    return reply.send({ timeEntries });
  });

  // GET /api/time-entries/my - Get current user's time entries
  app.get('/my', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const { projectId, startDate, endDate } = request.query as {
      projectId?: string;
      startDate?: string;
      endDate?: string;
    };

    const where: Record<string, unknown> = { userId: user.id };

    if (projectId) where.projectId = projectId;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate);
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
        asset: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    return reply.send({ timeEntries });
  });

  // GET /api/time-entries/project/:projectId/summary - Get project time summary
  app.get('/project/:projectId/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    // Total hours by user
    const byUser = await prisma.timeEntry.groupBy({
      by: ['userId'],
      where: { projectId },
      _sum: { hours: true },
    });

    // Get user details
    const userIds = byUser.map(b => b.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const byUserWithNames = byUser.map(b => ({
      userId: b.userId,
      userName: users.find(u => u.id === b.userId)?.name || 'Unknown',
      totalHours: b._sum.hours || 0,
    }));

    // Total hours by type
    const byType = await prisma.timeEntry.groupBy({
      by: ['type'],
      where: { projectId },
      _sum: { hours: true },
    });

    // Total hours for project
    const total = await prisma.timeEntry.aggregate({
      where: { projectId },
      _sum: { hours: true },
      _count: { id: true },
    });

    // Recent entries
    const recentEntries = await prisma.timeEntry.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      take: 10,
    });

    return reply.send({
      summary: {
        totalHours: total._sum.hours || 0,
        totalEntries: total._count.id,
        byUser: byUserWithNames,
        byType: byType.map(b => ({
          type: b.type,
          hours: b._sum.hours || 0,
        })),
      },
      recentEntries,
    });
  });

  // GET /api/time-entries/:id - Get time entry by ID
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        room: { select: { id: true, name: true } },
        asset: { select: { id: true, name: true } },
      },
    });

    if (!timeEntry) {
      return reply.status(404).send({ error: 'Time entry not found' });
    }

    return reply.send({ timeEntry });
  });

  // POST /api/time-entries - Create new time entry
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    try {
      const data = createTimeEntrySchema.parse(request.body);

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
      });
      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      const timeEntry = await prisma.timeEntry.create({
        data: {
          ...data,
          userId: user.id,
          date: data.date ? new Date(data.date) : new Date(),
          startTime: data.startTime ? new Date(data.startTime) : null,
          endTime: data.endTime ? new Date(data.endTime) : null,
        },
        include: {
          project: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
          room: { select: { id: true, name: true } },
          asset: { select: { id: true, name: true } },
        },
      });

      return reply.status(201).send({ timeEntry });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // PUT /api/time-entries/:id - Update time entry
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { id: string; role: string };

    try {
      const data = updateTimeEntrySchema.parse(request.body);

      // Check if entry exists and user has permission
      const existing = await prisma.timeEntry.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ error: 'Time entry not found' });
      }

      // Only owner or admin/PM can update
      if (existing.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'PM') {
        return reply.status(403).send({ error: 'Not authorized to update this entry' });
      }

      const timeEntry = await prisma.timeEntry.update({
        where: { id },
        data: {
          ...data,
          date: data.date ? new Date(data.date) : undefined,
          startTime: data.startTime ? new Date(data.startTime) : undefined,
          endTime: data.endTime ? new Date(data.endTime) : undefined,
        },
        include: {
          project: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
          room: { select: { id: true, name: true } },
          asset: { select: { id: true, name: true } },
        },
      });

      return reply.send({ timeEntry });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // DELETE /api/time-entries/:id - Delete time entry
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { id: string; role: string };

    const existing = await prisma.timeEntry.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Time entry not found' });
    }

    // Only owner or admin/PM can delete
    if (existing.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'PM') {
      return reply.status(403).send({ error: 'Not authorized to delete this entry' });
    }

    await prisma.timeEntry.delete({ where: { id } });

    return reply.send({ message: 'Time entry deleted' });
  });

  // POST /api/time-entries/:id/stop - Stop time tracking (sets endTime and calculates hours)
  app.post('/:id/stop', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { id: string };

    const existing = await prisma.timeEntry.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Time entry not found' });
    }

    if (existing.userId !== user.id) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    if (!existing.startTime) {
      return reply.status(400).send({ error: 'Entry was not started with time tracking' });
    }

    const endTime = new Date();
    const hours = (endTime.getTime() - existing.startTime.getTime()) / (1000 * 60 * 60);

    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        endTime,
        hours: Math.round(hours * 100) / 100, // Round to 2 decimal places
      },
      include: {
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });

    return reply.send({ timeEntry });
  });
}
