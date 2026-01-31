import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const updateRoomSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().optional(),
  pinX: z.number().optional(),
  pinY: z.number().optional(),
  notes: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).optional(),
});

export async function roomRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // GET /api/rooms/:id - Get room by ID with assets
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        floor: {
          include: {
            project: { select: { id: true, name: true } },
          },
        },
        assets: {
          include: {
            assetType: true,
            installedBy: { select: { id: true, name: true } },
            _count: { select: { checklists: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { assets: true, issues: true },
        },
      },
    });

    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }

    return reply.send({ room });
  });

  // PUT /api/rooms/:id - Update room
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const data = updateRoomSchema.parse(request.body);

      const room = await prisma.room.update({
        where: { id },
        data,
        include: {
          floor: {
            include: {
              project: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: { assets: true, issues: true },
          },
        },
      });

      return reply.send({ room });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // DELETE /api/rooms/:id - Delete room
  app.delete('/:id', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    await prisma.room.delete({ where: { id } });

    return reply.send({ message: 'Room deleted' });
  });
}
