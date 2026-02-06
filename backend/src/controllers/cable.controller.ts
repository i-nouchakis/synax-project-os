import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendValidationError } from '../utils/errors.js';

const CABLE_TYPES = ['ETHERNET', 'FIBER', 'POWER', 'COAXIAL', 'HDMI', 'USB', 'PHONE', 'OTHER'] as const;
const ROUTING_MODES = ['STRAIGHT', 'ORTHOGONAL', 'AUTO', 'CUSTOM'] as const;

const cableInclude = {
  sourceAsset: { select: { id: true, name: true, pinX: true, pinY: true } },
  targetAsset: { select: { id: true, name: true, pinX: true, pinY: true } },
  bundle: { select: { id: true, name: true, color: true } },
};

const createCableSchema = z.object({
  floorId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  sourceAssetId: z.string().optional().nullable(),
  targetAssetId: z.string().optional().nullable(),
  cableType: z.enum(CABLE_TYPES).optional().default('ETHERNET'),
  routingMode: z.enum(ROUTING_MODES).optional().default('STRAIGHT'),
  routingPoints: z.array(z.object({ x: z.number(), y: z.number() })).optional().nullable(),
  label: z.string().max(100).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  bundleId: z.string().optional().nullable(),
});

const updateCableSchema = createCableSchema.partial();

export async function cableRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /api/cables?floorId=...&roomId=...
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { floorId, roomId } = request.query as { floorId?: string; roomId?: string };

    if (!floorId && !roomId) {
      return reply.status(400).send({ error: 'floorId or roomId is required' });
    }

    const where: Record<string, unknown> = {};
    if (floorId) where.floorId = floorId;
    if (roomId) where.roomId = roomId;

    const cables = await prisma.cable.findMany({
      where,
      include: cableInclude,
      orderBy: { createdAt: 'asc' },
    });

    return reply.send({ cables });
  });

  // POST /api/cables
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createCableSchema.parse(request.body);

      if (!data.floorId && !data.roomId) {
        return reply.status(400).send({ error: 'floorId or roomId is required' });
      }

      const cable = await prisma.cable.create({
        data: {
          floorId: data.floorId || null,
          roomId: data.roomId || null,
          sourceAssetId: data.sourceAssetId || null,
          targetAssetId: data.targetAssetId || null,
          cableType: data.cableType,
          routingMode: data.routingMode,
          routingPoints: data.routingPoints || undefined,
          label: data.label || null,
          color: data.color || null,
          bundleId: data.bundleId || null,
        },
        include: cableInclude,
      });

      return reply.status(201).send({ cable });
    } catch (error) {
      if (error instanceof z.ZodError) return sendValidationError(reply, error);
      throw error;
    }
  });

  // PUT /api/cables/:id
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const data = updateCableSchema.parse(request.body);

      const existing = await prisma.cable.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ error: 'Cable not found' });
      }

      const updateData: Record<string, unknown> = {};
      if (data.cableType !== undefined) updateData.cableType = data.cableType;
      if (data.routingMode !== undefined) updateData.routingMode = data.routingMode;
      if (data.routingPoints !== undefined) updateData.routingPoints = data.routingPoints;
      if (data.label !== undefined) updateData.label = data.label;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.sourceAssetId !== undefined) updateData.sourceAssetId = data.sourceAssetId || null;
      if (data.targetAssetId !== undefined) updateData.targetAssetId = data.targetAssetId || null;
      if (data.bundleId !== undefined) updateData.bundleId = data.bundleId || null;

      const cable = await prisma.cable.update({
        where: { id },
        data: updateData,
        include: cableInclude,
      });

      return reply.send({ cable });
    } catch (error) {
      if (error instanceof z.ZodError) return sendValidationError(reply, error);
      throw error;
    }
  });

  // DELETE /api/cables/:id
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.cable.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ error: 'Cable not found' });
    }

    await prisma.cable.delete({ where: { id } });
    return reply.send({ message: 'Cable deleted' });
  });

  // ─── Bundles ─────────────────────────────────────────────

  // GET /api/cables/bundles
  app.get('/bundles', async (_request: FastifyRequest, reply: FastifyReply) => {
    const bundles = await prisma.cableBundle.findMany({
      include: { cables: { select: { id: true } } },
      orderBy: { name: 'asc' },
    });
    return reply.send({ bundles });
  });

  // POST /api/cables/bundles
  app.post('/bundles', async (request: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      color: z.string().max(20).optional(),
    });

    try {
      const data = schema.parse(request.body);
      const bundle = await prisma.cableBundle.create({ data });
      return reply.status(201).send({ bundle });
    } catch (error) {
      if (error instanceof z.ZodError) return sendValidationError(reply, error);
      throw error;
    }
  });
}
