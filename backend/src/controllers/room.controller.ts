import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { sendValidationError } from '../utils/errors.js';

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

  // GET /api/rooms - Get all rooms
  app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    // Fetch rooms and room types in parallel
    const [rooms, roomTypes] = await Promise.all([
      prisma.room.findMany({
        include: {
          floor: {
            select: {
              id: true,
              name: true,
              level: true,
              building: {
                select: {
                  id: true,
                  name: true,
                  project: { select: { id: true, name: true, clientName: true } },
                },
              },
            },
          },
          _count: { select: { assets: true, issues: true } },
        },
        orderBy: [
          { floor: { building: { project: { name: 'asc' } } } },
          { floor: { building: { name: 'asc' } } },
          { floor: { level: 'asc' } },
          { name: 'asc' },
        ],
      }),
      prisma.lookupRoomType.findMany({
        where: { isActive: true },
        select: { name: true, icon: true },
      }),
    ]);

    // Create a map of room type name to icon
    const roomTypeIconMap = new Map(roomTypes.map(rt => [rt.name, rt.icon]));

    // Add roomTypeIcon to each room
    const roomsWithIcons = rooms.map(room => ({
      ...room,
      roomTypeIcon: room.type ? roomTypeIconMap.get(room.type) || null : null,
    }));

    return reply.send({ rooms: roomsWithIcons });
  });

  // GET /api/rooms/:id - Get room by ID with assets
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        floor: {
          include: {
            building: {
              include: {
                project: { select: { id: true, name: true } },
              },
            },
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
              building: {
                include: {
                  project: { select: { id: true, name: true } },
                },
              },
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
        return sendValidationError(reply, error);
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
