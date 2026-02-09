import { prisma } from './prisma.js';
import type { NotificationType } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Create a notification for a user, respecting their preferences.
 * Returns the notification if created, or null if user opted out.
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, link } = params;

  // Check user's notification preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      notifyOnIssue: true,
      notifyOnAssignment: true,
      notifyOnComment: true,
      notifyDigest: true,
    },
  });

  if (!user) return null;

  // Check if user has this notification type enabled
  const prefMap: Record<NotificationType, boolean> = {
    ISSUE_CREATED: user.notifyOnIssue,
    TASK_ASSIGNED: user.notifyOnAssignment,
    COMMENT_ADDED: user.notifyOnComment,
    CHECKLIST_COMPLETED: user.notifyOnIssue, // reuse issue preference
  };

  if (!prefMap[type]) return null;

  return prisma.notification.create({
    data: { userId, type, title, message, link },
  });
}

/**
 * Create notifications for multiple users at once.
 * Filters by each user's preferences.
 */
export async function createNotificationsForUsers(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  excludeUserId?: string,
) {
  const filteredIds = excludeUserId
    ? userIds.filter(id => id !== excludeUserId)
    : userIds;

  if (filteredIds.length === 0) return [];

  const results = await Promise.allSettled(
    filteredIds.map(userId =>
      createNotification({ userId, type, title, message, link })
    )
  );

  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(Boolean);
}
