import { api } from '@/lib/api';

export interface Notification {
  id: string;
  userId: string;
  type: 'ISSUE_CREATED' | 'TASK_ASSIGNED' | 'COMMENT_ADDED' | 'CHECKLIST_COMPLETED';
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export const notificationService = {
  async getNotifications(limit = 20, offset = 0, unreadOnly = false): Promise<NotificationsResponse> {
    return api.get<NotificationsResponse>(
      `/notifications?limit=${limit}&offset=${offset}&unreadOnly=${unreadOnly}`
    );
  },

  async getUnreadCount(): Promise<number> {
    const res = await api.get<{ count: number }>('/notifications/unread-count');
    return res.count;
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`, {});
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/read-all', {});
  },

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};
