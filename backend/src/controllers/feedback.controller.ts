import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { storageService } from '../services/storage.service.js';
import { sendValidationError } from '../utils/errors.js';

const FEEDBACK_TYPES = ['BUG', 'CHANGE'] as const;

const createFeedbackSchema = z.object({
  type: z.enum(FEEDBACK_TYPES),
  description: z.string().min(1, 'Description is required').max(2000),
  pageUrl: z.string().min(1),
});

export async function feedbackRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // POST /api/feedback - Create feedback with optional screenshot
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };
    let screenshotUrl: string | null = null;
    let type = '';
    let description = '';
    let pageUrl = '';

    // Parse multipart (screenshot file + fields)
    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'screenshot') {
        const buffer = await part.toBuffer();
        if (buffer.length > 0) {
          const result = await storageService.uploadImage(buffer, part.filename || 'screenshot.png', 'feedback');
          screenshotUrl = result.url;
        }
      } else if (part.type === 'field') {
        if (part.fieldname === 'type') type = part.value as string;
        if (part.fieldname === 'description') description = part.value as string;
        if (part.fieldname === 'pageUrl') pageUrl = part.value as string;
      }
    }

    const parsed = createFeedbackSchema.safeParse({ type, description, pageUrl });
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }

    const feedback = await prisma.feedback.create({
      data: {
        type: parsed.data.type,
        description: parsed.data.description,
        pageUrl: parsed.data.pageUrl,
        screenshotUrl,
        userId: user.id,
      },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    return reply.status(201).send(feedback);
  });

  // GET /api/feedback - List all feedback (admin only)
  app.get('/', {
    preHandler: requireRole(['ADMIN']),
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { type } = request.query as { type?: string };

    const where: Record<string, unknown> = {};
    if (type && FEEDBACK_TYPES.includes(type as typeof FEEDBACK_TYPES[number])) {
      where.type = type;
    }

    const items = await prisma.feedback.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(items);
  });

  // PUT /api/feedback/:id - Update admin notes / resolved (admin only)
  app.put('/:id', {
    preHandler: requireRole(['ADMIN']),
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { adminNotes?: string; resolved?: boolean; type?: string };

    const feedback = await prisma.feedback.update({
      where: { id },
      data: {
        ...(body.adminNotes !== undefined && { adminNotes: body.adminNotes || null }),
        ...(body.resolved !== undefined && { resolved: body.resolved }),
        ...(body.type && FEEDBACK_TYPES.includes(body.type as typeof FEEDBACK_TYPES[number]) && { type: body.type as typeof FEEDBACK_TYPES[number] }),
      },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    return reply.send(feedback);
  });

  // DELETE /api/feedback/:id - Delete feedback (admin only)
  app.delete('/:id', {
    preHandler: requireRole(['ADMIN']),
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    await prisma.feedback.delete({ where: { id } });

    return reply.send({ success: true });
  });
}
