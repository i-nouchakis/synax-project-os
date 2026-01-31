import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  clientName: z.string().min(2),
  location: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional(),
});

export async function projectRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // GET /api/projects - List projects
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };

    // Admins and PMs see all projects, others see only assigned
    const where = ['ADMIN', 'PM'].includes(user.role)
      ? {}
      : { members: { some: { userId: user.id } } };

    const projects = await prisma.project.findMany({
      where,
      include: {
        _count: {
          select: {
            floors: true,
            issues: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ projects });
  });

  // GET /api/projects/:id - Get project details
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        floors: {
          include: {
            _count: { select: { rooms: true } },
          },
          orderBy: { level: 'asc' },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true, avatar: true },
            },
          },
        },
        _count: {
          select: { issues: true, inventory: true, signatures: true },
        },
      },
    });

    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    return reply.send({ project });
  });

  // POST /api/projects - Create project (Admin, PM only)
  app.post('/', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createProjectSchema.parse(request.body);
      const user = request.user as { id: string };

      const project = await prisma.project.create({
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          members: {
            create: {
              userId: user.id,
              role: 'PM',
            },
          },
        },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      return reply.status(201).send({ project });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // PUT /api/projects/:id - Update project
  app.put('/:id', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
      const data = updateProjectSchema.parse(request.body);

      const project = await prisma.project.update({
        where: { id },
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
      });

      return reply.send({ project });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  });

  // DELETE /api/projects/:id - Delete project (Admin only)
  app.delete('/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    await prisma.project.delete({ where: { id } });

    return reply.send({ message: 'Project deleted' });
  });

  // POST /api/projects/:id/members - Add member to project
  app.post('/:id/members', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { userId, role = 'TECHNICIAN' } = request.body as { userId: string; role?: string };

    const member = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId,
        role: role as any,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return reply.status(201).send({ member });
  });

  // DELETE /api/projects/:id/members/:userId - Remove member
  app.delete('/:id/members/:userId', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id, userId } = request.params as { id: string; userId: string };

    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId: id, userId },
      },
    });

    return reply.send({ message: 'Member removed' });
  });
}
