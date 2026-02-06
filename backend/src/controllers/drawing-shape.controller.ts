import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendValidationError } from '../utils/errors.js';

const SHAPE_TYPES = ['RECTANGLE', 'CIRCLE', 'LINE', 'ARROW', 'TEXT', 'FREEHAND', 'POLYGON'] as const;

const createShapeSchema = z.object({
  floorId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  type: z.enum(SHAPE_TYPES),
  layer: z.string().optional().default('default'),
  zIndex: z.number().optional().default(0),
  data: z.record(z.unknown()),
  style: z.record(z.unknown()).optional().default({}),
});

const updateShapeSchema = z.object({
  type: z.enum(SHAPE_TYPES).optional(),
  layer: z.string().optional(),
  zIndex: z.number().optional(),
  locked: z.boolean().optional(),
  visible: z.boolean().optional(),
  data: z.record(z.unknown()).optional(),
  style: z.record(z.unknown()).optional(),
});

export async function drawingShapeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /api/shapes?floorId=...&roomId=...
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { floorId, roomId } = request.query as { floorId?: string; roomId?: string };

    if (!floorId && !roomId) {
      return reply.status(400).send({ error: 'floorId or roomId is required' });
    }

    const where: Record<string, unknown> = {};
    if (floorId) where.floorId = floorId;
    if (roomId) where.roomId = roomId;

    const shapes = await prisma.drawingShape.findMany({
      where,
      orderBy: { zIndex: 'asc' },
    });

    return reply.send({ shapes });
  });

  // POST /api/shapes
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createShapeSchema.parse(request.body);

      if (!data.floorId && !data.roomId) {
        return reply.status(400).send({ error: 'floorId or roomId is required' });
      }

      const shape = await prisma.drawingShape.create({
        data: {
          floorId: data.floorId || null,
          roomId: data.roomId || null,
          type: data.type,
          layer: data.layer,
          zIndex: data.zIndex,
          data: data.data as Prisma.InputJsonValue,
          style: data.style as Prisma.InputJsonValue,
        },
      });

      return reply.status(201).send({ shape });
    } catch (error) {
      if (error instanceof z.ZodError) return sendValidationError(reply, error);
      throw error;
    }
  });

  // POST /api/shapes/batch - Create multiple shapes at once
  app.post('/batch', async (request: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      shapes: z.array(createShapeSchema).min(1).max(100),
    });

    try {
      const { shapes: shapesData } = schema.parse(request.body);

      const shapes = await prisma.$transaction(
        shapesData.map((s) =>
          prisma.drawingShape.create({
            data: {
              floorId: s.floorId || null,
              roomId: s.roomId || null,
              type: s.type,
              layer: s.layer,
              zIndex: s.zIndex,
              data: s.data as Prisma.InputJsonValue,
              style: s.style as Prisma.InputJsonValue,
            },
          })
        )
      );

      return reply.status(201).send({ shapes });
    } catch (error) {
      if (error instanceof z.ZodError) return sendValidationError(reply, error);
      throw error;
    }
  });

  // PUT /api/shapes/:id
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const data = updateShapeSchema.parse(request.body);

      const existing = await prisma.drawingShape.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ error: 'Shape not found' });
      }

      const updateData: Record<string, unknown> = { ...data };
      if (data.data) updateData.data = data.data as Prisma.InputJsonValue;
      if (data.style) updateData.style = data.style as Prisma.InputJsonValue;

      const shape = await prisma.drawingShape.update({
        where: { id },
        data: updateData,
      });

      return reply.send({ shape });
    } catch (error) {
      if (error instanceof z.ZodError) return sendValidationError(reply, error);
      throw error;
    }
  });

  // DELETE /api/shapes/:id
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.drawingShape.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Shape not found' });
    }

    await prisma.drawingShape.delete({ where: { id } });
    return reply.send({ message: 'Shape deleted' });
  });

  // DELETE /api/shapes/batch - Delete multiple
  app.post('/batch-delete', async (request: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({ ids: z.array(z.string()).min(1) });

    try {
      const { ids } = schema.parse(request.body);
      await prisma.drawingShape.deleteMany({ where: { id: { in: ids } } });
      return reply.send({ message: `${ids.length} shapes deleted` });
    } catch (error) {
      if (error instanceof z.ZodError) return sendValidationError(reply, error);
      throw error;
    }
  });
}
