import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { pdfService } from '../services/pdf.service.js';

export async function reportRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // GET /api/reports/project/:projectId/summary - Project summary report
  app.get('/project/:projectId/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    // Get floors with rooms
    const floors = await prisma.floor.findMany({
      where: { building: { projectId } },
      include: {
        rooms: true,
        _count: { select: { rooms: true } },
      },
      orderBy: { level: 'asc' },
    });

    // Get all rooms for the project
    const allRooms = floors.flatMap(f => f.rooms);
    const roomStats = {
      total: allRooms.length,
      notStarted: allRooms.filter(r => r.status === 'NOT_STARTED').length,
      inProgress: allRooms.filter(r => r.status === 'IN_PROGRESS').length,
      completed: allRooms.filter(r => r.status === 'COMPLETED').length,
      blocked: allRooms.filter(r => r.status === 'BLOCKED').length,
    };

    // Get assets
    const roomIds = allRooms.map(r => r.id);
    const assets = await prisma.asset.findMany({
      where: { roomId: { in: roomIds } },
      include: {
        assetType: true,
      },
    });

    const assetStats = {
      total: assets.length,
      planned: assets.filter(a => a.status === 'PLANNED').length,
      inStock: assets.filter(a => a.status === 'IN_STOCK').length,
      installed: assets.filter(a => a.status === 'INSTALLED').length,
      configured: assets.filter(a => a.status === 'CONFIGURED').length,
      verified: assets.filter(a => a.status === 'VERIFIED').length,
      faulty: assets.filter(a => a.status === 'FAULTY').length,
    };

    // Get checklists
    const assetIds = assets.map(a => a.id);
    const checklists = await prisma.checklist.findMany({
      where: { assetId: { in: assetIds } },
      include: {
        items: true,
      },
    });

    const totalItems = checklists.reduce((sum, c) => sum + c.items.length, 0);
    const completedItems = checklists.reduce(
      (sum, c) => sum + c.items.filter(i => i.completed).length,
      0
    );

    const checklistStats = {
      total: checklists.length,
      totalItems,
      completedItems,
      completionRate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      byType: {
        cabling: checklists.filter(c => c.type === 'CABLING').length,
        equipment: checklists.filter(c => c.type === 'EQUIPMENT').length,
        config: checklists.filter(c => c.type === 'CONFIG').length,
        documentation: checklists.filter(c => c.type === 'DOCUMENTATION').length,
      },
    };

    // Get issues
    const issues = await prisma.issue.findMany({
      where: { projectId },
    });

    const issueStats = {
      total: issues.length,
      open: issues.filter(i => i.status === 'OPEN').length,
      inProgress: issues.filter(i => i.status === 'IN_PROGRESS').length,
      resolved: issues.filter(i => i.status === 'RESOLVED').length,
      closed: issues.filter(i => i.status === 'CLOSED').length,
      byPriority: {
        critical: issues.filter(i => i.priority === 'CRITICAL').length,
        high: issues.filter(i => i.priority === 'HIGH').length,
        medium: issues.filter(i => i.priority === 'MEDIUM').length,
        low: issues.filter(i => i.priority === 'LOW').length,
      },
    };

    // Get inventory
    const inventory = await prisma.inventoryItem.findMany({
      where: { projectId },
    });

    const inventoryStats = {
      totalItems: inventory.length,
      totalReceived: inventory.reduce((sum, i) => sum + i.quantityReceived, 0),
      totalUsed: inventory.reduce((sum, i) => sum + i.quantityUsed, 0),
      totalInStock: inventory.reduce((sum, i) => sum + (i.quantityReceived - i.quantityUsed), 0),
    };

    // Calculate overall progress (verified = fully complete)
    const overallProgress = {
      rooms: roomStats.total > 0 ? Math.round((roomStats.completed / roomStats.total) * 100) : 0,
      assets: assetStats.total > 0 ? Math.round((assetStats.verified / assetStats.total) * 100) : 0,
      checklists: checklistStats.completionRate,
      issues: issueStats.total > 0 ? Math.round(((issueStats.resolved + issueStats.closed) / issueStats.total) * 100) : 0,
    };

    return reply.send({
      project: {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        location: project.location,
        status: project.status,
        createdAt: project.createdAt,
        team: project.members.map(m => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
        })),
      },
      floors: floors.map(f => ({
        id: f.id,
        name: f.name,
        level: f.level,
        roomCount: f._count.rooms,
      })),
      stats: {
        rooms: roomStats,
        assets: assetStats,
        checklists: checklistStats,
        issues: issueStats,
        inventory: inventoryStats,
      },
      progress: overallProgress,
      generatedAt: new Date().toISOString(),
    });
  });

  // GET /api/reports/project/:projectId/internal - Internal (technical) report
  app.get('/project/:projectId/internal', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const user = request.user as { role: string };

    // Only ADMIN and PM can view internal reports
    if (user.role !== 'ADMIN' && user.role !== 'PM') {
      return reply.status(403).send({ error: 'Access denied' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    // Get floors with rooms
    const floors = await prisma.floor.findMany({
      where: { building: { projectId } },
      include: {
        rooms: {
          include: {
            assets: {
              include: {
                assetType: true,
                checklists: {
                  include: {
                    items: true,
                    assignedTo: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { level: 'asc' },
    });

    // Get issues with details
    const issues = await prisma.issue.findMany({
      where: { projectId },
      include: {
        room: {
          include: {
            floor: { select: { name: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    // Get inventory with logs
    const inventory = await prisma.inventoryItem.findMany({
      where: { projectId },
      include: {
        logs: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { itemType: 'asc' },
    });

    // Get recent activity (last 50 checklist completions)
    const recentActivity = await prisma.checklistItem.findMany({
      where: {
        completed: true,
        checklist: {
          asset: {
            room: {
              floor: { building: { projectId } },
            },
          },
        },
      },
      include: {
        completedBy: { select: { id: true, name: true } },
        checklist: {
          include: {
            asset: {
              include: {
                room: {
                  include: {
                    floor: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 50,
    });

    // Technician workload - simplified query
    const technicians = await prisma.user.findMany({
      where: {
        role: 'TECHNICIAN',
        projectMembers: {
          some: { projectId },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Get stats for each technician
    const technicianStats = await Promise.all(
      technicians.map(async (tech) => {
        const completedItems = await prisma.checklistItem.count({
          where: {
            completedById: tech.id,
            checklist: {
              asset: {
                room: {
                  floor: { building: { projectId } },
                },
              },
            },
          },
        });

        const installedAssets = await prisma.asset.count({
          where: {
            installedById: tech.id,
            room: {
              floor: { building: { projectId } },
            },
          },
        });

        return {
          id: tech.id,
          name: tech.name,
          checklistItemsCompleted: completedItems,
          assetsInstalled: installedAssets,
        };
      })
    );

    return reply.send({
      project: {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        location: project.location,
        status: project.status,
      },
      floors: floors.map(floor => ({
        id: floor.id,
        name: floor.name,
        level: floor.level,
        rooms: floor.rooms.map(room => ({
          id: room.id,
          name: room.name,
          type: room.type,
          status: room.status,
          assets: room.assets.map(asset => ({
            id: asset.id,
            name: asset.name,
            type: asset.assetType?.name,
            model: asset.model,
            serialNumber: asset.serialNumber,
            status: asset.status,
            checklists: asset.checklists.map(cl => ({
              type: cl.type,
              status: cl.status,
              assignedTo: cl.assignedTo?.name,
              itemsTotal: cl.items.length,
              itemsCompleted: cl.items.filter(i => i.completed).length,
            })),
          })),
        })),
      })),
      issues: issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        status: issue.status,
        causedBy: issue.causedBy,
        location: issue.room ? `${issue.room.floor?.name} / ${issue.room.name}` : null,
        createdBy: issue.createdBy?.name,
        createdAt: issue.createdAt,
        resolvedAt: issue.resolvedAt,
        comments: issue.comments.map(c => ({
          user: c.user?.name,
          comment: c.comment,
          createdAt: c.createdAt,
        })),
      })),
      inventory: inventory.map(item => ({
        id: item.id,
        itemType: item.itemType,
        description: item.description,
        unit: item.unit,
        received: item.quantityReceived,
        used: item.quantityUsed,
        inStock: item.quantityReceived - item.quantityUsed,
        recentLogs: item.logs.map(log => ({
          action: log.action,
          quantity: log.quantity,
          user: log.user?.name,
          notes: log.notes,
          createdAt: log.createdAt,
        })),
      })),
      technicianStats,
      recentActivity: recentActivity.map(item => ({
        itemName: item.name,
        assetName: item.checklist.asset.name,
        location: `${item.checklist.asset.room.floor?.name} / ${item.checklist.asset.room.name}`,
        completedBy: item.completedBy?.name,
        completedAt: item.completedAt,
      })),
      generatedAt: new Date().toISOString(),
    });
  });

  // GET /api/reports/project/:projectId/client - Client (external) report
  app.get('/project/:projectId/client', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    // Get floors with rooms (simplified for client)
    const floors = await prisma.floor.findMany({
      where: { building: { projectId } },
      include: {
        rooms: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            _count: {
              select: { assets: true },
            },
          },
        },
        _count: { select: { rooms: true } },
      },
      orderBy: { level: 'asc' },
    });

    // Calculate completion by floor
    const floorProgress = floors.map(floor => {
      const total = floor.rooms.length;
      const completed = floor.rooms.filter(r => r.status === 'COMPLETED').length;
      return {
        id: floor.id,
        name: floor.name,
        level: floor.level,
        totalRooms: total,
        completedRooms: completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        rooms: floor.rooms.map(room => ({
          id: room.id,
          name: room.name,
          type: room.type,
          status: room.status,
          assetCount: room._count.assets,
        })),
      };
    });

    // Get all rooms for summary
    const allRooms = floors.flatMap(f => f.rooms);
    const roomIds = allRooms.map(r => r.id);

    // Get assets count by type
    const assets = await prisma.asset.findMany({
      where: { roomId: { in: roomIds } },
      include: { assetType: true },
    });

    const assetsByType = assets.reduce((acc, asset) => {
      const type = asset.assetType?.name || 'Other';
      if (!acc[type]) {
        acc[type] = { total: 0, completed: 0 };
      }
      acc[type].total++;
      if (asset.status === 'VERIFIED') {
        acc[type].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    // Get open issues count (without details for client)
    const openIssues = await prisma.issue.count({
      where: {
        projectId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });

    // Get signatures
    const signatures = await prisma.signature.findMany({
      where: { projectId },
      include: {
        room: {
          include: {
            floor: { select: { name: true } },
          },
        },
      },
      orderBy: { signedAt: 'desc' },
    });

    // Overall progress calculation
    const totalRooms = allRooms.length;
    const completedRooms = allRooms.filter(r => r.status === 'COMPLETED').length;
    const totalAssets = assets.length;
    const completedAssets = assets.filter(a => a.status === 'VERIFIED').length;

    return reply.send({
      project: {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        location: project.location,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
      },
      summary: {
        totalFloors: floors.length,
        totalRooms,
        completedRooms,
        roomCompletionRate: totalRooms > 0 ? Math.round((completedRooms / totalRooms) * 100) : 0,
        totalAssets,
        completedAssets,
        assetCompletionRate: totalAssets > 0 ? Math.round((completedAssets / totalAssets) * 100) : 0,
        openIssues,
        signatureCount: signatures.length,
      },
      floorProgress,
      assetsByType: Object.entries(assetsByType).map(([type, stats]) => ({
        type,
        total: stats.total,
        completed: stats.completed,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      })),
      signatures: signatures.map(sig => ({
        id: sig.id,
        type: sig.type,
        location: sig.room ? `${sig.room.floor?.name} / ${sig.room.name}` : 'Project Level',
        signedByName: sig.signedByName,
        signedAt: sig.signedAt,
      })),
      generatedAt: new Date().toISOString(),
    });
  });

  // GET /api/reports/project/:projectId/assets - Asset inventory report
  app.get('/project/:projectId/assets', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    // Get all assets with full details
    const floors = await prisma.floor.findMany({
      where: { building: { projectId } },
      include: {
        rooms: {
          include: {
            assets: {
              include: {
                assetType: true,
                installedBy: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { level: 'asc' },
    });

    const assets = floors.flatMap(floor =>
      floor.rooms.flatMap(room =>
        room.assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          type: asset.assetType?.name,
          model: asset.model,
          serialNumber: asset.serialNumber,
          macAddress: asset.macAddress,
          ipAddress: asset.ipAddress,
          status: asset.status,
          floor: floor.name,
          room: room.name,
          installedBy: asset.installedBy?.name,
          installedAt: asset.installedAt,
        }))
      )
    );

    // Group by type
    const assetsByType = assets.reduce((acc, asset) => {
      const type = asset.type || 'Other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(asset);
      return acc;
    }, {} as Record<string, typeof assets>);

    // Group by status
    const assetsByStatus = {
      planned: assets.filter(a => a.status === 'PLANNED'),
      inStock: assets.filter(a => a.status === 'IN_STOCK'),
      installed: assets.filter(a => a.status === 'INSTALLED'),
      configured: assets.filter(a => a.status === 'CONFIGURED'),
      verified: assets.filter(a => a.status === 'VERIFIED'),
      faulty: assets.filter(a => a.status === 'FAULTY'),
    };

    return reply.send({
      project: {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
      },
      summary: {
        total: assets.length,
        byStatus: {
          planned: assetsByStatus.planned.length,
          inStock: assetsByStatus.inStock.length,
          installed: assetsByStatus.installed.length,
          configured: assetsByStatus.configured.length,
          verified: assetsByStatus.verified.length,
          faulty: assetsByStatus.faulty.length,
        },
      },
      assetsByType,
      assets,
      generatedAt: new Date().toISOString(),
    });
  });

  // ============================================
  // PDF Generation & History
  // ============================================

  // POST /api/reports/project/:projectId/export/:type - Generate PDF
  app.post('/project/:projectId/export/:type', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId, type } = request.params as { projectId: string; type: string };
    const user = request.user as { id: string; role: string };

    // Validate type
    const validTypes = ['summary', 'client', 'internal'];
    if (!validTypes.includes(type)) {
      return reply.status(400).send({ error: 'Invalid report type' });
    }

    // Check permissions for internal report
    if (type === 'internal' && user.role !== 'ADMIN' && user.role !== 'PM') {
      return reply.status(403).send({ error: 'Access denied' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    try {
      let htmlContent: string;
      let title: string;

      // Get report data directly from database based on type
      if (type === 'summary') {
        // Get summary data directly
        const projectWithMembers = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, role: true } },
              },
            },
          },
        });

        const floors = await prisma.floor.findMany({
          where: { building: { projectId } },
          include: { rooms: true },
        });

        const allRooms = floors.flatMap(f => f.rooms);
        const roomIds = allRooms.map(r => r.id);

        const assets = await prisma.asset.findMany({
          where: { roomId: { in: roomIds } },
        });

        const checklists = await prisma.checklist.findMany({
          where: { assetId: { in: assets.map(a => a.id) } },
          include: { items: true },
        });

        const issues = await prisma.issue.findMany({
          where: { projectId },
        });

        const inventory = await prisma.inventoryItem.findMany({
          where: { projectId },
        });

        const totalItems = checklists.reduce((sum, c) => sum + c.items.length, 0);
        const completedItems = checklists.reduce((sum, c) => sum + c.items.filter(i => i.completed).length, 0);

        const reportData = {
          project: {
            name: projectWithMembers?.name,
            clientName: projectWithMembers?.clientName,
            team: projectWithMembers?.members.map(m => ({
              name: m.user.name,
              email: m.user.email,
              role: m.role,
            })) || [],
          },
          progress: {
            rooms: allRooms.length > 0 ? Math.round((allRooms.filter(r => r.status === 'COMPLETED').length / allRooms.length) * 100) : 0,
            assets: assets.length > 0 ? Math.round((assets.filter(a => a.status === 'VERIFIED').length / assets.length) * 100) : 0,
            checklists: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
            issues: issues.length > 0 ? Math.round(((issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length) / issues.length) * 100) : 0,
          },
          stats: {
            rooms: {
              total: allRooms.length,
              completed: allRooms.filter(r => r.status === 'COMPLETED').length,
              inProgress: allRooms.filter(r => r.status === 'IN_PROGRESS').length,
              notStarted: allRooms.filter(r => r.status === 'NOT_STARTED').length,
              blocked: allRooms.filter(r => r.status === 'BLOCKED').length,
            },
            issues: {
              total: issues.length,
              open: issues.filter(i => i.status === 'OPEN').length,
              inProgress: issues.filter(i => i.status === 'IN_PROGRESS').length,
              resolved: issues.filter(i => i.status === 'RESOLVED').length,
              closed: issues.filter(i => i.status === 'CLOSED').length,
            },
            inventory: {
              totalItems: inventory.length,
              totalReceived: inventory.reduce((sum, i) => sum + i.quantityReceived, 0),
              totalUsed: inventory.reduce((sum, i) => sum + i.quantityUsed, 0),
              totalInStock: inventory.reduce((sum, i) => sum + (i.quantityReceived - i.quantityUsed), 0),
            },
          },
        };

        htmlContent = pdfService.generateSummaryHTML(reportData);
        title = 'Project Summary Report';
      } else if (type === 'client') {
        // Get client data directly
        const floors = await prisma.floor.findMany({
          where: { building: { projectId } },
          include: {
            rooms: {
              select: {
                id: true,
                name: true,
                type: true,
                status: true,
                _count: { select: { assets: true } },
              },
            },
          },
          orderBy: { level: 'asc' },
        });

        const allRooms = floors.flatMap(f => f.rooms);
        const roomIds = allRooms.map(r => r.id);

        const assets = await prisma.asset.findMany({
          where: { roomId: { in: roomIds } },
          include: { assetType: true },
        });

        const signatures = await prisma.signature.findMany({
          where: { projectId },
          include: {
            room: { include: { floor: { select: { name: true } } } },
          },
        });

        const assetsByType = assets.reduce((acc, asset) => {
          const typeName = asset.assetType?.name || 'Other';
          if (!acc[typeName]) {
            acc[typeName] = { total: 0, completed: 0 };
          }
          acc[typeName].total++;
          if (asset.status === 'VERIFIED') {
            acc[typeName].completed++;
          }
          return acc;
        }, {} as Record<string, { total: number; completed: number }>);

        const reportData = {
          project: { name: project.name, clientName: project.clientName },
          summary: {
            totalRooms: allRooms.length,
            completedRooms: allRooms.filter(r => r.status === 'COMPLETED').length,
            roomCompletionRate: allRooms.length > 0 ? Math.round((allRooms.filter(r => r.status === 'COMPLETED').length / allRooms.length) * 100) : 0,
            totalAssets: assets.length,
            completedAssets: assets.filter(a => a.status === 'VERIFIED').length,
            assetCompletionRate: assets.length > 0 ? Math.round((assets.filter(a => a.status === 'VERIFIED').length / assets.length) * 100) : 0,
            openIssues: await prisma.issue.count({ where: { projectId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
            signatureCount: signatures.length,
          },
          floorProgress: floors.map(floor => {
            const total = floor.rooms.length;
            const completed = floor.rooms.filter(r => r.status === 'COMPLETED').length;
            return {
              name: floor.name,
              level: floor.level,
              totalRooms: total,
              completedRooms: completed,
              completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            };
          }),
          assetsByType: Object.entries(assetsByType).map(([typeName, stats]) => ({
            type: typeName,
            total: stats.total,
            completed: stats.completed,
            completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
          })),
          signatures: signatures.map(sig => ({
            signedByName: sig.signedByName,
            location: sig.room ? `${sig.room.floor?.name} / ${sig.room.name}` : 'Project Level',
            type: sig.type,
            signedAt: sig.signedAt,
          })),
        };

        htmlContent = pdfService.generateClientHTML(reportData);
        title = 'Client Progress Report';
      } else {
        // Internal report - fetch all detailed data
        title = 'Internal Technical Report';

        // Get technician stats
        const technicians = await prisma.user.findMany({
          where: {
            role: 'TECHNICIAN',
            projectMembers: { some: { projectId } },
          },
          select: { id: true, name: true },
        });

        const technicianStats = await Promise.all(
          technicians.map(async (tech) => {
            const completedItems = await prisma.checklistItem.count({
              where: {
                completedById: tech.id,
                checklist: { asset: { room: { floor: { building: { projectId } } } } },
              },
            });
            const installedAssets = await prisma.asset.count({
              where: {
                installedById: tech.id,
                room: { floor: { building: { projectId } } },
              },
            });
            return {
              name: tech.name,
              checklistItemsCompleted: completedItems,
              assetsInstalled: installedAssets,
            };
          })
        );

        // Get issues
        const issues = await prisma.issue.findMany({
          where: { projectId },
          include: {
            room: { include: { floor: { select: { name: true } } } },
          },
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        });

        // Get inventory
        const inventory = await prisma.inventoryItem.findMany({
          where: { projectId },
          orderBy: { itemType: 'asc' },
        });

        // Get recent activity
        const recentActivity = await prisma.checklistItem.findMany({
          where: {
            completed: true,
            checklist: { asset: { room: { floor: { building: { projectId } } } } },
          },
          include: {
            completedBy: { select: { name: true } },
            checklist: {
              include: {
                asset: {
                  include: {
                    room: { include: { floor: { select: { name: true } } } },
                  },
                },
              },
            },
          },
          orderBy: { completedAt: 'desc' },
          take: 20,
        });

        const reportData = {
          technicianStats,
          issues: issues.map(i => ({
            title: i.title,
            description: i.description,
            priority: i.priority,
            status: i.status,
            location: i.room ? `${i.room.floor?.name} / ${i.room.name}` : null,
            createdAt: i.createdAt,
          })),
          inventory: inventory.map(item => ({
            itemType: item.itemType,
            description: item.description,
            unit: item.unit,
            received: item.quantityReceived,
            used: item.quantityUsed,
            inStock: item.quantityReceived - item.quantityUsed,
          })),
          recentActivity: recentActivity.map(a => ({
            itemName: a.name,
            assetName: a.checklist.asset.name,
            location: `${a.checklist.asset.room.floor?.name} / ${a.checklist.asset.room.name}`,
            completedBy: a.completedBy?.name,
            completedAt: a.completedAt,
          })),
        };

        htmlContent = pdfService.generateInternalHTML(reportData);
      }

      // Generate PDF
      const { buffer, filename } = await pdfService.generatePDF({
        title,
        projectName: project.name,
        clientName: project.clientName || undefined,
        generatedAt: new Date().toISOString(),
        content: htmlContent,
      });

      // Save to storage
      const fileUrl = await pdfService.savePDFToStorage(buffer, filename);

      // Save to database
      const reportTypeMap: Record<string, 'SUMMARY' | 'CLIENT' | 'INTERNAL' | 'ASSETS'> = {
        summary: 'SUMMARY',
        client: 'CLIENT',
        internal: 'INTERNAL',
      };

      const generatedReport = await prisma.generatedReport.create({
        data: {
          projectId,
          type: reportTypeMap[type],
          title,
          fileUrl,
          fileSize: buffer.length,
          generatedById: user.id,
        },
        include: {
          generatedBy: { select: { id: true, name: true } },
        },
      });

      return reply.send({
        url: fileUrl,
        filename,
        size: buffer.length,
        reportId: generatedReport.id,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      return reply.status(500).send({ error: 'Failed to generate PDF' });
    }
  });

  // GET /api/reports/project/:projectId/history - Get report history
  app.get('/project/:projectId/history', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const reports = await prisma.generatedReport.findMany({
      where: { projectId },
      include: {
        generatedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reply.send(reports);
  });

  // DELETE /api/reports/generated/:reportId - Delete a generated report
  app.delete('/generated/:reportId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { reportId } = request.params as { reportId: string };
    const user = request.user as { role: string };

    // Only ADMIN can delete reports
    if (user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Access denied' });
    }

    await prisma.generatedReport.delete({
      where: { id: reportId },
    });

    return reply.send({ message: 'Report deleted' });
  });
}
