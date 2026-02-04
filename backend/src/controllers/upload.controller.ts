import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { storageService } from '../services/storage.service.js';
import { dwgService } from '../services/dwg.service.js';
import { prisma } from '../utils/prisma.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_FLOORPLAN_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/acad',           // AutoCAD DWG
  'application/x-acad',         // AutoCAD DWG
  'application/x-autocad',      // AutoCAD DWG
  'application/dwg',            // DWG
  'image/vnd.dwg',              // DWG
  'image/x-dwg',                // DWG
  'application/x-dwg',          // DWG
];

// Helper to detect DWG from extension if mimetype is generic
const isDWGFile = (filename: string, mimetype: string): boolean => {
  const ext = filename.toLowerCase().split('.').pop();
  return ext === 'dwg' || mimetype.includes('dwg') || mimetype.includes('acad') || mimetype.includes('autocad');
};

// Helper to get floor plan type
const getFloorplanType = (filename: string, mimetype: string): 'IMAGE' | 'PDF' | 'DWG' => {
  if (isDWGFile(filename, mimetype)) return 'DWG';
  if (mimetype === 'application/pdf') return 'PDF';
  return 'IMAGE';
};

export async function uploadRoutes(app: FastifyInstance) {
  // Multipart is registered globally in server.ts

  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // POST /api/upload/image - Upload a general image
  app.post('/image', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(data.mimetype)) {
      return reply.status(400).send({
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF',
      });
    }

    const buffer = await data.toBuffer();
    const result = await storageService.uploadImage(buffer, data.filename, 'images');

    return reply.send(result);
  });

  // POST /api/upload/floorplan/:floorId - Upload floor plan
  app.post('/floorplan/:floorId', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { floorId } = request.params as { floorId: string };

    // Check floor exists
    const floor = await prisma.floor.findUnique({ where: { id: floorId } });
    if (!floor) {
      return reply.status(404).send({ error: 'Floor not found' });
    }

    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    // Check if it's a DWG file (by extension or mimetype)
    const isDwg = isDWGFile(data.filename, data.mimetype);

    if (!isDwg && !ALLOWED_FLOORPLAN_TYPES.includes(data.mimetype)) {
      return reply.status(400).send({
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF, DWG',
      });
    }

    let buffer = await data.toBuffer();
    let filename = data.filename;
    let floorplanType = getFloorplanType(data.filename, data.mimetype);
    let conversionInfo: string | undefined;

    // Try to convert DWG files
    if (isDwg) {
      const conversionResult = await dwgService.convertDwgToSvg(buffer, data.filename);

      if (conversionResult.success && conversionResult.format !== 'dwg') {
        buffer = conversionResult.buffer;
        floorplanType = conversionResult.format === 'svg' ? 'IMAGE' : 'DWG';
        filename = data.filename.replace(/\.dwg$/i, `.${conversionResult.format}`);
        conversionInfo = `Converted from DWG to ${conversionResult.format.toUpperCase()}`;
      } else {
        conversionInfo = conversionResult.error || 'DWG stored as-is (no conversion tools available)';
      }
    }

    const result = await storageService.uploadFloorPlan(buffer, filename, data.mimetype);

    // Update floor with floorplan URL
    const updatedFloor = await prisma.floor.update({
      where: { id: floorId },
      data: {
        floorplanUrl: result.url,
        floorplanType,
      },
    });

    return reply.send({
      floor: updatedFloor,
      upload: result,
      conversion: conversionInfo,
    });
  });

  // POST /api/upload/room-floorplan/:roomId - Upload room floor plan
  app.post('/room-floorplan/:roomId', {
    preHandler: [requireRole(['ADMIN', 'PM', 'TECHNICIAN'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { roomId } = request.params as { roomId: string };

    // Check room exists
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }

    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    if (!ALLOWED_FLOORPLAN_TYPES.includes(data.mimetype)) {
      return reply.status(400).send({
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF',
      });
    }

    const buffer = await data.toBuffer();
    const result = await storageService.uploadFloorPlan(buffer, data.filename, data.mimetype);

    // Update room with floorplan URL
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        floorplanUrl: result.url,
        floorplanType: data.mimetype.startsWith('image/') ? 'IMAGE' : 'PDF',
      },
    });

    return reply.send({
      room: updatedRoom,
      upload: result,
    });
  });

  // POST /api/upload/checklist-photo - Upload checklist item photo
  app.post('/checklist-photo', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(data.mimetype)) {
      return reply.status(400).send({
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF',
      });
    }

    const buffer = await data.toBuffer();
    const result = await storageService.uploadImage(buffer, data.filename, 'checklist-photos', {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
    });

    return reply.send(result);
  });

  // GET /api/upload/dwg-status - Check DWG conversion tools status
  app.get('/dwg-status', async (request: FastifyRequest, reply: FastifyReply) => {
    const status = await dwgService.getStatus();
    return reply.send(status);
  });

  // POST /api/upload/issue-photo - Upload issue photo
  app.post('/issue-photo', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(data.mimetype)) {
      return reply.status(400).send({
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF',
      });
    }

    const buffer = await data.toBuffer();
    const result = await storageService.uploadImage(buffer, data.filename, 'issue-photos', {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
    });

    return reply.send(result);
  });

  // POST /api/upload/masterplan/:projectId - Upload project master plan
  app.post('/masterplan/:projectId', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    // Check project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    // Check if it's a DWG file (by extension or mimetype)
    const isDwg = isDWGFile(data.filename, data.mimetype);

    if (!isDwg && !ALLOWED_FLOORPLAN_TYPES.includes(data.mimetype)) {
      return reply.status(400).send({
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF, DWG',
      });
    }

    let buffer = await data.toBuffer();
    let filename = data.filename;
    let masterplanType = getFloorplanType(data.filename, data.mimetype);
    let conversionInfo: string | undefined;

    // Try to convert DWG files
    if (isDwg) {
      const conversionResult = await dwgService.convertDwgToSvg(buffer, data.filename);

      if (conversionResult.success && conversionResult.format !== 'dwg') {
        buffer = conversionResult.buffer;
        masterplanType = conversionResult.format === 'svg' ? 'IMAGE' : 'DWG';
        filename = data.filename.replace(/\.dwg$/i, `.${conversionResult.format}`);
        conversionInfo = `Converted from DWG to ${conversionResult.format.toUpperCase()}`;
      } else {
        conversionInfo = conversionResult.error || 'DWG stored as-is (no conversion tools available)';
      }
    }

    const result = await storageService.uploadFloorPlan(buffer, filename, data.mimetype);

    // Update project with masterplan URL
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        masterplanUrl: result.url,
        masterplanType,
      },
    });

    return reply.send({
      project: updatedProject,
      upload: result,
      conversion: conversionInfo,
    });
  });

  // POST /api/upload/building-floorplan/:buildingId - Upload building floor plan
  app.post('/building-floorplan/:buildingId', {
    preHandler: [requireRole(['ADMIN', 'PM'])],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { buildingId } = request.params as { buildingId: string };

    // Check building exists
    const building = await prisma.building.findUnique({ where: { id: buildingId } });
    if (!building) {
      return reply.status(404).send({ error: 'Building not found' });
    }

    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    // Check if it's a DWG file (by extension or mimetype)
    const isDwg = isDWGFile(data.filename, data.mimetype);

    if (!isDwg && !ALLOWED_FLOORPLAN_TYPES.includes(data.mimetype)) {
      return reply.status(400).send({
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF, DWG',
      });
    }

    let buffer = await data.toBuffer();
    let filename = data.filename;
    let floorplanType = getFloorplanType(data.filename, data.mimetype);
    let conversionInfo: string | undefined;

    // Try to convert DWG files
    if (isDwg) {
      const conversionResult = await dwgService.convertDwgToSvg(buffer, data.filename);

      if (conversionResult.success && conversionResult.format !== 'dwg') {
        buffer = conversionResult.buffer;
        floorplanType = conversionResult.format === 'svg' ? 'IMAGE' : 'DWG';
        filename = data.filename.replace(/\.dwg$/i, `.${conversionResult.format}`);
        conversionInfo = `Converted from DWG to ${conversionResult.format.toUpperCase()}`;
      } else {
        conversionInfo = conversionResult.error || 'DWG stored as-is (no conversion tools available)';
      }
    }

    const result = await storageService.uploadFloorPlan(buffer, filename, data.mimetype);

    // Update building with floorplan URL
    const updatedBuilding = await prisma.building.update({
      where: { id: buildingId },
      data: {
        floorplanUrl: result.url,
        floorplanType,
      },
    });

    return reply.send({
      building: updatedBuilding,
      upload: result,
      conversion: conversionInfo,
    });
  });
}
