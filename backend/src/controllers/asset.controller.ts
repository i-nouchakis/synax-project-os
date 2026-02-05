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

// Schema for bulk equipment creation in project inventory
const createBulkEquipmentSchema = z.object({
  namePrefix: z.string().min(1),
  quantity: z.number().min(1).max(100).default(1),
  startNumber: z.number().min(0).default(1),
  assetTypeId: z.string().optional(),
  model: z.string().optional(),
  notes: z.string().optional(),
  // Optional array of serial numbers (if provided, must match quantity)
  serials: z.array(z.object({
    serialNumber: z.string().optional(),
    macAddress: z.string().optional(),
  })).optional(),
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
        floor: {
          include: {
            building: {
              include: {
                project: { select: { id: true, name: true } },
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

  // POST /api/assets/types - Create asset type
  app.post('/types', async (request: FastifyRequest, reply: FastifyReply) => {
    const { name, icon } = request.body as { name: string; icon?: string };

    if (!name) {
      return reply.status(400).send({ error: 'Name is required' });
    }

    // Check if already exists
    const existing = await prisma.assetType.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existing) {
      return reply.status(400).send({ error: 'Asset type already exists' });
    }

    const assetType = await prisma.assetType.create({
      data: { name, icon },
      include: {
        _count: { select: { assets: true } },
      },
    });

    return reply.status(201).send({ assetType });
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
        floor: {
          include: {
            building: {
              include: {
                project: { select: { id: true, name: true } },
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
        floor: {
          include: {
            building: {
              include: {
                project: { select: { id: true, name: true } },
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
        floor: {
          include: {
            building: {
              include: {
                project: { select: { id: true, name: true } },
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

      // Verify room exists and get projectId
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { floor: { include: { building: { select: { projectId: true } } } } },
      });
      if (!room) {
        return reply.status(404).send({ error: 'Room not found' });
      }

      const asset = await prisma.asset.create({
        data: {
          roomId,
          projectId: room.floor.building.projectId,
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

  // GET /api/assets/floors/:floorId - Get assets directly in floor (not in rooms)
  app.get('/floors/:floorId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { floorId } = request.params as { floorId: string };

    const assets = await prisma.asset.findMany({
      where: { floorId, roomId: null },
      include: {
        assetType: true,
        installedBy: { select: { id: true, name: true } },
        _count: { select: { checklists: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ assets });
  });

  // POST /api/assets/floors/:floorId - Create asset directly in floor
  app.post('/floors/:floorId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { floorId } = request.params as { floorId: string };

    try {
      const data = createAssetSchema.parse(request.body);

      // Verify floor exists and get projectId
      const floor = await prisma.floor.findUnique({
        where: { id: floorId },
        include: { building: { select: { projectId: true } } },
      });
      if (!floor) {
        return reply.status(404).send({ error: 'Floor not found' });
      }

      const asset = await prisma.asset.create({
        data: {
          floorId,
          roomId: null,
          projectId: floor.building.projectId,
          ...data,
        },
        include: {
          assetType: true,
          floor: { select: { id: true, name: true } },
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

  // ============================================
  // PROJECT EQUIPMENT (INVENTORY) ENDPOINTS
  // ============================================

  // GET /api/assets/projects/:projectId - Get all equipment for a project
  app.get('/projects/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { status } = request.query as { status?: string };

    const where: any = { projectId };
    if (status) {
      where.status = status;
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        assetType: true,
        room: { select: { id: true, name: true } },
        floor: { select: { id: true, name: true } },
        installedBy: { select: { id: true, name: true } },
        _count: { select: { checklists: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ assets });
  });

  // GET /api/assets/projects/:projectId/available - Get available equipment (IN_STOCK, not assigned to room/floor)
  app.get('/projects/:projectId/available', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const assets = await prisma.asset.findMany({
      where: {
        projectId,
        status: 'IN_STOCK',
        roomId: null,
        floorId: null,
      },
      include: {
        assetType: true,
        _count: { select: { checklists: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ assets });
  });

  // POST /api/assets/projects/:projectId - Create asset in project inventory (single)
  app.post('/projects/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    try {
      const data = createAssetSchema.parse(request.body);

      // Verify project exists
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      const asset = await prisma.asset.create({
        data: {
          projectId,
          status: 'IN_STOCK',
          ...data,
        },
        include: {
          assetType: true,
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

  // POST /api/assets/projects/:projectId/bulk - Create multiple assets in project inventory
  app.post('/projects/:projectId/bulk', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    try {
      const data = createBulkEquipmentSchema.parse(request.body);

      // Verify project exists
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      // Validate serials array length if provided
      if (data.serials && data.serials.length !== data.quantity) {
        return reply.status(400).send({
          error: `Serials array length (${data.serials.length}) must match quantity (${data.quantity})`
        });
      }

      // Generate assets
      const assetsToCreate = [];
      for (let i = 0; i < data.quantity; i++) {
        const sequenceNum = data.startNumber + i;
        const paddedNum = sequenceNum.toString().padStart(3, '0');
        const name = `${data.namePrefix}-${paddedNum}`;

        assetsToCreate.push({
          name,
          projectId,
          status: 'IN_STOCK' as const,
          assetTypeId: data.assetTypeId,
          model: data.model,
          notes: data.notes,
          serialNumber: data.serials?.[i]?.serialNumber || undefined,
          macAddress: data.serials?.[i]?.macAddress || undefined,
        });
      }

      // Create all assets in a transaction
      const createdAssets = await prisma.$transaction(
        assetsToCreate.map(assetData =>
          prisma.asset.create({
            data: assetData,
            include: { assetType: true },
          })
        )
      );

      return reply.status(201).send({
        assets: createdAssets,
        count: createdAssets.length,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // PUT /api/assets/:id/assign - Assign asset to room with optional pin position
  app.put('/:id/assign', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { roomId, floorId, pinX, pinY } = request.body as {
      roomId?: string;
      floorId?: string;
      pinX?: number;
      pinY?: number;
    };

    if (!roomId && !floorId) {
      return reply.status(400).send({ error: 'Either roomId or floorId is required' });
    }

    // Verify asset exists
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' });
    }

    // Build update data
    const updateData: any = {};

    if (roomId) {
      // Verify room exists and get projectId for validation
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { floor: { include: { building: true } } },
      });
      if (!room) {
        return reply.status(404).send({ error: 'Room not found' });
      }
      // Validate asset belongs to same project
      if (asset.projectId && asset.projectId !== room.floor.building.projectId) {
        return reply.status(400).send({ error: 'Asset belongs to a different project' });
      }
      updateData.roomId = roomId;
      updateData.floorId = null; // Clear floor assignment when assigning to room
    } else if (floorId) {
      // Verify floor exists
      const floor = await prisma.floor.findUnique({
        where: { id: floorId },
        include: { building: true },
      });
      if (!floor) {
        return reply.status(404).send({ error: 'Floor not found' });
      }
      // Validate asset belongs to same project
      if (asset.projectId && asset.projectId !== floor.building.projectId) {
        return reply.status(400).send({ error: 'Asset belongs to a different project' });
      }
      updateData.floorId = floorId;
      updateData.roomId = null; // Clear room assignment when assigning to floor
    }

    // Set pin position if provided
    if (pinX !== undefined) updateData.pinX = pinX;
    if (pinY !== undefined) updateData.pinY = pinY;

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: updateData,
      include: {
        assetType: true,
        room: { select: { id: true, name: true } },
        floor: { select: { id: true, name: true } },
        installedBy: { select: { id: true, name: true } },
      },
    });

    return reply.send({ asset: updatedAsset });
  });
}
