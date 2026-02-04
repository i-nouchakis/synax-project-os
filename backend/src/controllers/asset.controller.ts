import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const createAssetSchema = z.object({
  name: z.string().min(1),
  labelCode: z.string().optional(),
  assetTypeId: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  macAddress: z.string().optional(),
  ipAddress: z.string().optional(),
  notes: z.string().optional(),
  pinX: z.number().optional(),
  pinY: z.number().optional(),
});

const updateAssetSchema = createAssetSchema.partial().extend({
  status: z.enum(['PLANNED', 'IN_STOCK', 'INSTALLED', 'CONFIGURED', 'VERIFIED', 'FAULTY']).optional(),
  pinX: z.number().optional(),
  pinY: z.number().optional(),
});

const updatePositionSchema = z.object({
  pinX: z.number().nullable(),
  pinY: z.number().nullable(),
});

export async function assetRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // GET /api/assets - Search assets across all projects
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { search, status, assetTypeId } = request.query as {
      search?: string;
      status?: string;
      assetTypeId?: string;
    };

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { labelCode: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { macAddress: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (assetTypeId) {
      where.assetTypeId = assetTypeId;
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        assetType: true,
        room: {
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
          },
        },
        installedBy: { select: { id: true, name: true } },
        _count: { select: { checklists: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return reply.send({ assets });
  });

  // GET /api/assets/types - Get all asset types
  app.get('/types', async (request: FastifyRequest, reply: FastifyReply) => {
    const assetTypes = await prisma.assetType.findMany({
      include: {
        _count: { select: { assets: true } },
      },
      orderBy: { name: 'asc' },
    });

    return reply.send({ assetTypes });
  });

  // GET /api/assets/lookup/:code - Lookup asset by serial number or MAC address
  app.get('/lookup/:code', async (request: FastifyRequest, reply: FastifyReply) => {
    const { code } = request.params as { code: string };

    // Try to find by exact serial number or MAC address
    const asset = await prisma.asset.findFirst({
      where: {
        OR: [
          { serialNumber: { equals: code, mode: 'insensitive' } },
          { macAddress: { equals: code, mode: 'insensitive' } },
          // Also try without colons/dashes for MAC
          { macAddress: { equals: code.replace(/[:-]/g, ''), mode: 'insensitive' } },
        ],
      },
      include: {
        assetType: true,
        room: {
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
          },
        },
        installedBy: { select: { id: true, name: true } },
      },
    });

    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' });
    }

    return reply.send({ asset });
  });

  // GET /api/assets/by-label/:labelCode - Lookup asset by label code (for QR scan)
  app.get('/by-label/:labelCode', async (request: FastifyRequest, reply: FastifyReply) => {
    const { labelCode } = request.params as { labelCode: string };

    const asset = await prisma.asset.findFirst({
      where: {
        labelCode: { equals: labelCode, mode: 'insensitive' },
      },
      include: {
        assetType: true,
        room: {
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
          },
        },
        installedBy: { select: { id: true, name: true } },
        checklists: {
          include: {
            items: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found with this label code' });
    }

    return reply.send({ asset });
  });

  // GET /api/assets/:id - Get asset by ID
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assetType: true,
        room: {
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
          },
        },
        installedBy: { select: { id: true, name: true, email: true } },
        checklists: {
          include: {
            items: {
              include: {
                photos: true,
              },
              orderBy: { order: 'asc' },
            },
            assignedTo: { select: { id: true, name: true } },
          },
          orderBy: { type: 'asc' },
        },
      },
    });

    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' });
    }

    return reply.send({ asset });
  });

  // POST /api/assets/rooms/:roomId - Create asset in room
  app.post('/rooms/:roomId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { roomId } = request.params as { roomId: string };

    try {
      const data = createAssetSchema.parse(request.body);

      // Verify room exists
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room) {
        return reply.status(404).send({ error: 'Room not found' });
      }

      const asset = await prisma.asset.create({
        data: {
          roomId,
          ...data,
        },
        include: {
          assetType: true,
          room: { select: { id: true, name: true } },
        },
      });

      return reply.status(201).send({ asset });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // PUT /api/assets/:id - Update asset
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const data = updateAssetSchema.parse(request.body);
      const user = request.user as { id: string };

      // If status changed to INSTALLED, set installedBy and installedAt
      const updateData: any = { ...data };
      if (data.status === 'INSTALLED') {
        const existing = await prisma.asset.findUnique({ where: { id } });
        if (existing && existing.status !== 'INSTALLED') {
          updateData.installedById = user.id;
          updateData.installedAt = new Date();
        }
      }

      const asset = await prisma.asset.update({
        where: { id },
        data: updateData,
        include: {
          assetType: true,
          room: { select: { id: true, name: true } },
          installedBy: { select: { id: true, name: true } },
        },
      });

      return reply.send({ asset });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // PUT /api/assets/:id/position - Update asset pin position on room floor plan
  app.put('/:id/position', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const data = updatePositionSchema.parse(request.body);

      const asset = await prisma.asset.update({
        where: { id },
        data: {
          pinX: data.pinX,
          pinY: data.pinY,
        },
        include: {
          assetType: true,
          room: { select: { id: true, name: true } },
        },
      });

      return reply.send({ asset });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // DELETE /api/assets/:id - Delete asset
  app.delete('/:id', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    await prisma.asset.delete({ where: { id } });

    return reply.send({ message: 'Asset deleted' });
  });

  // GET /api/assets/rooms/:roomId - Get assets in room
  app.get('/rooms/:roomId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { roomId } = request.params as { roomId: string };

    const assets = await prisma.asset.findMany({
      where: { roomId },
      include: {
        assetType: true,
        installedBy: { select: { id: true, name: true } },
        _count: { select: { checklists: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ assets });
  });
}
