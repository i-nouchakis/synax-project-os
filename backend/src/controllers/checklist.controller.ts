import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const createChecklistSchema = z.object({
  type: z.enum(['CABLING', 'EQUIPMENT', 'CONFIG', 'DOCUMENTATION']),
  assignedToId: z.string().optional(),
  templateId: z.string().optional(), // Optional: use a single checklist template (legacy)
  templateIds: z.array(z.string()).optional(), // Optional: use multiple templates (items merged)
});

const updateChecklistItemSchema = z.object({
  completed: z.boolean().optional(),
  notes: z.string().optional(),
});

const addPhotoSchema = z.object({
  photoUrl: z.string().url(),
  caption: z.string().optional(),
});

export async function checklistRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // GET /api/checklists - Get all checklists (global view)
  app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    const checklists = await prisma.checklist.findMany({
      include: {
        asset: {
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
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            completed: true,
          },
          orderBy: { order: 'asc' },
        },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return reply.send({ checklists });
  });

  // GET /api/checklists/asset/:assetId - Get all checklists for an asset
  app.get('/asset/:assetId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { assetId } = request.params as { assetId: string };

    const checklists = await prisma.checklist.findMany({
      where: { assetId },
      include: {
        items: {
          include: {
            photos: true,
          },
          orderBy: { order: 'asc' },
        },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { type: 'asc' },
    });

    return reply.send({ checklists });
  });

  // GET /api/checklists/:id - Get checklist by ID
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const checklist = await prisma.checklist.findUnique({
      where: { id },
      include: {
        asset: {
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
          },
        },
        items: {
          include: {
            photos: true,
          },
          orderBy: { order: 'asc' },
        },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (!checklist) {
      return reply.status(404).send({ error: 'Checklist not found' });
    }

    return reply.send({ checklist });
  });

  // POST /api/checklists/asset/:assetId - Create checklist for asset
  app.post('/asset/:assetId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { assetId } = request.params as { assetId: string };

    try {
      const data = createChecklistSchema.parse(request.body);

      // Check if asset exists and get its type template
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        include: { assetType: true },
      });

      if (!asset) {
        return reply.status(404).send({ error: 'Asset not found' });
      }

      // Check if checklist of this type already exists
      const existing = await prisma.checklist.findFirst({
        where: { assetId, type: data.type },
      });

      if (existing) {
        return reply.status(400).send({ error: `Checklist of type ${data.type} already exists for this asset` });
      }

      // Determine items to create
      let itemsToCreate: Array<{
        name: string;
        description?: string;
        requiresPhoto: boolean;
        isRequired: boolean;
        order: number;
        sourceItemId?: string;
      }> = [];
      let templateId: string | undefined;

      // Handle multiple templates (new way) or single template (legacy)
      const templateIdsToUse = data.templateIds || (data.templateId ? [data.templateId] : []);

      if (templateIdsToUse.length > 0) {
        // Fetch all specified templates
        const templates = await prisma.checklistTemplate.findMany({
          where: { id: { in: templateIdsToUse } },
          include: { items: { orderBy: { order: 'asc' } } },
        });

        if (templates.length !== templateIdsToUse.length) {
          const foundIds = templates.map(t => t.id);
          const missingIds = templateIdsToUse.filter(id => !foundIds.includes(id));
          return reply.status(400).send({ error: `Templates not found: ${missingIds.join(', ')}` });
        }

        // If single template, store templateId for sync purposes
        if (templates.length === 1) {
          templateId = templates[0].id;
        }

        // Merge items from all templates, maintaining order
        let currentOrder = 0;
        for (const template of templates) {
          for (const item of template.items) {
            itemsToCreate.push({
              name: item.name,
              description: item.description || undefined,
              requiresPhoto: item.requiresPhoto,
              isRequired: item.isRequired,
              order: currentOrder++,
              sourceItemId: item.id, // Link to template item for sync
            });
          }
        }
      } else {
        // Try to find a default template for this type
        const defaultTemplate = await prisma.checklistTemplate.findFirst({
          where: {
            type: data.type,
            isDefault: true,
            isActive: true,
            OR: [
              { assetTypeId: asset.assetTypeId },
              { assetTypeId: null },
            ],
          },
          include: { items: { orderBy: { order: 'asc' } } },
          orderBy: { assetTypeId: 'desc' }, // Prefer specific asset type templates
        });

        if (defaultTemplate) {
          templateId = defaultTemplate.id;
          itemsToCreate = defaultTemplate.items.map((item) => ({
            name: item.name,
            description: item.description || undefined,
            requiresPhoto: item.requiresPhoto,
            isRequired: item.isRequired,
            order: item.order,
            sourceItemId: item.id,
          }));
        } else {
          // Fallback to old asset type template (legacy)
          const legacyTemplate = asset.assetType?.checklistTemplate as { items?: Array<{ name: string; requiresPhoto?: boolean }> } | null;
          const legacyItems = legacyTemplate?.items || [];
          itemsToCreate = legacyItems.map((item, index) => ({
            name: item.name,
            requiresPhoto: item.requiresPhoto || false,
            isRequired: true,
            order: index,
          }));
        }
      }

      // Create checklist with items
      const checklist = await prisma.checklist.create({
        data: {
          assetId,
          type: data.type,
          assignedToId: data.assignedToId,
          templateId,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
          assignedTo: { select: { id: true, name: true } },
          template: { select: { id: true, name: true } },
        },
      });

      return reply.status(201).send({ checklist });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // POST /api/checklists/asset/:assetId/generate-all - Generate all checklists for asset
  app.post('/asset/:assetId/generate-all', async (request: FastifyRequest, reply: FastifyReply) => {
    const { assetId } = request.params as { assetId: string };

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { assetType: true },
    });

    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' });
    }

    // Get template
    const template = asset.assetType?.checklistTemplate as { items?: Array<{ name: string; requiresPhoto?: boolean }> } | null;
    const templateItems = template?.items || [];

    // Create all 4 checklist types
    const types = ['CABLING', 'EQUIPMENT', 'CONFIG', 'DOCUMENTATION'] as const;
    const createdChecklists = [];

    for (const type of types) {
      // Check if already exists
      const existing = await prisma.checklist.findFirst({
        where: { assetId, type },
      });

      if (!existing) {
        const checklist = await prisma.checklist.create({
          data: {
            assetId,
            type,
            items: {
              create: templateItems.map((item, index) => ({
                name: item.name,
                requiresPhoto: item.requiresPhoto || false,
                order: index,
              })),
            },
          },
          include: {
            items: true,
          },
        });
        createdChecklists.push(checklist);
      }
    }

    // Return all checklists for the asset
    const checklists = await prisma.checklist.findMany({
      where: { assetId },
      include: {
        items: {
          include: { photos: true },
          orderBy: { order: 'asc' },
        },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { type: 'asc' },
    });

    return reply.send({ checklists, created: createdChecklists.length });
  });

  // PUT /api/checklists/:id - Update checklist (assign user, change status)
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { assignedToId, status } = request.body as { assignedToId?: string; status?: string };

    const updateData: any = {};
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
    if (status) updateData.status = status;

    // If completing, set completedAt
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const checklist = await prisma.checklist.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: { photos: true },
          orderBy: { order: 'asc' },
        },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return reply.send({ checklist });
  });

  // PUT /api/checklists/items/:itemId - Update checklist item (complete/uncomplete)
  app.put('/items/:itemId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { itemId } = request.params as { itemId: string };
    const user = request.user as { id: string };

    try {
      const data = updateChecklistItemSchema.parse(request.body);

      const updateData: any = {};

      if (data.completed !== undefined) {
        updateData.completed = data.completed;
        if (data.completed) {
          updateData.completedById = user.id;
          updateData.completedAt = new Date();
        } else {
          updateData.completedById = null;
          updateData.completedAt = null;
        }
      }

      const item = await prisma.checklistItem.update({
        where: { id: itemId },
        data: updateData,
        include: {
          photos: true,
          checklist: true,
        },
      });

      // Update checklist status based on items
      const allItems = await prisma.checklistItem.findMany({
        where: { checklistId: item.checklistId },
      });

      const completedCount = allItems.filter(i => i.completed).length;
      let newStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';

      if (completedCount === allItems.length) {
        newStatus = 'COMPLETED';
      } else if (completedCount > 0) {
        newStatus = 'IN_PROGRESS';
      }

      await prisma.checklist.update({
        where: { id: item.checklistId },
        data: {
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date() : null,
        },
      });

      return reply.send({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // POST /api/checklists/items/:itemId/photos - Add photo to checklist item
  app.post('/items/:itemId/photos', async (request: FastifyRequest, reply: FastifyReply) => {
    const { itemId } = request.params as { itemId: string };

    try {
      const data = addPhotoSchema.parse(request.body);

      // Verify item exists
      const item = await prisma.checklistItem.findUnique({ where: { id: itemId } });
      if (!item) {
        return reply.status(404).send({ error: 'Checklist item not found' });
      }

      const photo = await prisma.checklistPhoto.create({
        data: {
          checklistItemId: itemId,
          photoUrl: data.photoUrl,
          caption: data.caption,
        },
      });

      return reply.status(201).send({ photo });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // DELETE /api/checklists/photos/:photoId - Delete photo (Admin, PM, Technician)
  app.delete('/photos/:photoId', {
    preHandler: [requireRole(['ADMIN', 'PM', 'TECHNICIAN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { photoId } = request.params as { photoId: string };

    await prisma.checklistPhoto.delete({ where: { id: photoId } });

    return reply.send({ message: 'Photo deleted' });
  });

  // DELETE /api/checklists/:id - Delete checklist (Admin, PM only)
  app.delete('/:id', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    await prisma.checklist.delete({ where: { id } });

    return reply.send({ message: 'Checklist deleted' });
  });
}
