import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { sendValidationError } from '../utils/errors.js';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'PM', 'TECHNICIAN', 'CLIENT']).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['ADMIN', 'PM', 'TECHNICIAN', 'CLIENT']).optional(),
  isActive: z.boolean().optional(),
});

export async function userRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // ============================================
  // Profile Settings (for logged-in user)
  // IMPORTANT: These must come BEFORE /:id route
  // ============================================

  // PUT /api/users/profile - Update own profile
  app.put('/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const { name, email } = request.body as { name?: string; email?: string };

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: user.id },
        },
      });
      if (existingUser) {
        return reply.status(400).send({ error: 'Email already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      },
    });

    return reply.send({ user: updatedUser });
  });

  // POST /api/users/avatar - Upload own avatar
  app.post('/avatar', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      // Store as base64 (in production, use MinIO)
      const buffer = await data.toBuffer();
      const base64 = `data:${data.mimetype};base64,${buffer.toString('base64')}`;

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: base64 },
        select: { id: true, avatar: true },
      });

      return reply.send({ avatar: updatedUser.avatar });
    } catch {
      return reply.status(400).send({ error: 'Failed to process file upload' });
    }
  });

  // PUT /api/users/password - Change own password
  app.put('/password', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const { currentPassword, newPassword } = request.body as {
      currentPassword: string;
      newPassword: string;
    };

    // Get current user with password hash
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isValid) {
      return reply.status(400).send({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return reply.send({ message: 'Password changed successfully' });
  });

  // GET /api/users/notifications - Get notification preferences
  app.get('/notifications', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    const prefs = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        notifyOnIssue: true,
        notifyOnAssignment: true,
        notifyOnComment: true,
        notifyDigest: true,
      },
    });

    return reply.send({
      settings: {
        emailOnIssue: prefs?.notifyOnIssue ?? true,
        emailOnAssignment: prefs?.notifyOnAssignment ?? true,
        emailOnComment: prefs?.notifyOnComment ?? false,
        emailDigest: prefs?.notifyDigest ?? true,
      },
    });
  });

  // PUT /api/users/notifications - Update notification preferences
  app.put('/notifications', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };
    const settings = request.body as {
      emailOnIssue: boolean;
      emailOnAssignment: boolean;
      emailOnComment: boolean;
      emailDigest: boolean;
    };

    await prisma.user.update({
      where: { id: user.id },
      data: {
        notifyOnIssue: settings.emailOnIssue,
        notifyOnAssignment: settings.emailOnAssignment,
        notifyOnComment: settings.emailOnComment,
        notifyDigest: settings.emailDigest,
      },
    });

    return reply.send({ message: 'Notification settings saved', settings });
  });

  // ============================================
  // Admin User Management
  // ============================================

  // GET /api/users - List all users (Admin only)
  app.get('/', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ users });
  });

  // GET /api/users/:id - Get user by ID
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return reply.send({ user });
  });

  // POST /api/users - Create user (Admin only)
  app.post('/', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createUserSchema.parse(request.body);

      // Check if email exists
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        return reply.status(400).send({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          role: data.role || 'TECHNICIAN',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      return reply.status(201).send({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // PUT /api/users/:id - Update user (Admin only)
  app.put('/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
      const data = updateUserSchema.parse(request.body);

      const user = await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      return reply.send({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/users/:id - Delete user (Admin only)
  app.delete('/:id', {
    preHandler: [requireRole(['ADMIN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const currentUser = request.user as { id: string };

    if (id === currentUser.id) {
      return reply.status(400).send({ error: 'Cannot delete yourself' });
    }

    await prisma.user.delete({ where: { id } });

    return reply.send({ message: 'User deleted' });
  });
}
