import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendValidationError } from '../utils/errors.js';

const EVENT_TYPES = ['APPOINTMENT', 'REMINDER', 'DEADLINE', 'MEETING', 'INSPECTION', 'DELIVERY'] as const;
const ATTENDEE_STATUSES = ['PENDING', 'ACCEPTED', 'DECLINED'] as const;
const RECURRENCE_RULES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;

const attendeesInclude = {
  attendees: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
};

const eventInclude = {
  project: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  ...attendeesInclude,
};

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  allDay: z.boolean().optional().default(false),
  type: z.enum(EVENT_TYPES).optional().default('REMINDER'),
  color: z.string().max(20).optional().nullable(),
  projectId: z.string().optional().nullable(),
  attendeeIds: z.array(z.string()).optional(),
  recurrenceRule: z.enum(RECURRENCE_RULES).optional().nullable(),
  recurrenceInterval: z.number().int().min(1).max(99).optional().default(1),
  recurrenceEnd: z.string().optional().nullable(),
});

const updateEventSchema = createEventSchema.partial();

// Check for overlapping events for a user
async function checkOverlaps(userId: string, startDate: Date, endDate: Date | null, excludeEventId?: string) {
  const effectiveEnd = endDate || new Date(startDate.getTime() + 60 * 60 * 1000); // default 1hr

  const where: Record<string, unknown> = {
    OR: [
      { createdById: userId },
      { attendees: { some: { userId, status: { not: 'DECLINED' } } } },
    ],
    allDay: false,
    // Overlap: eventStart < ourEnd AND eventEnd > ourStart
    startDate: { lt: effectiveEnd },
  };

  if (excludeEventId) {
    where.id = { not: excludeEventId };
  }

  const overlapping = await prisma.calendarEvent.findMany({
    where: {
      ...where,
      OR: [
        // Events with endDate that overlap
        {
          endDate: { not: null, gt: startDate },
          startDate: { lt: effectiveEnd },
          ...(excludeEventId ? { id: { not: excludeEventId } } : {}),
          AND: [
            {
              OR: [
                { createdById: userId },
                { attendees: { some: { userId, status: { not: 'DECLINED' } } } },
              ],
            },
          ],
          allDay: false,
        },
        // Events without endDate (point events at the same time range)
        {
          endDate: null,
          startDate: { gte: startDate, lt: effectiveEnd },
          ...(excludeEventId ? { id: { not: excludeEventId } } : {}),
          AND: [
            {
              OR: [
                { createdById: userId },
                { attendees: { some: { userId, status: { not: 'DECLINED' } } } },
              ],
            },
          ],
          allDay: false,
        },
      ],
    },
    select: { id: true, title: true, startDate: true, endDate: true },
    take: 5,
  });

  return overlapping;
}

// Expand recurring events into virtual instances within a date range
function expandRecurringEvents(
  events: Array<Record<string, unknown>>,
  rangeStart: Date,
  rangeEnd: Date
): Array<Record<string, unknown>> {
  const result: Array<Record<string, unknown>> = [];

  for (const event of events) {
    const rule = event.recurrenceRule as string | null;

    if (!rule) {
      // Non-recurring: include as-is
      result.push(event);
      continue;
    }

    const eventStart = new Date(event.startDate as string);
    const eventEnd = event.endDate ? new Date(event.endDate as string) : null;
    const duration = eventEnd ? eventEnd.getTime() - eventStart.getTime() : 0;
    const interval = (event.recurrenceInterval as number) || 1;
    const recEnd = event.recurrenceEnd ? new Date(event.recurrenceEnd as string) : null;

    // Generate instances
    const maxInstances = 200; // safety limit
    let count = 0;
    const current = new Date(eventStart);

    while (count < maxInstances) {
      // Check bounds
      if (recEnd && current > recEnd) break;
      if (current > rangeEnd) break;

      // If this instance falls within range, add it
      if (current >= rangeStart || isSameDayUTC(current, rangeStart)) {
        const instanceDate = new Date(current);
        const instanceEnd = duration > 0 ? new Date(instanceDate.getTime() + duration) : null;

        result.push({
          ...event,
          id: `${event.id}_${instanceDate.toISOString().split('T')[0]}`,
          originalEventId: event.id,
          startDate: instanceDate,
          endDate: instanceEnd,
          isRecurring: true,
          recurrenceRule: rule,
        });
      }

      // Advance to next occurrence
      switch (rule) {
        case 'DAILY':
          current.setDate(current.getDate() + interval);
          break;
        case 'WEEKLY':
          current.setDate(current.getDate() + 7 * interval);
          break;
        case 'MONTHLY':
          current.setMonth(current.getMonth() + interval);
          break;
        case 'YEARLY':
          current.setFullYear(current.getFullYear() + interval);
          break;
      }
      count++;
    }
  }

  return result;
}

