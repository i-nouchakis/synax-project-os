import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { buildTestApp, createTestUsers, createTestData, cleanupTestData } from './helpers/test-setup.js';

describe('Delete Operations - Authorization & Database Verification', () => {
  let app: FastifyInstance;
  let users: Awaited<ReturnType<typeof createTestUsers>>;
  let testData: Awaited<ReturnType<typeof createTestData>>;

  beforeAll(async () => {
    app = await buildTestApp();
    users = await createTestUsers(app);
    testData = await createTestData(users.admin.id);
  });

  afterAll(async () => {
    await cleanupTestData(testData, users);
    await app.close();
  });

  // ============================================
  // INVENTORY DELETE TESTS
  // ============================================
  describe('DELETE /api/inventory/:id', () => {
    it('should allow ADMIN to delete inventory item', async () => {
      // Create a new item for this test
      const item = await prisma.inventoryItem.create({
        data: {
          projectId: testData.project.id,
          itemType: 'Cable',
          description: 'Test delete item',
          unit: 'pcs',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/inventory/${item.id}`,
        headers: { Authorization: `Bearer ${users.admin.token}` },
      });

      expect(response.statusCode).toBe(200);

      // Verify deleted from database
      const deleted = await prisma.inventoryItem.findUnique({ where: { id: item.id } });
      expect(deleted).toBeNull();
    });

    it('should allow PM to delete inventory item', async () => {
      const item = await prisma.inventoryItem.create({
        data: {
          projectId: testData.project.id,
          itemType: 'Switch',
          description: 'PM delete test',
          unit: 'pcs',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/inventory/${item.id}`,
        headers: { Authorization: `Bearer ${users.pm.token}` },
      });

      expect(response.statusCode).toBe(200);

      const deleted = await prisma.inventoryItem.findUnique({ where: { id: item.id } });
      expect(deleted).toBeNull();
    });

    it('should REJECT TECHNICIAN from deleting inventory item', async () => {
      const item = await prisma.inventoryItem.create({
        data: {
          projectId: testData.project.id,
          itemType: 'Router',
          description: 'Tech should not delete',
          unit: 'pcs',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/inventory/${item.id}`,
        headers: { Authorization: `Bearer ${users.tech.token}` },
      });

      expect(response.statusCode).toBe(403);

      // Item should still exist
      const stillExists = await prisma.inventoryItem.findUnique({ where: { id: item.id } });
      expect(stillExists).not.toBeNull();

      // Cleanup
      await prisma.inventoryItem.delete({ where: { id: item.id } });
    });

    it('should REJECT CLIENT from deleting inventory item', async () => {
      const item = await prisma.inventoryItem.create({
        data: {
          projectId: testData.project.id,
          itemType: 'AP',
          description: 'Client should not delete',
          unit: 'pcs',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/inventory/${item.id}`,
        headers: { Authorization: `Bearer ${users.client.token}` },
      });

      expect(response.statusCode).toBe(403);

      // Cleanup
      await prisma.inventoryItem.delete({ where: { id: item.id } });
    });
  });

  // ============================================
  // ISSUE DELETE TESTS
  // ============================================
  describe('DELETE /api/issues/:id', () => {
    it('should allow ADMIN to delete issue', async () => {
      const issue = await prisma.issue.create({
        data: {
          projectId: testData.project.id,
          title: 'Admin delete test',
          createdById: users.admin.id,
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/issues/${issue.id}`,
        headers: { Authorization: `Bearer ${users.admin.token}` },
      });

      expect(response.statusCode).toBe(200);

      const deleted = await prisma.issue.findUnique({ where: { id: issue.id } });
      expect(deleted).toBeNull();
    });

    it('should allow PM to delete issue', async () => {
      const issue = await prisma.issue.create({
        data: {
          projectId: testData.project.id,
          title: 'PM delete test',
          createdById: users.pm.id,
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/issues/${issue.id}`,
        headers: { Authorization: `Bearer ${users.pm.token}` },
      });

      expect(response.statusCode).toBe(200);

      const deleted = await prisma.issue.findUnique({ where: { id: issue.id } });
      expect(deleted).toBeNull();
    });

    it('should REJECT TECHNICIAN from deleting issue', async () => {
      const issue = await prisma.issue.create({
        data: {
          projectId: testData.project.id,
          title: 'Tech should not delete',
          createdById: users.tech.id,
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/issues/${issue.id}`,
        headers: { Authorization: `Bearer ${users.tech.token}` },
      });

      expect(response.statusCode).toBe(403);

      // Cleanup
      await prisma.issue.delete({ where: { id: issue.id } });
    });

    it('should cascade delete issue photos and comments', async () => {
      const issue = await prisma.issue.create({
        data: {
          projectId: testData.project.id,
          title: 'Cascade delete test',
          createdById: users.admin.id,
        },
      });

      // Add photo and comment
      const photo = await prisma.issuePhoto.create({
        data: { issueId: issue.id, photoUrl: 'http://test.com/photo.jpg' },
      });
      const comment = await prisma.issueComment.create({
        data: { issueId: issue.id, userId: users.admin.id, comment: 'Test comment' },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/issues/${issue.id}`,
        headers: { Authorization: `Bearer ${users.admin.token}` },
      });

      expect(response.statusCode).toBe(200);

      // Verify cascade delete
      const deletedPhoto = await prisma.issuePhoto.findUnique({ where: { id: photo.id } });
      const deletedComment = await prisma.issueComment.findUnique({ where: { id: comment.id } });
      expect(deletedPhoto).toBeNull();
      expect(deletedComment).toBeNull();
    });
  });

  // ============================================
  // CHECKLIST DELETE TESTS
  // ============================================
  describe('DELETE /api/checklists/:id', () => {
    it('should allow ADMIN to delete checklist', async () => {
      const checklist = await prisma.checklist.create({
        data: {
          assetId: testData.asset.id,
          type: 'EQUIPMENT',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/checklists/${checklist.id}`,
        headers: { Authorization: `Bearer ${users.admin.token}` },
      });

      expect(response.statusCode).toBe(200);

      const deleted = await prisma.checklist.findUnique({ where: { id: checklist.id } });
      expect(deleted).toBeNull();
    });

    it('should allow PM to delete checklist', async () => {
      const checklist = await prisma.checklist.create({
        data: {
          assetId: testData.asset.id,
          type: 'CONFIG',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/checklists/${checklist.id}`,
        headers: { Authorization: `Bearer ${users.pm.token}` },
      });

      expect(response.statusCode).toBe(200);

      const deleted = await prisma.checklist.findUnique({ where: { id: checklist.id } });
      expect(deleted).toBeNull();
    });

    it('should REJECT TECHNICIAN from deleting checklist', async () => {
      const checklist = await prisma.checklist.create({
        data: {
          assetId: testData.asset.id,
          type: 'DOCUMENTATION',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/checklists/${checklist.id}`,
        headers: { Authorization: `Bearer ${users.tech.token}` },
      });

      expect(response.statusCode).toBe(403);

      // Cleanup
      await prisma.checklist.delete({ where: { id: checklist.id } });
    });
  });

  // ============================================
  // ROOM DELETE TESTS (via floor controller)
  // ============================================
  describe('DELETE /api/floors/:floorId/rooms/:roomId', () => {
    it('should allow ADMIN to delete room via floor endpoint', async () => {
      const room = await prisma.room.create({
        data: {
          floorId: testData.floor.id,
          name: 'Admin delete room',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/floors/${testData.floor.id}/rooms/${room.id}`,
        headers: { Authorization: `Bearer ${users.admin.token}` },
      });

      expect(response.statusCode).toBe(200);

      const deleted = await prisma.room.findUnique({ where: { id: room.id } });
      expect(deleted).toBeNull();
    });

    it('should allow PM to delete room via floor endpoint', async () => {
      const room = await prisma.room.create({
        data: {
          floorId: testData.floor.id,
          name: 'PM delete room',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/floors/${testData.floor.id}/rooms/${room.id}`,
        headers: { Authorization: `Bearer ${users.pm.token}` },
      });

      expect(response.statusCode).toBe(200);

      const deleted = await prisma.room.findUnique({ where: { id: room.id } });
      expect(deleted).toBeNull();
    });

    it('should REJECT TECHNICIAN from deleting room', async () => {
      const room = await prisma.room.create({
        data: {
          floorId: testData.floor.id,
          name: 'Tech should not delete',
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/floors/${testData.floor.id}/rooms/${room.id}`,
        headers: { Authorization: `Bearer ${users.tech.token}` },
      });

      expect(response.statusCode).toBe(403);

      // Cleanup
      await prisma.room.delete({ where: { id: room.id } });
    });

    it('should cascade delete assets when room is deleted', async () => {
      const room = await prisma.room.create({
        data: {
          floorId: testData.floor.id,
          name: 'Room with asset',
        },
      });

      const asset = await prisma.asset.create({
        data: {
          roomId: room.id,
          assetTypeId: testData.assetType.id,
          name: `Cascade Test Asset`,
          serialNumber: `CASCADE-TEST-${Date.now()}`,
        },
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/floors/${testData.floor.id}/rooms/${room.id}`,
        headers: { Authorization: `Bearer ${users.admin.token}` },
      });

      expect(response.statusCode).toBe(200);

      // Verify cascade
      const deletedAsset = await prisma.asset.findUnique({ where: { id: asset.id } });
      expect(deletedAsset).toBeNull();
    });
  });

  // ============================================
  // PROJECT DELETE TESTS
  // ============================================
  describe('DELETE /api/projects/:id', () => {
    it('should allow only ADMIN to delete project', async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Delete test project',
          clientName: 'Test',
        },
      });

      // PM should be rejected
      const pmResponse = await app.inject({
        method: 'DELETE',
        url: `/api/projects/${project.id}`,
        headers: { Authorization: `Bearer ${users.pm.token}` },
      });
      expect(pmResponse.statusCode).toBe(403);

      // Admin should succeed
      const adminResponse = await app.inject({
        method: 'DELETE',
        url: `/api/projects/${project.id}`,
        headers: { Authorization: `Bearer ${users.admin.token}` },
      });
      expect(adminResponse.statusCode).toBe(200);

      const deleted = await prisma.project.findUnique({ where: { id: project.id } });
      expect(deleted).toBeNull();
    });

    it('should cascade delete all related data when project is deleted', async () => {
      // Create project with full hierarchy
      const project = await prisma.project.create({
        data: { name: 'Full cascade test', clientName: 'Test' },
      });

      const building = await prisma.building.create({
        data: { projectId: project.id, name: 'Building' },
      });

      const floor = await prisma.floor.create({
        data: { buildingId: building.id, name: 'Floor', level: 1 },
      });

      const room = await prisma.room.create({
        data: { floorId: floor.id, name: 'Room' },
      });

      const issue = await prisma.issue.create({
        data: { projectId: project.id, title: 'Issue', createdById: users.admin.id },
      });

      const inventory = await prisma.inventoryItem.create({
        data: { projectId: project.id, itemType: 'Test', description: 'Test' },
      });

      // Delete project
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/projects/${project.id}`,
        headers: { Authorization: `Bearer ${users.admin.token}` },
      });

      expect(response.statusCode).toBe(200);

      // Verify all related data deleted
      expect(await prisma.floor.findUnique({ where: { id: floor.id } })).toBeNull();
      expect(await prisma.room.findUnique({ where: { id: room.id } })).toBeNull();
      expect(await prisma.issue.findUnique({ where: { id: issue.id } })).toBeNull();
      expect(await prisma.inventoryItem.findUnique({ where: { id: inventory.id } })).toBeNull();
    });
  });

  // ============================================
  // UNAUTHENTICATED REQUESTS
  // ============================================
  describe('Unauthenticated requests', () => {
    it('should reject delete without token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/inventory/${testData.inventoryItem.id}`,
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
