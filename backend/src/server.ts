import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { config } from './config/index.js';
import { authRoutes } from './controllers/auth.controller.js';
import { userRoutes } from './controllers/user.controller.js';
import { projectRoutes } from './controllers/project.controller.js';
import { floorRoutes } from './controllers/floor.controller.js';
import { uploadRoutes } from './controllers/upload.controller.js';
import { assetRoutes } from './controllers/asset.controller.js';
import { roomRoutes } from './controllers/room.controller.js';
import { checklistRoutes } from './controllers/checklist.controller.js';
import { issueRoutes } from './controllers/issue.controller.js';
import { inventoryRoutes } from './controllers/inventory.controller.js';
import { reportRoutes } from './controllers/report.controller.js';
import { settingsRoutes } from './controllers/settings.controller.js';
import { dashboardRoutes } from './controllers/dashboard.controller.js';
import { signatureRoutes } from './controllers/signature.controller.js';
import { timeEntryRoutes } from './controllers/timeentry.controller.js';

const app = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'warn',
  },
});

// Start server
const start = async () => {
  try {
    // Register plugins
    await app.register(cors, {
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    });

    await app.register(jwt, {
      secret: config.jwt.secret,
    });

    await app.register(multipart, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    });

    // Health check
    app.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // API Routes
    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(userRoutes, { prefix: '/api/users' });
    await app.register(projectRoutes, { prefix: '/api/projects' });
    await app.register(floorRoutes, { prefix: '/api/floors' });
    await app.register(uploadRoutes, { prefix: '/api/upload' });
    await app.register(assetRoutes, { prefix: '/api/assets' });
    await app.register(roomRoutes, { prefix: '/api/rooms' });
    await app.register(checklistRoutes, { prefix: '/api/checklists' });
    await app.register(issueRoutes, { prefix: '/api/issues' });
    await app.register(inventoryRoutes, { prefix: '/api/inventory' });
    await app.register(reportRoutes, { prefix: '/api/reports' });
    await app.register(settingsRoutes, { prefix: '/api/settings' });
    await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
    await app.register(signatureRoutes, { prefix: '/api/signatures' });
    await app.register(timeEntryRoutes, { prefix: '/api/time-entries' });

    // Start listening
    await app.listen({ port: config.port, host: config.host });

    console.log(`
🚀 Synax API Server running!
   Environment: ${config.nodeEnv}
   URL: http://${config.host}:${config.port}
   Health: http://${config.host}:${config.port}/health
    `);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

export default app;
