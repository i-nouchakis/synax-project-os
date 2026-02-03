import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { prisma } from '../../utils/prisma.js';
import bcrypt from 'bcryptjs';

// Import all routes
import { authRoutes } from '../../controllers/auth.controller.js';
import { userRoutes } from '../../controllers/user.controller.js';
import { projectRoutes } from '../../controllers/project.controller.js';
import { floorRoutes } from '../../controllers/floor.controller.js';
import { roomRoutes } from '../../controllers/room.controller.js';
import { assetRoutes } from '../../controllers/asset.controller.js';
import { issueRoutes } from '../../controllers/issue.controller.js';
import { checklistRoutes } from '../../controllers/checklist.controller.js';
import { inventoryRoutes } from '../../controllers/inventory.controller.js';

export interface TestUser {
  id: string;
  email: string;
  role: string;
  token: string;
}

export interface TestData {
  adminUser: TestUser;
  pmUser: TestUser;
  techUser: TestUser;
  clientUser: TestUser;
  project: any;
  floor: any;
  room: any;
  asset: any;
  issue: any;
  inventoryItem: any;
}

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'test-secret-key-for-testing',
  });

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(projectRoutes, { prefix: '/api/projects' });
  await app.register(floorRoutes, { prefix: '/api/floors' });
  await app.register(roomRoutes, { prefix: '/api/rooms' });
  await app.register(assetRoutes, { prefix: '/api/assets' });
  await app.register(issueRoutes, { prefix: '/api/issues' });
  await app.register(checklistRoutes, { prefix: '/api/checklists' });
  await app.register(inventoryRoutes, { prefix: '/api/inventory' });

  await app.ready();
  return app;
}

export async function createTestUsers(app: FastifyInstance): Promise<{
  admin: TestUser;
  pm: TestUser;
  tech: TestUser;
  client: TestUser;
}> {
  const password = await bcrypt.hash('testpass123', 10);
  const timestamp = Date.now();

  // Create test users
  const adminUser = await prisma.user.create({
    data: {
      email: `admin-test-${timestamp}@synax.app`,
      name: 'Test Admin',
      passwordHash: password,
      role: 'ADMIN',
    },
  });

  const pmUser = await prisma.user.create({
    data: {
      email: `pm-test-${timestamp}@synax.app`,
      name: 'Test PM',
      passwordHash: password,
      role: 'PM',
    },
  });

  const techUser = await prisma.user.create({
    data: {
      email: `tech-test-${timestamp}@synax.app`,
      name: 'Test Technician',
      passwordHash: password,
      role: 'TECHNICIAN',
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: `client-test-${timestamp}@synax.app`,
      name: 'Test Client',
      passwordHash: password,
      role: 'CLIENT',
    },
  });

  // Generate tokens
  const adminToken = app.jwt.sign({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
  const pmToken = app.jwt.sign({ id: pmUser.id, email: pmUser.email, role: pmUser.role });
  const techToken = app.jwt.sign({ id: techUser.id, email: techUser.email, role: techUser.role });
  const clientToken = app.jwt.sign({ id: clientUser.id, email: clientUser.email, role: clientUser.role });

  return {
    admin: { id: adminUser.id, email: adminUser.email, role: adminUser.role, token: adminToken },
    pm: { id: pmUser.id, email: pmUser.email, role: pmUser.role, token: pmToken },
    tech: { id: techUser.id, email: techUser.email, role: techUser.role, token: techToken },
    client: { id: clientUser.id, email: clientUser.email, role: clientUser.role, token: clientToken },
  };
}

export async function createTestData(adminId: string): Promise<{
  project: any;
  floor: any;
  room: any;
  asset: any;
  assetType: any;
  issue: any;
  inventoryItem: any;
  checklist: any;
}> {
  const timestamp = Date.now();

  // Create asset type first
  const assetType = await prisma.assetType.create({
    data: {
      name: `Test Asset Type ${timestamp}`,
      icon: 'wifi',
      checklistTemplate: { items: [{ name: 'Test Item', requiresPhoto: false }] },
    },
  });

  // Create project
  const project = await prisma.project.create({
    data: {
      name: `Test Project ${timestamp}`,
      clientName: 'Test Client',
      location: 'Test Location',
      status: 'IN_PROGRESS',
    },
  });

  // Create floor
  const floor = await prisma.floor.create({
    data: {
      projectId: project.id,
      name: `Test Floor ${timestamp}`,
      level: 1,
    },
  });

  // Create room
  const room = await prisma.room.create({
    data: {
      floorId: floor.id,
      name: `Test Room ${timestamp}`,
      type: 'Office',
    },
  });

  // Create asset
  const asset = await prisma.asset.create({
    data: {
      roomId: room.id,
      assetTypeId: assetType.id,
      name: `Test Asset ${timestamp}`,
      serialNumber: `SN-TEST-${timestamp}`,
      status: 'INSTALLED',
    },
  });

  // Create issue
  const issue = await prisma.issue.create({
    data: {
      projectId: project.id,
      roomId: room.id,
      title: `Test Issue ${timestamp}`,
      description: 'Test description',
      priority: 'MEDIUM',
      createdById: adminId,
    },
  });

  // Create inventory item
  const inventoryItem = await prisma.inventoryItem.create({
    data: {
      projectId: project.id,
      itemType: 'Cable',
      description: `Test Inventory ${timestamp}`,
      unit: 'pcs',
      quantityReceived: 100,
      quantityUsed: 10,
    },
  });

  // Create checklist
  const checklist = await prisma.checklist.create({
    data: {
      assetId: asset.id,
      type: 'CABLING',
      status: 'NOT_STARTED',
    },
  });

  return { project, floor, room, asset, assetType, issue, inventoryItem, checklist };
}

export async function cleanupTestData(testData: any, users: any) {
  // Delete in reverse order of dependencies
  try {
    if (testData.checklist?.id) {
      await prisma.checklist.deleteMany({ where: { id: testData.checklist.id } }).catch(() => {});
    }
    if (testData.inventoryItem?.id) {
      await prisma.inventoryItem.deleteMany({ where: { id: testData.inventoryItem.id } }).catch(() => {});
    }
    if (testData.issue?.id) {
      await prisma.issue.deleteMany({ where: { id: testData.issue.id } }).catch(() => {});
    }
    if (testData.asset?.id) {
      await prisma.asset.deleteMany({ where: { id: testData.asset.id } }).catch(() => {});
    }
    if (testData.room?.id) {
      await prisma.room.deleteMany({ where: { id: testData.room.id } }).catch(() => {});
    }
    if (testData.floor?.id) {
      await prisma.floor.deleteMany({ where: { id: testData.floor.id } }).catch(() => {});
    }
    if (testData.project?.id) {
      await prisma.project.deleteMany({ where: { id: testData.project.id } }).catch(() => {});
    }
    if (testData.assetType?.id) {
      await prisma.assetType.deleteMany({ where: { id: testData.assetType.id } }).catch(() => {});
    }

    // Delete test users
    const userIds = [users.admin?.id, users.pm?.id, users.tech?.id, users.client?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } }).catch(() => {});
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}
