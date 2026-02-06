import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import { config } from './config/index.js';
import { authRoutes } from './controllers/auth.controller.js';
import { userRoutes } from './controllers/user.controller.js';
import { projectRoutes } from './controllers/project.controller.js';
import { buildingRoutes } from './controllers/building.controller.js';
import { floorRoutes } from './controllers/floor.controller.js';
import { uploadRoutes } from './controllers/upload.controller.js';
import { assetRoutes } from './controllers/asset.controller.js';
import { roomRoutes } from './controllers/room.controller.js';
import { checklistRoutes } from './controllers/checklist.controller.js';
import { checklistTemplateRoutes } from './controllers/checklist-template.controller.js';
import { issueRoutes } from './controllers/issue.controller.js';
import { inventoryRoutes } from './controllers/inventory.controller.js';
import { reportRoutes } from './controllers/report.controller.js';
import { settingsRoutes } from './controllers/settings.controller.js';
import { dashboardRoutes } from './controllers/dashboard.controller.js';
import { signatureRoutes } from './controllers/signature.controller.js';
import { lookupRoutes } from './controllers/lookup.controller.js';
import { labelRoutes } from './controllers/label.controller.js';
import { clientRoutes } from './controllers/client.controller.js';
import { projectFileRoutes } from './controllers/project-file.controller.js';
import { calendarRoutes } from './controllers/calendar.controller.js';
import { messengerRoutes } from './controllers/messenger.controller.js';
import { drawingShapeRoutes } from './controllers/drawing-shape.controller.js';
import { cableRoutes } from './controllers/cable.controller.js';
import { feedbackRoutes } from './controllers/feedback.controller.js';

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

    await app.register(websocket);

    // Health check (both /health and /api/health for flexibility)
    const healthResponse = async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
    app.get('/health', healthResponse);
    app.get('/api/health', healthResponse);

    // API Routes
    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(userRoutes, { prefix: '/api/users' });
    await app.register(projectRoutes, { prefix: '/api/projects' });
    await app.register(buildingRoutes, { prefix: '/api/buildings' });
    await app.register(floorRoutes, { prefix: '/api/floors' });
    await app.register(uploadRoutes, { prefix: '/api/upload' });
    await app.register(assetRoutes, { prefix: '/api/assets' });
    await app.register(roomRoutes, { prefix: '/api/rooms' });
    await app.register(checklistRoutes, { prefix: '/api/checklists' });
    await app.register(checklistTemplateRoutes, { prefix: '/api/checklist-templates' });
    await app.register(issueRoutes, { prefix: '/api/issues' });
    await app.register(inventoryRoutes, { prefix: '/api/inventory' });
    await app.register(reportRoutes, { prefix: '/api/reports' });
    await app.register(settingsRoutes, { prefix: '/api/settings' });
    await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
    await app.register(signatureRoutes, { prefix: '/api/signatures' });
    await app.register(lookupRoutes, { prefix: '/api/lookups' });
    await app.register(labelRoutes, { prefix: '/api/labels' });
    await app.register(clientRoutes, { prefix: '/api/clients' });
    await app.register(projectFileRoutes, { prefix: '/api/project-files' });
    await app.register(calendarRoutes, { prefix: '/api/calendar' });
    await app.register(messengerRoutes, { prefix: '/api/messenger' });
    await app.register(drawingShapeRoutes, { prefix: '/api/shapes' });
    await app.register(cableRoutes, { prefix: '/api/cables' });
    await app.register(feedbackRoutes, { prefix: '/api/feedback' });

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
