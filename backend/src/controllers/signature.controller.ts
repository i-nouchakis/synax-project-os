import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { sendValidationError } from '../utils/errors.js';

const createSignatureSchema = z.object({
  projectId: z.string(),
  roomId: z.string().optional(),
  type: z.enum(['ROOM_HANDOVER', 'STAGE_COMPLETION', 'FINAL_ACCEPTANCE']),
  signatureData: z.string(), // Base64 PNG
  signedByName: z.string().min(1),
});

export async function signatureRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // GET /api/signatures - Get all signatures (with filters)
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId, roomId, type } = request.query as {
      projectId?: string;
      roomId?: string;
      type?: string;
    };

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (roomId) where.roomId = roomId;
    if (type) where.type = type;

    const signatures = await prisma.signature.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
        signedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { signedAt: 'desc' },
    });

    return reply.send({ signatures });
  });

  // GET /api/signatures/project/:projectId - Get signatures for a project
  app.get('/project/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const signatures = await prisma.signature.findMany({
      where: { projectId },
      include: {
        room: { select: { id: true, name: true } },
        signedBy: { select: { id: true, name: true } },
      },
      orderBy: { signedAt: 'desc' },
    });

    return reply.send({ signatures });
  });

  // GET /api/signatures/room/:roomId - Get signatures for a room
  app.get('/room/:roomId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { roomId } = request.params as { roomId: string };

    const signatures = await prisma.signature.findMany({
      where: { roomId },
      include: {
        signedBy: { select: { id: true, name: true } },
      },
      orderBy: { signedAt: 'desc' },
    });

    return reply.send({ signatures });
  });

  // GET /api/signatures/:id - Get signature by ID
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const signature = await prisma.signature.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        room: {
          select: {
            id: true,
            name: true,
            floor: { select: { id: true, name: true } },
          },
        },
        signedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!signature) {
      return reply.status(404).send({ error: 'Signature not found' });
    }

    return reply.send({ signature });
  });

  // POST /api/signatures - Create new signature
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    try {
      const data = createSignatureSchema.parse(request.body);

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
      });
      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      // Verify room exists if provided
      if (data.roomId) {
        const room = await prisma.room.findUnique({
          where: { id: data.roomId },
        });
        if (!room) {
          return reply.status(404).send({ error: 'Room not found' });
        }
      }

      const signature = await prisma.signature.create({
        data: {
          ...data,
          signedById: user.id,
        },
        include: {
          project: { select: { id: true, name: true } },
          room: { select: { id: true, name: true } },
          signedBy: { select: { id: true, name: true } },
        },
      });

      return reply.status(201).send({ signature });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/signatures/:id - Delete signature (Admin/PM only)
  app.delete('/:id', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const signature = await prisma.signature.findUnique({ where: { id } });
    if (!signature) {
      return reply.status(404).send({ error: 'Signature not found' });
    }

    await prisma.signature.delete({ where: { id } });

    return reply.send({ message: 'Signature deleted' });
  });
}
