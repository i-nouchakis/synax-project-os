import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/index.js';
import { sendValidationError } from '../utils/errors.js';

import crypto from 'crypto';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

type LoginBody = z.infer<typeof loginSchema>;
type RegisterBody = z.infer<typeof registerSchema>;

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.isActive) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = app.jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        { expiresIn: config.jwt.expiresIn }
      );

      // Return user data (without password)
      const { passwordHash: _, ...userWithoutPassword } = user;

      return reply.send({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // POST /api/auth/register
  app.post('/register', async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    try {
      const { email, password, name } = registerSchema.parse(request.body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.status(400).send({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: 'TECHNICIAN', // Default role
        },
      });

      // Generate token
      const token = app.jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        { expiresIn: config.jwt.expiresIn }
      );

      // Return user data (without password)
      const { passwordHash: _, ...userWithoutPassword } = user;

      return reply.status(201).send({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // GET /api/auth/me
  app.get('/me', {
    preHandler: [async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
    }],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.user as { id: string };

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

  // POST /api/auth/logout
  app.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    // For JWT, logout is handled client-side by removing the token
    // In a more complex setup, we'd invalidate the refresh token
    return reply.send({ message: 'Logged out successfully' });
  });

  // POST /api/auth/forgot-password - Request password reset
  app.post('/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = forgotPasswordSchema.parse(request.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return reply.send({
          message: 'If an account exists with this email, a reset link will be sent.',
          // In production, remove the debug info below
          debug: 'User not found'
        });
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Delete any existing tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Create new reset token
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          email: user.email,
          expiresAt,
        },
      });

      // In production, send email here
      // For now, return token in response for testing
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

      return reply.send({
        message: 'If an account exists with this email, a reset link will be sent.',
        // In production, remove the debug info below
        debug: {
          token,
          resetUrl,
          expiresAt,
          note: 'In production, this would be sent via email'
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // POST /api/auth/reset-password - Reset password with token
  app.post('/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token, password } = resetPasswordSchema.parse(request.body);

      // Find token
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
      });

      if (!resetToken) {
        return reply.status(400).send({ error: 'Invalid or expired reset token' });
      }

      // Check if token is expired
      if (resetToken.expiresAt < new Date()) {
        await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
        return reply.status(400).send({ error: 'Reset token has expired' });
      }

      // Check if token was already used
      if (resetToken.usedAt) {
        return reply.status(400).send({ error: 'Reset token has already been used' });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 10);

      // Update user password
      await prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      // Mark token as used
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      return reply.send({ message: 'Password has been reset successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // GET /api/auth/verify-reset-token/:token - Verify reset token is valid
  app.get('/verify-reset-token/:token', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = request.params as { token: string };

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return reply.status(400).send({ valid: false, error: 'Invalid token' });
    }

    if (resetToken.expiresAt < new Date()) {
      return reply.status(400).send({ valid: false, error: 'Token has expired' });
    }

    if (resetToken.usedAt) {
      return reply.status(400).send({ valid: false, error: 'Token has already been used' });
    }

    return reply.send({
      valid: true,
      email: resetToken.email,
      expiresAt: resetToken.expiresAt
    });
  });
}
