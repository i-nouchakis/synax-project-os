import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import { prisma } from '../utils/prisma.js';

export async function dashboardRoutes(app: FastifyInstance) {
  // Apply authentication to all routes
  app.addHook('preHandler', authenticate);

  // GET /api/dashboard/stats - Get dashboard statistics
  app.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };

    // Base filter for projects (admins/PMs see all, others see assigned only)
    const projectWhere = ['ADMIN', 'PM'].includes(user.role)
      ? {}
      : { members: { some: { userId: user.id } } };

    // Count projects by status
    const [
      totalProjects,
      activeProjects,
      totalFloors,
      totalRooms,
      totalAssets,
      openIssues,
      resolvedIssues,
      completedChecklists,
      totalChecklists,
    ] = await Promise.all([
      // Total projects
      prisma.project.count({ where: projectWhere }),
      // Active projects (not completed/archived)
      prisma.project.count({
        where: {
          ...projectWhere,
          status: { in: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD'] },
        },
      }),
      // Total floors
      prisma.floor.count({
        where: { building: { project: projectWhere } },
      }),
      // Total rooms
      prisma.room.count({
        where: { floor: { building: { project: projectWhere } } },
      }),
      // Total assets
      prisma.asset.count({
        where: { room: { floor: { building: { project: projectWhere } } } },
      }),
      // Open issues
      prisma.issue.count({
        where: {
          project: projectWhere,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }),
      // Resolved issues
      prisma.issue.count({
        where: {
          project: projectWhere,
          status: 'RESOLVED',
        },
      }),
      // Completed checklist items
      prisma.checklistItem.count({
        where: {
          checklist: { asset: { room: { floor: { building: { project: projectWhere } } } } },
          completed: true,
        },
      }),
      // Total checklist items
      prisma.checklistItem.count({
        where: {
          checklist: { asset: { room: { floor: { building: { project: projectWhere } } } } },
        },
      }),
    ]);

    // Calculate completion percentage
    const checklistCompletionRate = totalChecklists > 0
      ? Math.round((completedChecklists / totalChecklists) * 100)
      : 0;

    return reply.send({
      stats: {
        totalProjects,
        activeProjects,
        totalFloors,
        totalRooms,
        totalAssets,
        openIssues,
        resolvedIssues,
        totalIssues: openIssues + resolvedIssues,
        completedChecklists,
        totalChecklists,
        checklistCompletionRate,
      },
    });
  });

  // GET /api/dashboard/activity - Get recent activity
  app.get('/activity', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };
    const limit = 10;

    // Base filter for projects
    const projectWhere = ['ADMIN', 'PM'].includes(user.role)
      ? {}
      : { members: { some: { userId: user.id } } };

    // Get recent issues
    const recentIssues = await prisma.issue.findMany({
      where: { project: projectWhere },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: { name: true },
        },
        room: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    // Get recent checklist completions
    const recentChecklists = await prisma.checklistItem.findMany({
      where: {
        completed: true,
        checklist: { asset: { room: { floor: { building: { project: projectWhere } } } } },
      },
      select: {
        id: true,
        description: true,
        completedAt: true,
        completedBy: {
          select: { name: true },
        },
        checklist: {
          select: {
            asset: {
              select: {
                name: true,
                room: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    // Get recent assets
    const recentAssets = await prisma.asset.findMany({
      where: { room: { floor: { building: { project: projectWhere } } } },
      select: {
        id: true,
        name: true,
        createdAt: true,
        assetType: {
          select: { name: true },
        },
        room: {
          select: {
            name: true,
            floor: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Combine and sort all activities
    const activities = [
      ...recentIssues.map((issue) => ({
        id: issue.id,
        type: 'issue' as const,
        title: issue.status === 'OPEN' ? 'New Issue Reported' : `Issue ${issue.status.toLowerCase().replace('_', ' ')}`,
        description: `${issue.title}${issue.room ? ` - ${issue.room.name}` : ''}`,
        timestamp: issue.updatedAt,
        user: issue.createdBy?.name || 'Unknown',
        priority: issue.priority,
      })),
      ...recentChecklists
        .filter((item) => item.completedAt)
        .map((item) => ({
          id: item.id,
          type: 'checklist' as const,
          title: 'Checklist Completed',
          description: `${item.description || 'Item'} - ${item.checklist?.asset?.room?.name || 'Unknown room'}`,
          timestamp: item.completedAt!,
          user: item.completedBy?.name || 'Unknown',
        })),
      ...recentAssets.map((asset) => ({
        id: asset.id,
        type: 'asset' as const,
        title: 'Asset Installed',
        description: `${asset.assetType?.name || asset.name} - ${asset.room?.floor?.name}, ${asset.room?.name}`,
        timestamp: asset.createdAt,
        user: 'System',
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return reply.send({ activities });
  });

  // GET /api/dashboard/charts - Get chart data for dashboard
  app.get('/charts', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };

    const projectWhere = ['ADMIN', 'PM'].includes(user.role)
      ? {}
      : { members: { some: { userId: user.id } } };

    // Fetch all data in parallel
    const [projects, allFloors, allRooms, allAssets, allIssues, allChecklistItems] = await Promise.all([
      // Active projects (not archived)
      prisma.project.findMany({
        where: { ...projectWhere, status: { not: 'ARCHIVED' } },
        select: { id: true, name: true, status: true },
        orderBy: { updatedAt: 'desc' },
        take: 8,
      }),
      // All floors with room counts
      prisma.floor.findMany({
        where: { building: { project: projectWhere } },
        select: {
          id: true,
          rooms: { select: { status: true } },
        },
      }),
      // All rooms
      prisma.room.findMany({
        where: { floor: { building: { project: projectWhere } } },
        select: {
          id: true,
          status: true,
          floor: { select: { building: { select: { projectId: true } } } },
        },
      }),
      // All assets (room-level + floor-level + project-level)
      prisma.asset.findMany({
        where: {
          OR: [
            { room: { floor: { building: { project: projectWhere } } } },
            { floor: { building: { project: projectWhere } } },
            { project: projectWhere },
          ],
        },
        select: {
          id: true,
          status: true,
          projectId: true,
          room: { select: { floor: { select: { building: { select: { projectId: true } } } } } },
          floor: { select: { building: { select: { projectId: true } } } },
        },
      }),
      // All issues
      prisma.issue.findMany({
        where: { project: projectWhere },
        select: { id: true, status: true, priority: true, projectId: true },
      }),
      // All checklist items
      prisma.checklistItem.findMany({
        where: {
          checklist: {
            asset: {
              OR: [
                { room: { floor: { building: { project: projectWhere } } } },
                { floor: { building: { project: projectWhere } } },
                { project: projectWhere },
              ],
            },
          },
        },
        select: {
          id: true,
          completed: true,
          checklist: { select: { type: true } },
        },
      }),
    ]);

    // Build project status breakdown
    const projectStatusBreakdown = projects.map((project) => {
      const pRooms = allRooms.filter(r => r.floor.building.projectId === project.id);
      const pAssets = allAssets.filter(a => {
        const pid = a.projectId || a.room?.floor?.building?.projectId || a.floor?.building?.projectId;
        return pid === project.id;
      });
      const pIssues = allIssues.filter(i => i.projectId === project.id);

      const roomsCompleted = pRooms.filter(r => r.status === 'COMPLETED').length;
      const roomsInProgress = pRooms.filter(r => r.status === 'IN_PROGRESS').length;
      const roomsBlocked = pRooms.filter(r => r.status === 'BLOCKED').length;

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        roomsTotal: pRooms.length,
        roomsCompleted,
        roomsInProgress,
        roomsBlocked,
        assetsTotal: pAssets.length,
        assetsVerified: pAssets.filter(a => a.status === 'VERIFIED').length,
        issuesOpen: pIssues.filter(i => ['OPEN', 'IN_PROGRESS'].includes(i.status)).length,
        issuesTotal: pIssues.length,
        overallProgress: pRooms.length > 0 ? Math.round((roomsCompleted / pRooms.length) * 100) : 0,
      };
    });

    // Aggregated counts
    const issuesByPriority = {
      critical: allIssues.filter(i => i.priority === 'CRITICAL').length,
      high: allIssues.filter(i => i.priority === 'HIGH').length,
      medium: allIssues.filter(i => i.priority === 'MEDIUM').length,
      low: allIssues.filter(i => i.priority === 'LOW').length,
    };

    const issuesByStatus = {
      open: allIssues.filter(i => i.status === 'OPEN').length,
      inProgress: allIssues.filter(i => i.status === 'IN_PROGRESS').length,
      resolved: allIssues.filter(i => i.status === 'RESOLVED').length,
      closed: allIssues.filter(i => i.status === 'CLOSED').length,
    };

    const assetsByStatus = {
      planned: allAssets.filter(a => a.status === 'PLANNED').length,
      inStock: allAssets.filter(a => a.status === 'IN_STOCK').length,
      installed: allAssets.filter(a => a.status === 'INSTALLED').length,
      configured: allAssets.filter(a => a.status === 'CONFIGURED').length,
      verified: allAssets.filter(a => a.status === 'VERIFIED').length,
      faulty: allAssets.filter(a => a.status === 'FAULTY').length,
    };

    const roomsByStatus = {
      notStarted: allRooms.filter(r => r.status === 'NOT_STARTED').length,
      inProgress: allRooms.filter(r => r.status === 'IN_PROGRESS').length,
      completed: allRooms.filter(r => r.status === 'COMPLETED').length,
      blocked: allRooms.filter(r => r.status === 'BLOCKED').length,
    };

    // Floor progress - derive status from room statuses
    const floorsByProgress = {
      total: allFloors.length,
      completed: allFloors.filter(f => f.rooms.length > 0 && f.rooms.every(r => r.status === 'COMPLETED')).length,
      inProgress: allFloors.filter(f => {
        const hasStarted = f.rooms.some(r => ['IN_PROGRESS', 'COMPLETED'].includes(r.status));
        const allDone = f.rooms.length > 0 && f.rooms.every(r => r.status === 'COMPLETED');
        return hasStarted && !allDone;
      }).length,
      notStarted: allFloors.filter(f => f.rooms.length === 0 || f.rooms.every(r => r.status === 'NOT_STARTED')).length,
      hasBlocked: allFloors.filter(f => f.rooms.some(r => r.status === 'BLOCKED')).length,
    };

    const checklistByType = (type: string) => {
      const items = allChecklistItems.filter(i => i.checklist.type === type);
      return { total: items.length, completed: items.filter(i => i.completed).length };
    };

    const completedItems = allChecklistItems.filter(i => i.completed).length;
    const checklistProgress = {
      totalItems: allChecklistItems.length,
      completedItems,
      completionRate: allChecklistItems.length > 0
        ? Math.round((completedItems / allChecklistItems.length) * 100) : 0,
      byType: {
        cabling: checklistByType('CABLING'),
        equipment: checklistByType('EQUIPMENT'),
        config: checklistByType('CONFIG'),
        documentation: checklistByType('DOCUMENTATION'),
      },
    };

    return reply.send({
      projectStatusBreakdown,
      issuesByPriority,
      issuesByStatus,
      assetsByStatus,
      roomsByStatus,
      floorsByProgress,
      checklistProgress,
    });
  });

  // GET /api/dashboard/projects-summary - Get projects summary
  app.get('/projects-summary', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; role: string };

    const projectWhere = ['ADMIN', 'PM'].includes(user.role)
      ? {}
      : { members: { some: { userId: user.id } } };

    const projects = await prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true,
        name: true,
        status: true,
        clientName: true,
        _count: {
          select: {
            buildings: true,
            issues: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    return reply.send({ projects });
  });
}
