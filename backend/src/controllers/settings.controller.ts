import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import crypto from 'crypto';

// In-memory storage for company settings (in production, use database)
let companySettings = {
  name: 'Synax',
  logo: null as string | null,
  address: '',
  phone: '',
  email: '',
  website: '',
};

export async function settingsRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // ============================================
  // Company Settings (Admin only)
  // ============================================

  // GET /api/settings/company - Get company settings
  app.get('/company', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(companySettings);
  });

  // PUT /api/settings/company - Update company settings
  app.put('/company', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role: string };

    if (user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Access denied' });
    }

    const settings = request.body as {
      name: string;
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
    };

    // Update in-memory storage
    companySettings = {
      ...companySettings,
      name: settings.name || companySettings.name,
      address: settings.address ?? companySettings.address,
      phone: settings.phone ?? companySettings.phone,
      email: settings.email ?? companySettings.email,
      website: settings.website ?? companySettings.website,
    };

    return reply.send({ message: 'Company settings saved', settings: companySettings });
  });

  // POST /api/settings/company/logo - Upload company logo
  app.post('/company/logo', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role: string };

    if (user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Access denied' });
    }

    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, SVG' });
      }

      // Store as base64 (in production, use MinIO)
      const buffer = await data.toBuffer();
      const base64 = `data:${data.mimetype};base64,${buffer.toString('base64')}`;

      // Store in memory (in production, store in database)
      companySettings.logo = base64;
      return reply.send({ logo: base64, message: 'Logo uploaded successfully' });
    } catch {
      return reply.status(400).send({ error: 'Failed to process file upload' });
    }
  });

  // ============================================
  // API Keys (Admin only)
  // ============================================

  // GET /api/settings/api-keys - List API keys
  app.get('/api-keys', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role: string };

    if (user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Access denied' });
    }

    // In production, fetch from database
    // For now, return empty array
    return reply.send([]);
  });

  // POST /api/settings/api-keys - Create API key
  app.post('/api-keys', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };

    if (user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Access denied' });
    }

    const { name } = request.body as { name: string };

    // Generate a secure API key
    const secret = `synax_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(secret).digest('hex');

    // In production, store the hash in database (not the actual key)
    const apiKey = {
      id: crypto.randomUUID(),
      name,
      key: keyHash.substring(0, 16) + '...' + keyHash.substring(keyHash.length - 4),
      createdAt: new Date().toISOString(),
      lastUsed: null,
    };

    return reply.send({ key: apiKey, secret });
  });

  // DELETE /api/settings/api-keys/:id - Delete API key
  app.delete('/api-keys/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role: string };

    if (user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Access denied' });
    }

    const { id } = request.params as { id: string };

    // In production, delete from database
    return reply.send({ message: 'API key deleted' });
  });
}
