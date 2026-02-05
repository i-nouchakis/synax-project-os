import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { sendValidationError } from '../utils/errors.js';

// ============================================
// Schemas
// ============================================

const createLabelSchema = z.object({
  code: z.string().min(1),
  type: z.enum(['CABLE', 'RACK', 'ASSET', 'ROOM']).default('ASSET'),
});

const createBatchSchema = z.object({
  type: z.enum(['CABLE', 'RACK', 'ASSET', 'ROOM']).default('ASSET'),
  prefix: z.string().min(1),
  startNumber: z.number().int().min(1),
  count: z.number().int().min(1).max(100),
  padding: z.number().int().min(1).max(6).default(4),
});

export async function labelRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // ============================================
  // GET /api/labels/project/:projectId - Get all labels for project
  // ============================================
  app.get('/project/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const labels = await prisma.label.findMany({
      where: { projectId },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: [{ code: 'asc' }],
    });

    return reply.send({ labels });
  });

  // ============================================
  // GET /api/labels/project/:projectId/available - Get available labels
  // ============================================
  app.get('/project/:projectId/available', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const labels = await prisma.label.findMany({
      where: {
        projectId,
        status: { in: ['AVAILABLE', 'PRINTED'] },
        assetId: null,
      },
      orderBy: [{ code: 'asc' }],
    });

    return reply.send({ labels });
  });

  // ============================================
  // POST /api/labels/project/:projectId - Create single label
  // ============================================
  app.post('/project/:projectId', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    try {
      const data = createLabelSchema.parse(request.body);

      // Check if code already exists
      const existing = await prisma.label.findUnique({
        where: { code: data.code },
      });

      if (existing) {
        return reply.status(400).send({ error: 'Label code already exists' });
      }

      const label = await prisma.label.create({
        data: {
          projectId,
          code: data.code,
          type: data.type,
          status: 'AVAILABLE',
        },
      });

      return reply.status(201).send({ label });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // ============================================
  // POST /api/labels/project/:projectId/batch - Generate batch of labels
  // ============================================
  app.post('/project/:projectId/batch', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    try {
      const data = createBatchSchema.parse(request.body);
      const { type, prefix, startNumber, count, padding } = data;

      // Generate label codes
      const codes: string[] = [];
      for (let i = 0; i < count; i++) {
        const num = startNumber + i;
        const paddedNum = num.toString().padStart(padding, '0');
        codes.push(`${prefix}-${paddedNum}`);
      }

      // Check for existing codes
      const existingLabels = await prisma.label.findMany({
        where: { code: { in: codes } },
        select: { code: true },
      });

      const existingCodes = new Set(existingLabels.map(l => l.code));
      const newCodes = codes.filter(c => !existingCodes.has(c));

      if (newCodes.length === 0) {
        return reply.status(400).send({
          error: 'All label codes already exist',
          existingCodes: Array.from(existingCodes),
        });
      }

      // Create labels
      const labels = await prisma.label.createMany({
        data: newCodes.map(code => ({
          projectId,
          code,
          type,
          status: 'AVAILABLE' as const,
        })),
      });

      // Fetch created labels
      const createdLabels = await prisma.label.findMany({
        where: {
          projectId,
          code: { in: newCodes },
        },
        orderBy: [{ code: 'asc' }],
      });

      return reply.status(201).send({
        labels: createdLabels,
        created: newCodes.length,
        skipped: existingCodes.size,
        skippedCodes: Array.from(existingCodes),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // ============================================
  // PUT /api/labels/:id/assign/:assetId - Assign label to asset
  // ============================================
  app.put('/:id/assign/:assetId', {
    preHandler: [requireRole(['ADMIN', 'PM', 'TECHNICIAN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id, assetId } = request.params as { id: string; assetId: string };

    // Check if label exists
    const label = await prisma.label.findUnique({ where: { id } });
    if (!label) {
      return reply.status(404).send({ error: 'Label not found' });
    }

    // Check if label is already assigned to another asset
    if (label.assetId && label.assetId !== assetId) {
      return reply.status(400).send({ error: 'Label is already assigned to another asset' });
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' });
    }

    // Check if asset already has a different label
    const existingLabel = await prisma.label.findUnique({
      where: { assetId },
    });
    if (existingLabel && existingLabel.id !== id) {
      // Unassign the old label
      await prisma.label.update({
        where: { id: existingLabel.id },
        data: {
          assetId: null,
          status: existingLabel.printedAt ? 'PRINTED' : 'AVAILABLE',
          assignedAt: null,
        },
      });
    }

    // Assign label to asset
    const updatedLabel = await prisma.label.update({
      where: { id },
      data: {
        assetId,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    // Update asset's labelCode field
    await prisma.asset.update({
      where: { id: assetId },
      data: { labelCode: label.code },
    });

    return reply.send({ label: updatedLabel });
  });

  // ============================================
  // PUT /api/labels/:id/unassign - Remove label from asset
  // ============================================
  app.put('/:id/unassign', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const label = await prisma.label.findUnique({ where: { id } });
    if (!label) {
      return reply.status(404).send({ error: 'Label not found' });
    }

    // Clear asset's labelCode if it was set
    if (label.assetId) {
      await prisma.asset.update({
        where: { id: label.assetId },
        data: { labelCode: null },
      });
    }

    const updatedLabel = await prisma.label.update({
      where: { id },
      data: {
        assetId: null,
        status: label.printedAt ? 'PRINTED' : 'AVAILABLE',
        assignedAt: null,
      },
    });

    return reply.send({ label: updatedLabel });
  });

  // ============================================
  // PUT /api/labels/:id/mark-printed - Mark label as printed
  // ============================================
  app.put('/:id/mark-printed', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const label = await prisma.label.findUnique({ where: { id } });
    if (!label) {
      return reply.status(404).send({ error: 'Label not found' });
    }

    // Only update if not already assigned
    const newStatus = label.status === 'ASSIGNED' ? 'ASSIGNED' : 'PRINTED';

    const updatedLabel = await prisma.label.update({
      where: { id },
      data: {
        status: newStatus,
        printedAt: new Date(),
      },
    });

    return reply.send({ label: updatedLabel });
  });

  // ============================================
  // PUT /api/labels/mark-printed-batch - Mark multiple labels as printed
  // ============================================
  app.put('/mark-printed-batch', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { ids } = request.body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({ error: 'ids array is required' });
    }

    // Update labels that are not assigned
    await prisma.label.updateMany({
      where: {
        id: { in: ids },
        status: { not: 'ASSIGNED' },
      },
      data: {
        status: 'PRINTED',
        printedAt: new Date(),
      },
    });

    // Also update the printedAt for assigned labels (but keep status as ASSIGNED)
    await prisma.label.updateMany({
      where: {
        id: { in: ids },
        status: 'ASSIGNED',
      },
      data: {
        printedAt: new Date(),
      },
    });

    const labels = await prisma.label.findMany({
      where: { id: { in: ids } },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return reply.send({ labels });
  });

  // ============================================
  // DELETE /api/labels/:id - Delete label (only if not assigned)
  // ============================================
  app.delete('/:id', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const label = await prisma.label.findUnique({ where: { id } });
    if (!label) {
      return reply.status(404).send({ error: 'Label not found' });
    }

    if (label.status === 'ASSIGNED') {
      return reply.status(400).send({ error: 'Cannot delete assigned label. Unassign it first.' });
    }

    await prisma.label.delete({ where: { id } });

    return reply.send({ success: true });
  });

  // ============================================
  // DELETE /api/labels/batch - Delete multiple labels (only if not assigned)
  // ============================================
  app.delete('/batch', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { ids } = request.body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({ error: 'ids array is required' });
    }

    // Check if any are assigned
    const assignedLabels = await prisma.label.findMany({
      where: {
        id: { in: ids },
        status: 'ASSIGNED',
      },
      select: { id: true, code: true },
    });

    if (assignedLabels.length > 0) {
      return reply.status(400).send({
        error: 'Cannot delete assigned labels',
        assignedLabels: assignedLabels.map(l => l.code),
      });
    }

    const result = await prisma.label.deleteMany({
      where: { id: { in: ids } },
    });

    return reply.send({ deleted: result.count });
  });
}
