import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const createFloorSchema = z.object({
  buildingId: z.string(),
  name: z.string().min(1),
  level: z.number().int().optional(),
  pinX: z.number().optional(),
  pinY: z.number().optional(),
});

const updateFloorSchema = z.object({
  name: z.string().min(1).optional(),
  level: z.number().int().optional(),
  floorplanUrl: z.string().url().optional(),
  floorplanType: z.string().optional(),
});

const createRoomSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  pinX: z.number().nullable().optional(),
  pinY: z.number().nullable().optional(),
  notes: z.string().optional(),
});

export async function floorRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // GET /api/floors - Get all floors
  app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    const floors = await prisma.floor.findMany({
      include: {
        building: {
          select: {
            id: true,
            name: true,
            project: { select: { id: true, name: true, clientName: true } },
          },
        },
        _count: { select: { rooms: true } },
      },
      orderBy: [
        { building: { project: { name: 'asc' } } },
        { building: { name: 'asc' } },
        { level: 'asc' },
      ],
    });

    return reply.send({ floors });
  });

  // GET /api/floors/:id - Get floor with rooms and floor-level assets
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const floor = await prisma.floor.findUnique({
      where: { id },
      include: {
        building: {
          select: {
            id: true,
            name: true,
            project: { select: { id: true, name: true } },
          },
        },
        rooms: {
          include: {
            _count: { select: { assets: true, issues: true } },
          },
          orderBy: { name: 'asc' },
        },
        assets: {
          where: { roomId: null },
          include: {
            assetType: true,
            installedBy: { select: { id: true, name: true } },
            _count: { select: { checklists: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!floor) {
      return reply.status(404).send({ error: 'Floor not found' });
    }

    return reply.send({ floor });
  });

  // POST /api/floors - Create floor (Admin, PM only)
  app.post('/', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createFloorSchema.parse(request.body);

      const floor = await prisma.floor.create({
        data: {
          buildingId: data.buildingId,
          name: data.name,
          level: data.level ?? 0,
          pinX: data.pinX,
          pinY: data.pinY,
        },
        include: {
          building: {
            select: {
              id: true,
              name: true,
              project: { select: { id: true, name: true } },
            },
          },
        },
      });

      return reply.status(201).send({ floor });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // PUT /api/floors/:id - Update floor
  app.put('/:id', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
      const data = updateFloorSchema.parse(request.body);

      const floor = await prisma.floor.update({
        where: { id },
        data,
      });

      return reply.send({ floor });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // DELETE /api/floors/:id - Delete floor
  app.delete('/:id', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    await prisma.floor.delete({ where: { id } });

    return reply.send({ message: 'Floor deleted' });
  });

  // ============================================
  // Rooms (nested under floors)
  // ============================================

  // GET /api/floors/:id/rooms - List rooms in floor
  app.get('/:id/rooms', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const rooms = await prisma.room.findMany({
      where: { floorId: id },
      include: {
        _count: { select: { assets: true, issues: true } },
      },
      orderBy: { name: 'asc' },
    });

    return reply.send({ rooms });
  });

  // POST /api/floors/:id/rooms - Create room
  app.post('/:id/rooms', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
      const data = createRoomSchema.parse(request.body);

      const room = await prisma.room.create({
        data: {
          floorId: id,
          ...data,
        },
      });

      return reply.status(201).send({ room });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // PUT /api/floors/:floorId/rooms/:roomId - Update room
  app.put('/:floorId/rooms/:roomId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { roomId } = request.params as { floorId: string; roomId: string };
      const data = createRoomSchema.partial().extend({
        status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).optional(),
      }).parse(request.body);

      const room = await prisma.room.update({
        where: { id: roomId },
        data,
      });

      return reply.send({ room });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // DELETE /api/floors/:floorId/rooms/:roomId - Delete room (Admin, PM only)
  app.delete('/:floorId/rooms/:roomId', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { roomId } = request.params as { floorId: string; roomId: string };

    await prisma.room.delete({ where: { id: roomId } });

    return reply.send({ message: 'Room deleted' });
  });

  // PUT /api/floors/:id/position - Update floor position on masterplan
  app.put('/:id/position', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { pinX, pinY } = request.body as { pinX: number | null; pinY: number | null };

    const floor = await prisma.floor.update({
      where: { id },
      data: { pinX, pinY },
    });

    return reply.send({ floor });
  });
}
