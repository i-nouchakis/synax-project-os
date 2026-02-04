import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const createBuildingSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateBuildingSchema = createBuildingSchema.partial();

export async function buildingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /api/buildings - List all buildings (with optional projectId filter)
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.query as { projectId?: string };

    const buildings = await prisma.building.findMany({
      where: projectId ? { projectId } : {},
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { floors: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return reply.send({ buildings });
  });

  // GET /api/buildings/project/:projectId - Get buildings for a project
  app.get('/project/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const buildings = await prisma.building.findMany({
      where: { projectId },
      include: {
        _count: { select: { floors: true } },
        floors: {
          include: {
            _count: { select: { rooms: true } },
          },
          orderBy: { level: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return reply.send({ buildings });
  });

  // GET /api/buildings/:id - Get building details
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        floors: {
          include: {
            _count: { select: { rooms: true } },
          },
          orderBy: { level: 'asc' },
        },
        _count: { select: { floors: true } },
      },
    });

    if (!building) {
      return reply.status(404).send({ error: 'Building not found' });
    }

    return reply.send({ building });
  });

  // POST /api/buildings/project/:projectId - Create building
  app.post(
    '/project/:projectId',
    { preHandler: requireRole(['ADMIN', 'PM']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { projectId } = request.params as { projectId: string };
      const data = createBuildingSchema.parse(request.body);

      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      const building = await prisma.building.create({
        data: {
          ...data,
          projectId,
        },
        include: {
          _count: { select: { floors: true } },
        },
      });

      return reply.status(201).send({ building });
    }
  );

  // PUT /api/buildings/:id - Update building
  app.put(
    '/:id',
    { preHandler: requireRole(['ADMIN', 'PM']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const data = updateBuildingSchema.parse(request.body);

      const building = await prisma.building.update({
        where: { id },
        data,
        include: {
          _count: { select: { floors: true } },
        },
      });

      return reply.send({ building });
    }
  );

  // PUT /api/buildings/:id/position - Update building position on masterplan
  app.put(
    '/:id/position',
    { preHandler: requireRole(['ADMIN', 'PM']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const { pinX, pinY } = request.body as { pinX: number | null; pinY: number | null };

      const building = await prisma.building.update({
        where: { id },
        data: { pinX, pinY },
        include: {
          _count: { select: { floors: true } },
        },
      });

      return reply.send({ building });
    }
  );

  // DELETE /api/buildings/:id - Delete building
  app.delete(
    '/:id',
    { preHandler: requireRole(['ADMIN', 'PM']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      await prisma.building.delete({ where: { id } });

      return reply.send({ success: true });
    }
  );
}
