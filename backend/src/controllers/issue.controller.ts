import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { sendValidationError } from '../utils/errors.js';
import { createNotificationsForUsers } from '../utils/notifications.js';

const createIssueSchema = z.object({
  projectId: z.string(),
  roomId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  causedBy: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

const updateIssueSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  causedBy: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
});

const addCommentSchema = z.object({
  comment: z.string().min(1),
});

const addPhotoSchema = z.object({
  photoUrl: z.string().url(),
  caption: z.string().optional(),
});

export async function issueRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // GET /api/issues - Get all issues
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId, roomId, status, priority } = request.query as {
      projectId?: string;
      roomId?: string;
      status?: string;
      priority?: string;
    };

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (roomId) where.roomId = roomId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const issues = await prisma.issue.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        room: {
          select: {
            id: true,
            name: true,
            floor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        photos: true,
        _count: { select: { comments: true } },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return reply.send({ issues });
  });

  // GET /api/issues/:id - Get issue by ID
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        room: {
          select: {
            id: true,
            name: true,
            floor: {
              select: {
                id: true,
                name: true,
                building: {
                  select: {
                    id: true,
                    name: true,
                    project: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        photos: {
          orderBy: { uploadedAt: 'desc' },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!issue) {
      return reply.status(404).send({ error: 'Issue not found' });
    }

    return reply.send({ issue });
  });

  // POST /api/issues - Create issue
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    try {
      const data = createIssueSchema.parse(request.body);

      const issue = await prisma.issue.create({
        data: {
          ...data,
          createdById: user.id,
        },
        include: {
          project: { select: { id: true, name: true } },
          room: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          photos: true,
          _count: { select: { comments: true } },
        },
      });

      // Notify project members about new issue (async, don't block response)
      const members = await prisma.projectMember.findMany({
        where: { projectId: data.projectId },
        select: { userId: true },
      });
      createNotificationsForUsers(
        members.map(m => m.userId),
        'ISSUE_CREATED',
        'New Issue Created',
        `${issue.title} - ${issue.project.name}`,
        `/issues`,
        user.id,
      ).catch(() => {});

      return reply.status(201).send({ issue });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // PUT /api/issues/:id - Update issue
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const data = updateIssueSchema.parse(request.body);

      // If resolving, set resolvedAt
      const updateData: any = { ...data };
      if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
        updateData.resolvedAt = new Date();
      } else if (data.status === 'OPEN' || data.status === 'IN_PROGRESS') {
        updateData.resolvedAt = null;
      }

      const issue = await prisma.issue.update({
        where: { id },
        data: updateData,
        include: {
          project: { select: { id: true, name: true } },
          room: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          photos: true,
          _count: { select: { comments: true } },
        },
      });

      return reply.send({ issue });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/issues/:id - Delete issue (Admin, PM only)
  app.delete('/:id', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    await prisma.issue.delete({ where: { id } });

    return reply.send({ message: 'Issue deleted' });
  });

  // ============================================
  // Comments
  // ============================================

  // POST /api/issues/:id/comments - Add comment
  app.post('/:id/comments', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { id: string };

    try {
      const data = addCommentSchema.parse(request.body);

      // Verify issue exists
      const issue = await prisma.issue.findUnique({ where: { id } });
      if (!issue) {
        return reply.status(404).send({ error: 'Issue not found' });
      }

      const comment = await prisma.issueComment.create({
        data: {
          issueId: id,
          userId: user.id,
          comment: data.comment,
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      });

      // Notify issue creator about new comment
      if (issue.createdById !== user.id) {
        createNotificationsForUsers(
          [issue.createdById],
          'COMMENT_ADDED',
          'New Comment on Issue',
          `${comment.user.name} commented on "${issue.title}"`,
          `/issues`,
        ).catch(() => {});
      }

      return reply.status(201).send({ comment });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/issues/comments/:commentId - Delete comment (Admin, PM, or owner)
  app.delete('/comments/:commentId', {
    preHandler: [requireRole(['ADMIN', 'PM', 'TECHNICIAN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { commentId } = request.params as { commentId: string };
    const user = request.user as { id: string; role: string };

    // Check if user is owner or admin/PM
    const comment = await prisma.issueComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return reply.status(404).send({ error: 'Comment not found' });
    }

    if (user.role === 'TECHNICIAN' && comment.userId !== user.id) {
      return reply.status(403).send({ error: 'You can only delete your own comments' });
    }

    await prisma.issueComment.delete({ where: { id: commentId } });

    return reply.send({ message: 'Comment deleted' });
  });

  // ============================================
  // Photos
  // ============================================

  // POST /api/issues/:id/photos - Add photo
  app.post('/:id/photos', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const data = addPhotoSchema.parse(request.body);

      // Verify issue exists
      const issue = await prisma.issue.findUnique({ where: { id } });
      if (!issue) {
        return reply.status(404).send({ error: 'Issue not found' });
      }

      const photo = await prisma.issuePhoto.create({
        data: {
          issueId: id,
          photoUrl: data.photoUrl,
          caption: data.caption,
        },
      });

      return reply.status(201).send({ photo });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/issues/photos/:photoId - Delete photo (Admin, PM only)
  app.delete('/photos/:photoId', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { photoId } = request.params as { photoId: string };

    await prisma.issuePhoto.delete({ where: { id: photoId } });

    return reply.send({ message: 'Photo deleted' });
  });
}