function isSameDayUTC(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export async function calendarRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /api/calendar - List events (with date range filter)
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { start, end, projectId } = request.query as {
      start?: string;
      end?: string;
      projectId?: string;
    };
    const user = request.user as { id: string };

    const where: Record<string, unknown> = {};

    // For recurring events, we need to fetch events that STARTED before the range end
    // (they may recur into the range even if their startDate is before range start)
    if (start || end) {
      const conditions: Record<string, unknown>[] = [];
      // Non-recurring: normal date range filter
      const nonRecurring: Record<string, unknown> = { recurrenceRule: null };
      if (start || end) {
        nonRecurring.startDate = {};
        if (start) (nonRecurring.startDate as Record<string, unknown>).gte = new Date(start);
        if (end) (nonRecurring.startDate as Record<string, unknown>).lte = new Date(end);
      }
      conditions.push(nonRecurring);
      // Recurring: started before range end (instances may fall within range)
      const recurring: Record<string, unknown> = {
        recurrenceRule: { not: null },
      };
      if (end) {
        recurring.startDate = { lte: new Date(end) };
      }
      conditions.push(recurring);
      where.OR_dateFilter = conditions;
    }

    // Project filter
    if (projectId) {
      where.projectId = projectId;
    }

    // Build final where with user filter
    const finalWhere: Record<string, unknown> = {};

    if (where.OR_dateFilter) {
      finalWhere.AND = [
        { OR: where.OR_dateFilter as Record<string, unknown>[] },
        {
          OR: [
            { createdById: user.id },
            { attendees: { some: { userId: user.id } } },
          ],
        },
      ];
      if (projectId) finalWhere.projectId = projectId;
    } else {
      finalWhere.OR = [
        { createdById: user.id },
        { attendees: { some: { userId: user.id } } },
      ];
      if (projectId) finalWhere.projectId = projectId;
    }

    const events = await prisma.calendarEvent.findMany({
      where: finalWhere,
      orderBy: { startDate: 'asc' },
      include: eventInclude,
    });

    // Expand recurring events into virtual instances
    let expandedEvents;
    if (start && end) {
      expandedEvents = expandRecurringEvents(
        events as unknown as Array<Record<string, unknown>>,
        new Date(start),
        new Date(end)
      );
    } else {
      // No date range - add flags but don't expand
      expandedEvents = events.map(e => ({
        ...e,
        isRecurring: !!e.recurrenceRule,
        originalEventId: e.recurrenceRule ? e.id : undefined,
      }));
    }

    return reply.send({ events: expandedEvents });
  });

  // GET /api/calendar/:id - Get single event
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      include: eventInclude,
    });

    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    return reply.send({ event });
  });

  // POST /api/calendar - Create event
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string };

    try {
      const data = createEventSchema.parse(request.body);

      // Verify project exists if provided
      if (data.projectId) {
        const project = await prisma.project.findUnique({ where: { id: data.projectId } });
        if (!project) {
          return reply.status(404).send({ error: 'Project not found' });
        }
      }

      const startDate = new Date(data.startDate);
      const endDate = data.endDate ? new Date(data.endDate) : null;

      // Check overlaps (soft warning - returned in response, not blocking)
      let overlaps: { id: string; title: string }[] = [];
      if (!data.allDay) {
        overlaps = await checkOverlaps(user.id, startDate, endDate);
      }

      const event = await prisma.calendarEvent.create({
        data: {
          title: data.title,
          description: data.description,
          startDate,
          endDate,
          allDay: data.allDay,
          type: data.type,
          color: data.color,
          projectId: data.projectId || null,
          createdById: user.id,
          recurrenceRule: data.recurrenceRule || null,
          recurrenceInterval: data.recurrenceInterval || 1,
          recurrenceEnd: data.recurrenceEnd ? new Date(data.recurrenceEnd) : null,
          // Create attendees if provided
          ...(data.attendeeIds && data.attendeeIds.length > 0 ? {
            attendees: {
              create: data.attendeeIds
                .filter(id => id !== user.id) // Don't add creator as attendee
                .map(userId => ({ userId })),
            },
          } : {}),
        },
        include: eventInclude,
      });

      return reply.status(201).send({ event, overlaps });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // PUT /api/calendar/:id - Update event
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const data = updateEventSchema.parse(request.body);

      const existing = await prisma.calendarEvent.findUnique({ where: { id } });
      if (!existing) {
        return reply.status(404).send({ error: 'Event not found' });
      }

      if (data.projectId) {
        const project = await prisma.project.findUnique({ where: { id: data.projectId } });
        if (!project) {
          return reply.status(404).send({ error: 'Project not found' });
        }
      }

      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
      if (data.allDay !== undefined) updateData.allDay = data.allDay;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.projectId !== undefined) updateData.projectId = data.projectId || null;
      if (data.recurrenceRule !== undefined) updateData.recurrenceRule = data.recurrenceRule || null;
      if (data.recurrenceInterval !== undefined) updateData.recurrenceInterval = data.recurrenceInterval || 1;
      if (data.recurrenceEnd !== undefined) updateData.recurrenceEnd = data.recurrenceEnd ? new Date(data.recurrenceEnd) : null;

      // Update attendees if provided
      if (data.attendeeIds !== undefined) {
        // Delete existing and recreate
        await prisma.calendarEventAttendee.deleteMany({ where: { eventId: id } });
        if (data.attendeeIds.length > 0) {
          await prisma.calendarEventAttendee.createMany({
            data: data.attendeeIds
              .filter(uid => uid !== existing.createdById)
              .map(userId => ({ eventId: id, userId })),
          });
        }
      }

      const event = await prisma.calendarEvent.update({
        where: { id },
        data: updateData,
        include: eventInclude,
      });

      return reply.send({ event });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // POST /api/calendar/:id/respond - Accept/Decline invite
  app.post('/:id/respond', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user as { id: string };

    const schema = z.object({ status: z.enum(ATTENDEE_STATUSES) });

    try {
      const { status } = schema.parse(request.body);

      const attendee = await prisma.calendarEventAttendee.findUnique({
        where: { eventId_userId: { eventId: id, userId: user.id } },
      });

      if (!attendee) {
        return reply.status(404).send({ error: 'You are not invited to this event' });
      }

      const updated = await prisma.calendarEventAttendee.update({
        where: { id: attendee.id },
        data: { status },
        include: { user: { select: { id: true, name: true } } },
      });

      return reply.send({ attendee: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendValidationError(reply, error);
      }
      throw error;
    }
  });

  // DELETE /api/calendar/:id - Delete event
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const event = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    await prisma.calendarEvent.delete({ where: { id } });

    return reply.send({ message: 'Event deleted' });
  });
}
