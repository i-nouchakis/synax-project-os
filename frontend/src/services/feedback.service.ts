import { api } from '@/lib/api';

export type FeedbackType = 'BUG' | 'CHANGE';

export interface Feedback {
  id: string;
  type: FeedbackType;
  description: string;
  screenshotUrl: string | null;
  pageUrl: string;
  adminNotes: string | null;
  resolved: boolean;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

const API_BASE = '/api';

export const feedbackService = {
  async create(data: { type: FeedbackType; description: string; pageUrl: string; screenshot?: Blob }): Promise<Feedback> {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('description', data.description);
    formData.append('pageUrl', data.pageUrl);
    if (data.screenshot) {
      formData.append('screenshot', data.screenshot, 'screenshot.png');
    }

    const token = api.getToken();
    const response = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Failed to submit feedback' }));
      throw new Error(err.error || 'Failed to submit feedback');
    }

    return response.json();
  },

  getAll(type?: FeedbackType): Promise<Feedback[]> {
    const params = type ? `?type=${type}` : '';
    return api.get(`/feedback${params}`);
  },

  update(id: string, data: { adminNotes?: string; resolved?: boolean; type?: FeedbackType }): Promise<Feedback> {
    return api.put(`/feedback/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return api.delete(`/feedback/${id}`);
  },
};
