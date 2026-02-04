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
