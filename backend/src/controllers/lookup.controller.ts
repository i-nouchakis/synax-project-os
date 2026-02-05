import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { sendValidationError } from '../utils/errors.js';

// ============================================
// Schemas
// ============================================

const createRoomTypeSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  order: z.number().int().optional(),
});

const createInventoryUnitSchema = z.object({
  name: z.string().min(1),
  abbreviation: z.string().min(1),
  order: z.number().int().optional(),
});

const createIssueCauseSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().optional(),
});

const createManufacturerSchema = z.object({
  name: z.string().min(1),
  website: z.string().url().optional(),
  order: z.number().int().optional(),
});

const createAssetModelSchema = z.object({
  manufacturerId: z.string(),
  name: z.string().min(1),
  icon: z.string().optional(),
  assetTypeId: z.string().optional(),
  order: z.number().int().optional(),
});

const updateActiveSchema = z.object({
  isActive: z.boolean(),
});

export async function lookupRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // ============================================
  // Room Types
  // ============================================

  // GET /api/lookups/room-types - Get all room types
  app.get('/room-types', async (_request: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.lookupRoomType.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return reply.send({ items });
  });

  // GET /api/lookups/room-types/all - Get all room types (including inactive) - Admin only
  app.get('/room-types/all', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.lookupRoomType.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return reply.send({ items });
  });

  // POST /api/lookups/room-types - Create room type (Admin only)
  app.post('/room-types', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createRoomTypeSchema.parse(request.body);
      const item = await prisma.lookupRoomType.create({ data });
      return reply.status(201).send({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // PUT /api/lookups/room-types/:id - Update room type (Admin only)
  app.put('/room-types/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
      const data = createRoomTypeSchema.partial().parse(request.body);
      const item = await prisma.lookupRoomType.update({ where: { id }, data });
      return reply.send({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/lookups/room-types/:id - Delete room type (Admin only)
  app.delete('/room-types/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await prisma.lookupRoomType.delete({ where: { id } });
    return reply.send({ message: 'Room type deleted' });
  });

  // ============================================
  // Inventory Units
  // ============================================

  // GET /api/lookups/inventory-units - Get all inventory units
  app.get('/inventory-units', async (_request: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.lookupInventoryUnit.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return reply.send({ items });
  });

  // GET /api/lookups/inventory-units/all - Get all (including inactive) - Admin only
  app.get('/inventory-units/all', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.lookupInventoryUnit.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return reply.send({ items });
  });

  // POST /api/lookups/inventory-units - Create (Admin only)
  app.post('/inventory-units', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createInventoryUnitSchema.parse(request.body);
      const item = await prisma.lookupInventoryUnit.create({ data });
      return reply.status(201).send({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // PUT /api/lookups/inventory-units/:id - Update (Admin only)
  app.put('/inventory-units/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
      const data = createInventoryUnitSchema.partial().parse(request.body);
      const item = await prisma.lookupInventoryUnit.update({ where: { id }, data });
      return reply.send({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/lookups/inventory-units/:id - Delete (Admin only)
  app.delete('/inventory-units/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await prisma.lookupInventoryUnit.delete({ where: { id } });
    return reply.send({ message: 'Inventory unit deleted' });
  });

  // ============================================
  // Issue Causes
  // ============================================

  // GET /api/lookups/issue-causes - Get all issue causes
  app.get('/issue-causes', async (_request: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.lookupIssueCause.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return reply.send({ items });
  });

  // GET /api/lookups/issue-causes/all - Get all (including inactive) - Admin only
  app.get('/issue-causes/all', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.lookupIssueCause.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return reply.send({ items });
  });

  // POST /api/lookups/issue-causes - Create (Admin only)
  app.post('/issue-causes', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createIssueCauseSchema.parse(request.body);
      const item = await prisma.lookupIssueCause.create({ data });
      return reply.status(201).send({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // PUT /api/lookups/issue-causes/:id - Update (Admin only)
  app.put('/issue-causes/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
      const data = createIssueCauseSchema.partial().parse(request.body);
      const item = await prisma.lookupIssueCause.update({ where: { id }, data });
      return reply.send({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/lookups/issue-causes/:id - Delete (Admin only)
  app.delete('/issue-causes/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await prisma.lookupIssueCause.delete({ where: { id } });
    return reply.send({ message: 'Issue cause deleted' });
  });

  // ============================================
  // Manufacturers
  // ============================================

  // GET /api/lookups/manufacturers - Get all manufacturers
  app.get('/manufacturers', async (_request: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.lookupManufacturer.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { models: true } },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return reply.send({ items });
  });

  // GET /api/lookups/manufacturers/all - Get all (including inactive) - Admin only
  app.get('/manufacturers/all', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.lookupManufacturer.findMany({
      include: {
        _count: { select: { models: true } },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return reply.send({ items });
  });

  // POST /api/lookups/manufacturers - Create (Admin only)
  app.post('/manufacturers', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createManufacturerSchema.parse(request.body);
      const item = await prisma.lookupManufacturer.create({ data });
      return reply.status(201).send({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // PUT /api/lookups/manufacturers/:id - Update (Admin only)
  app.put('/manufacturers/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
      const data = createManufacturerSchema.partial().parse(request.body);
      const item = await prisma.lookupManufacturer.update({ where: { id }, data });
      return reply.send({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/lookups/manufacturers/:id - Delete (Admin only)
  app.delete('/manufacturers/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await prisma.lookupManufacturer.delete({ where: { id } });
    return reply.send({ message: 'Manufacturer deleted' });
  });

  // ============================================
  // Asset Models
  // ============================================

  // GET /api/lookups/asset-models - Get all asset models
  app.get('/asset-models', async (request: FastifyRequest, reply: FastifyReply) => {
    const { manufacturerId, assetTypeId } = request.query as { manufacturerId?: string; assetTypeId?: string };

    const where: any = { isActive: true };
    if (manufacturerId) where.manufacturerId = manufacturerId;
    if (assetTypeId) where.assetTypeId = assetTypeId;

    const items = await prisma.lookupAssetModel.findMany({
      where,
      include: {
        manufacturer: { select: { id: true, name: true } },
        assetType: { select: { id: true, name: true } },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return reply.send({ items });
  });

  // GET /api/lookups/asset-models/all - Get all (including inactive) - Admin only
  app.get('/asset-models/all', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.lookupAssetModel.findMany({
      include: {
        manufacturer: { select: { id: true, name: true } },
        assetType: { select: { id: true, name: true } },
      },
      orderBy: [{ manufacturer: { name: 'asc' } }, { name: 'asc' }],
    });
    return reply.send({ items });
  });

  // POST /api/lookups/asset-models - Create (Admin only)
  app.post('/asset-models', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createAssetModelSchema.parse(request.body);
      const item = await prisma.lookupAssetModel.create({
        data,
        include: {
          manufacturer: { select: { id: true, name: true } },
          assetType: { select: { id: true, name: true } },
        },
      });
      return reply.status(201).send({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // PUT /api/lookups/asset-models/:id - Update (Admin only)
  app.put('/asset-models/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
      const data = createAssetModelSchema.partial().parse(request.body);
      const item = await prisma.lookupAssetModel.update({
        where: { id },
        data,
        include: {
          manufacturer: { select: { id: true, name: true } },
          assetType: { select: { id: true, name: true } },
        },
      });
      return reply.send({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/lookups/asset-models/:id - Delete (Admin only)
  app.delete('/asset-models/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await prisma.lookupAssetModel.delete({ where: { id } });
    return reply.send({ message: 'Asset model deleted' });
  });

  // ============================================
  // Bulk Toggle Active Status
  // ============================================

  // PATCH /api/lookups/:type/:id/toggle-active - Toggle active status (Admin only)
  app.patch('/:type/:id/toggle-active', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { type, id } = request.params as { type: string; id: string };
    const { isActive } = updateActiveSchema.parse(request.body);

    let item;
    switch (type) {
      case 'room-types':
        item = await prisma.lookupRoomType.update({ where: { id }, data: { isActive } });
        break;
      case 'inventory-units':
        item = await prisma.lookupInventoryUnit.update({ where: { id }, data: { isActive } });
        break;
      case 'issue-causes':
        item = await prisma.lookupIssueCause.update({ where: { id }, data: { isActive } });
        break;
      case 'manufacturers':
        item = await prisma.lookupManufacturer.update({ where: { id }, data: { isActive } });
        break;
      case 'asset-models':
        item = await prisma.lookupAssetModel.update({ where: { id }, data: { isActive } });
        break;
      default:
        return reply.status(400).send({ error: 'Invalid lookup type' });
    }

    return reply.send({ item });
  });
}
