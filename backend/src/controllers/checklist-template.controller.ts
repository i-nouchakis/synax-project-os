import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { sendValidationError } from '../utils/errors.js';

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['GENERAL', 'CABLING', 'EQUIPMENT', 'CONFIG', 'DOCUMENTATION']),
  assetTypeId: z.string().optional(),
  isDefault: z.boolean().optional(),
  items: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    requiresPhoto: z.boolean().optional(),
    isRequired: z.boolean().optional(),
    order: z.number().optional(),
  })).optional(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['GENERAL', 'CABLING', 'EQUIPMENT', 'CONFIG', 'DOCUMENTATION']).optional(),
  assetTypeId: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const createTemplateItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  requiresPhoto: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  order: z.number().optional(),
});

const updateTemplateItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  requiresPhoto: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  order: z.number().optional(),
});

export async function checklistTemplateRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // GET /api/checklist-templates - Get all templates
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { type, assetTypeId, activeOnly } = request.query as {
      type?: string;
      assetTypeId?: string;
      activeOnly?: string;
    };

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (assetTypeId) {
      where.OR = [
        { assetTypeId },
        { assetTypeId: null }, // Also include general templates
      ];
    }

    if (activeOnly === 'true') {
      where.isActive = true;
    }

    const templates = await prisma.checklistTemplate.findMany({
      where,
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
        assetType: {
          select: { id: true, name: true },
        },
        _count: {
          select: { checklists: true },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    return reply.send({ templates });
  });

  // GET /api/checklist-templates/:id - Get template by ID
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const template = await prisma.checklistTemplate.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
        assetType: {
          select: { id: true, name: true },
        },
        _count: {
          select: { checklists: true },
        },
      },
    });

    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    return reply.send({ template });
  });

  // POST /api/checklist-templates - Create template (Admin, PM only)
  app.post('/', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createTemplateSchema.parse(request.body);

      // If setting as default, unset other defaults for same type/assetType
      if (data.isDefault) {
        await prisma.checklistTemplate.updateMany({
          where: {
            type: data.type,
            assetTypeId: data.assetTypeId || null,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      const template = await prisma.checklistTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          assetTypeId: data.assetTypeId,
          isDefault: data.isDefault || false,
          items: data.items ? {
            create: data.items.map((item, index) => ({
              name: item.name,
              description: item.description,
              requiresPhoto: item.requiresPhoto || false,
              isRequired: item.isRequired !== false,
              order: item.order ?? index,
            })),
          } : undefined,
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
          assetType: {
            select: { id: true, name: true },
          },
        },
      });

      return reply.status(201).send({ template });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // PUT /api/checklist-templates/:id - Update template (Admin, PM only)
  app.put('/:id', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const data = updateTemplateSchema.parse(request.body);

      // Check template exists
      const existing = await prisma.checklistTemplate.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Template not found' });
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await prisma.checklistTemplate.updateMany({
          where: {
            type: data.type || existing.type,
            assetTypeId: data.assetTypeId !== undefined ? data.assetTypeId : existing.assetTypeId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      const template = await prisma.checklistTemplate.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          assetTypeId: data.assetTypeId,
          isDefault: data.isDefault,
          isActive: data.isActive,
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
          assetType: {
            select: { id: true, name: true },
          },
        },
      });

      return reply.send({ template });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/checklist-templates/:id - Delete template (Admin only)
  app.delete('/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    // Check if template is used by any checklists
    const usageCount = await prisma.checklist.count({
      where: { templateId: id },
    });

    if (usageCount > 0) {
      // Soft delete - just deactivate
      await prisma.checklistTemplate.update({
        where: { id },
        data: { isActive: false },
      });
      return reply.send({ message: 'Template deactivated (in use by checklists)', deactivated: true });
    }

    await prisma.checklistTemplate.delete({ where: { id } });
    return reply.send({ message: 'Template deleted' });
  });

  // ============================================
  // Template Items
  // ============================================

  // POST /api/checklist-templates/:id/items - Add item to template
  app.post('/:id/items', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const data = createTemplateItemSchema.parse(request.body);

      // Check template exists
      const template = await prisma.checklistTemplate.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!template) {
        return reply.status(404).send({ error: 'Template not found' });
      }

      // Get max order
      const maxOrder = template.items.reduce((max, item) => Math.max(max, item.order), -1);

      // Create template item
      const item = await prisma.checklistTemplateItem.create({
        data: {
          templateId: id,
          name: data.name,
          description: data.description,
          requiresPhoto: data.requiresPhoto || false,
          isRequired: data.isRequired !== false,
          order: data.order ?? maxOrder + 1,
        },
      });

      // AUTO-SYNC: Add item to all linked checklists
      const linkedChecklists = await prisma.checklist.findMany({
        where: { templateId: id },
        select: { id: true },
      });

      if (linkedChecklists.length > 0) {
        await prisma.checklistItem.createMany({
          data: linkedChecklists.map(checklist => ({
            checklistId: checklist.id,
            name: item.name,
            description: item.description,
            requiresPhoto: item.requiresPhoto,
            isRequired: item.isRequired,
            order: item.order,
            sourceItemId: item.id,
            completed: false,
          })),
        });
      }

      return reply.status(201).send({ item, syncedChecklists: linkedChecklists.length });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // PUT /api/checklist-templates/items/:itemId - Update template item
  app.put('/items/:itemId', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { itemId } = request.params as { itemId: string };

    try {
      const data = updateTemplateItemSchema.parse(request.body);

      // Get existing item
      const existing = await prisma.checklistTemplateItem.findUnique({
        where: { id: itemId },
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Template item not found' });
      }

      // Update template item
      const item = await prisma.checklistTemplateItem.update({
        where: { id: itemId },
        data: {
          name: data.name,
          description: data.description,
          requiresPhoto: data.requiresPhoto,
          isRequired: data.isRequired,
          order: data.order,
        },
      });

      // AUTO-SYNC: Update linked checklist items (only uncompleted ones)
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.requiresPhoto !== undefined) updateData.requiresPhoto = data.requiresPhoto;
      if (data.isRequired !== undefined) updateData.isRequired = data.isRequired;
      if (data.order !== undefined) updateData.order = data.order;

      const syncResult = await prisma.checklistItem.updateMany({
        where: {
          sourceItemId: itemId,
          completed: false, // Only update uncompleted items
          isArchived: false,
        },
        data: updateData,
      });

      return reply.send({ item, syncedItems: syncResult.count });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/checklist-templates/items/:itemId - Delete template item (soft delete in linked checklists)
  app.delete('/items/:itemId', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { itemId } = request.params as { itemId: string };

    // Get existing item
    const existing = await prisma.checklistTemplateItem.findUnique({
      where: { id: itemId },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Template item not found' });
    }

    // AUTO-SYNC: Soft delete (archive) linked checklist items
    const archiveResult = await prisma.checklistItem.updateMany({
      where: {
        sourceItemId: itemId,
      },
      data: {
        isArchived: true,
      },
    });

    // Delete the template item
    await prisma.checklistTemplateItem.delete({
      where: { id: itemId },
    });

    return reply.send({ message: 'Template item deleted', archivedItems: archiveResult.count });
  });

  // POST /api/checklist-templates/items/reorder - Reorder template items
  app.post('/items/reorder', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { items } = request.body as { items: Array<{ id: string; order: number }> };

    if (!items || !Array.isArray(items)) {
      return reply.status(400).send({ error: 'Items array required' });
    }

    // Update each item's order
    await Promise.all(
      items.map(item =>
        prisma.checklistTemplateItem.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return reply.send({ message: 'Items reordered', count: items.length });
  });
}
