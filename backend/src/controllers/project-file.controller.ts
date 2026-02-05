import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { storageService } from '../services/storage.service.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { sendValidationError } from '../utils/errors.js';

const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // CAD
  'application/acad', 'application/x-acad', 'application/dwg', 'image/vnd.dwg',
  // Archives
  'application/zip', 'application/x-rar-compressed',
  // Text
  'text/plain', 'text/csv',
];

const FILE_CATEGORIES = ['CONTRACTS', 'DRAWINGS', 'REPORTS', 'PHOTOS', 'OTHER'] as const;

const updateCategorySchema = z.object({
  category: z.enum(FILE_CATEGORIES),
});

export async function projectFileRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /api/project-files/:projectId - List files for a project
  app.get('/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const files = await prisma.projectFile.findMany({
      where: { projectId },
      orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    return reply.send({ files });
  });

  // POST /api/project-files/:projectId - Upload file
  app.post('/:projectId', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const user = request.user as { id: string };

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file provided' });
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(data.mimetype) && !data.mimetype.startsWith('application/')) {
      return reply.status(400).send({
        error: `File type not allowed: ${data.mimetype}`,
      });
    }

    const buffer = await data.toBuffer();

    // Get category from query or form fields
    const category = (data.fields?.category as { value?: string })?.value || 'OTHER';
    const validCategory = FILE_CATEGORIES.includes(category as typeof FILE_CATEGORIES[number])
      ? category as typeof FILE_CATEGORIES[number]
      : 'OTHER';

    // Upload to storage
    const result = await storageService.uploadFile(
      buffer,
      data.filename,
      data.mimetype,
      `project-files/${projectId}`
    );

    // Create DB record
    const file = await prisma.projectFile.create({
      data: {
        projectId,
        filename: data.filename,
        url: result.url,
        mimeType: data.mimetype,
        size: buffer.length,
        category: validCategory,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    return reply.status(201).send({ file });
  });

  // PUT /api/project-files/file/:fileId - Update file category
  app.put('/file/:fileId', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { fileId } = request.params as { fileId: string };

    try {
      const data = updateCategorySchema.parse(request.body);

      const file = await prisma.projectFile.update({
        where: { id: fileId },
        data: { category: data.category },
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      });

      return reply.send({ file });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/project-files/file/:fileId - Delete file
  app.delete('/file/:fileId', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { fileId } = request.params as { fileId: string };

    const file = await prisma.projectFile.findUnique({ where: { id: fileId } });
    if (!file) {
      return reply.status(404).send({ error: 'File not found' });
    }

    await prisma.projectFile.delete({ where: { id: fileId } });

    return reply.send({ message: 'File deleted' });
  });
}
