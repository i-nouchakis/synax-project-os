import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { sendValidationError } from '../utils/errors.js';

const createClientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

const updateClientSchema = createClientSchema.partial();

export async function clientRoutes(app: FastifyInstance) {
  // GET /api/clients - List all clients
  app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    const clients = await prisma.client.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { projects: true } },
      },
    });

    return reply.send({ clients });
  });

  // GET /api/clients/:id - Get client by ID
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            status: true,
            location: true,
            startDate: true,
            endDate: true,
            createdAt: true,
          },
        },
      },
    });

    if (!client) {
      return reply.status(404).send({ error: 'Client not found' });
    }

    return reply.send({ client });
  });

  // POST /api/clients - Create client
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createClientSchema.parse(request.body);

      const client = await prisma.client.create({
        data: {
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          contactPerson: data.contactPerson || null,
          notes: data.notes || null,
        },
        include: {
          _count: { select: { projects: true } },
        },
      });

      return reply.status(201).send({ client });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // PUT /api/clients/:id - Update client
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const data = updateClientSchema.parse(request.body);

      const existing = await prisma.client.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ error: 'Client not found' });
      }

      const client = await prisma.client.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.email !== undefined && { email: data.email || null }),
          ...(data.phone !== undefined && { phone: data.phone || null }),
          ...(data.address !== undefined && { address: data.address || null }),
          ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson || null }),
          ...(data.notes !== undefined && { notes: data.notes || null }),
        },
        include: {
          _count: { select: { projects: true } },
        },
      });

      return reply.send({ client });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/clients/:id - Delete client
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const existing = await prisma.client.findUnique({
      where: { id },
      include: { _count: { select: { projects: true } } },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Client not found' });
    }

    // Unlink projects (set clientId to null) before deleting
    await prisma.project.updateMany({
      where: { clientId: id },
      data: { clientId: null },
    });

    await prisma.client.delete({ where: { id } });

    return reply.send({ message: 'Client deleted' });
  });
}
