import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';

const createItemSchema = z.object({
  projectId: z.string(),
  itemType: z.string().min(1),
  description: z.string().min(1),
  unit: z.string().optional(),
});

const updateItemSchema = z.object({
  itemType: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  unit: z.string().optional(),
});

const addLogSchema = z.object({
  action: z.enum(['RECEIVED', 'CONSUMED', 'RETURNED', 'ADJUSTED']),
  quantity: z.number().int().positive(),
  serialNumbers: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function inventoryRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // GET /api/inventory - Get all inventory items
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId, lowStock } = request.query as {
      projectId?: string;
      lowStock?: string;
    };

    const where: any = {};
    if (projectId) where.projectId = projectId;

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { logs: true } },
      },
      orderBy: [
        { itemType: 'asc' },
        { description: 'asc' },
      ],
    });

    // Calculate stock and filter if lowStock requested
    const itemsWithStock = items.map((item) => ({
      ...item,
      currentStock: item.quantityReceived - item.quantityUsed,
    }));

    // Filter low stock items (less than 10% of received or less than 5)
    const result = lowStock === 'true'
      ? itemsWithStock.filter((item) => {
          const threshold = Math.max(5, Math.floor(item.quantityReceived * 0.1));
          return item.currentStock < threshold;
        })
      : itemsWithStock;

    return reply.send({ items: result });
  });

  // GET /api/inventory/:id - Get inventory item by ID with logs
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        logs: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!item) {
      return reply.status(404).send({ error: 'Inventory item not found' });
    }

    const itemWithStock = {
      ...item,
      currentStock: item.quantityReceived - item.quantityUsed,
    };

    return reply.send({ item: itemWithStock });
  });

  // POST /api/inventory - Create inventory item
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createItemSchema.parse(request.body);

      const item = await prisma.inventoryItem.create({
        data: {
          ...data,
          unit: data.unit || 'pcs',
        },
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      const itemWithStock = {
        ...item,
        currentStock: item.quantityReceived - item.quantityUsed,
      };

      return reply.status(201).send({ item: itemWithStock });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // PUT /api/inventory/:id - Update inventory item
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const data = updateItemSchema.parse(request.body);

      const item = await prisma.inventoryItem.update({
        where: { id },
        data,
        include: {
          project: { select: { id: true, name: true } },
        },
      });

      const itemWithStock = {
        ...item,
        currentStock: item.quantityReceived - item.quantityUsed,
      };

      return reply.send({ item: itemWithStock });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // DELETE /api/inventory/:id - Delete inventory item
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    await prisma.inventoryItem.delete({ where: { id } });

    return reply.send({ message: 'Inventory item deleted' });
  });

  // ============================================
  // Inventory Logs (Stock movements)
  // ============================================

  // POST /api/inventory/:id/logs - Add stock movement log
  app.post('/:id/logs', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { id: string };

    try {
      const data = addLogSchema.parse(request.body);

      // Verify item exists
      const item = await prisma.inventoryItem.findUnique({ where: { id } });
      if (!item) {
        return reply.status(404).send({ error: 'Inventory item not found' });
      }

      // Calculate new quantities based on action
      let quantityReceivedDelta = 0;
      let quantityUsedDelta = 0;

      switch (data.action) {
        case 'RECEIVED':
          quantityReceivedDelta = data.quantity;
          break;
        case 'CONSUMED':
          quantityUsedDelta = data.quantity;
          // Check if we have enough stock
          if (item.quantityReceived - item.quantityUsed < data.quantity) {
            return reply.status(400).send({ error: 'Insufficient stock' });
          }
          break;
        case 'RETURNED':
          // Returned items reduce used count
          quantityUsedDelta = -data.quantity;
          break;
        case 'ADJUSTED':
          // Adjustment can be positive (add) or handled specially
          // For simplicity, adjustment adds to received
          quantityReceivedDelta = data.quantity;
          break;
      }

      // Create log and update item in transaction
      const [log, updatedItem] = await prisma.$transaction([
        prisma.inventoryLog.create({
          data: {
            itemId: id,
            action: data.action,
            quantity: data.quantity,
            serialNumbers: data.serialNumbers || [],
            notes: data.notes,
            userId: user.id,
          },
          include: {
            user: { select: { id: true, name: true } },
          },
        }),
        prisma.inventoryItem.update({
          where: { id },
          data: {
            quantityReceived: { increment: quantityReceivedDelta },
            quantityUsed: { increment: quantityUsedDelta },
          },
        }),
      ]);

      return reply.status(201).send({
        log,
        currentStock: updatedItem.quantityReceived - updatedItem.quantityUsed,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // GET /api/inventory/:id/logs - Get logs for an item
  app.get('/:id/logs', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const logs = await prisma.inventoryLog.findMany({
      where: { itemId: id },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ logs });
  });

  // GET /api/inventory/stats - Get inventory statistics
  app.get('/stats/summary', async (_request: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.inventoryItem.findMany();

    const stats = {
      totalItems: items.length,
      totalReceived: items.reduce((sum, i) => sum + i.quantityReceived, 0),
      totalUsed: items.reduce((sum, i) => sum + i.quantityUsed, 0),
      totalInStock: items.reduce((sum, i) => sum + (i.quantityReceived - i.quantityUsed), 0),
      lowStockItems: items.filter((i) => {
        const stock = i.quantityReceived - i.quantityUsed;
        const threshold = Math.max(5, Math.floor(i.quantityReceived * 0.1));
        return stock < threshold && stock >= 0;
      }).length,
      outOfStockItems: items.filter((i) => i.quantityReceived - i.quantityUsed <= 0).length,
    };

    return reply.send({ stats });
  });
}
