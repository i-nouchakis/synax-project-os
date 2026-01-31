import { api } from '@/lib/api';

export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface IssuePhoto {
  id: string;
  photoUrl: string;
  caption?: string;
  uploadedAt: string;
}

export interface IssueComment {
  id: string;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export interface Issue {
  id: string;
  projectId: string;
  roomId?: string;
  title: string;
  description?: string;
  causedBy?: string;
  priority: IssuePriority;
  status: IssueStatus;
  createdById: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  room?: {
    id: string;
    name: string;
    floor?: {
      id: string;
      name: string;
      project?: {
        id: string;
        name: string;
      };
    };
  };
  createdBy?: {
    id: string;
    name: string;
    email?: string;
  };
  photos?: IssuePhoto[];
  comments?: IssueComment[];
  _count?: {
    comments: number;
  };
}

export interface CreateIssueData {
  projectId: string;
  roomId?: string;
  title: string;
  description?: string;
  causedBy?: string;
  priority?: IssuePriority;
}

export interface UpdateIssueData {
  title?: string;
  description?: string;
  causedBy?: string;
  priority?: IssuePriority;
  status?: IssueStatus;
}

interface IssuesResponse {
  issues: Issue[];
}

interface IssueResponse {
  issue: Issue;
}

interface CommentResponse {
  comment: IssueComment;
}

interface PhotoResponse {
  photo: IssuePhoto;
}

export const issueService = {
  // Get all issues with optional filters
  async getAll(filters?: {
    projectId?: string;
    roomId?: string;
    status?: IssueStatus;
    priority?: IssuePriority;
  }): Promise<Issue[]> {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.roomId) params.append('roomId', filters.roomId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);

    const queryString = params.toString();
    const url = queryString ? `/issues?${queryString}` : '/issues';
    const response = await api.get<IssuesResponse>(url);
    return response.issues;
  },

  // Get issue by ID
  async getById(id: string): Promise<Issue> {
    const response = await api.get<IssueResponse>(`/issues/${id}`);
    return response.issue;
  },

  // Create issue
  async create(data: CreateIssueData): Promise<Issue> {
    const response = await api.post<IssueResponse>('/issues', data);
    return response.issue;
  },

  // Update issue
  async update(id: string, data: UpdateIssueData): Promise<Issue> {
    const response = await api.put<IssueResponse>(`/issues/${id}`, data);
    return response.issue;
  },

  // Delete issue
  async delete(id: string): Promise<void> {
    await api.delete(`/issues/${id}`);
  },

  // Add comment
  async addComment(issueId: string, comment: string): Promise<IssueComment> {
    const response = await api.post<CommentResponse>(`/issues/${issueId}/comments`, { comment });
    return response.comment;
  },

  // Delete comment
  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/issues/comments/${commentId}`);
  },

  // Add photo
  async addPhoto(issueId: string, photoUrl: string, caption?: string): Promise<IssuePhoto> {
    const response = await api.post<PhotoResponse>(`/issues/${issueId}/photos`, { photoUrl, caption });
    return response.photo;
  },

  // Delete photo
  async deletePhoto(photoId: string): Promise<void> {
    await api.delete(`/issues/photos/${photoId}`);
  },
};

// Helper labels
export const priorityLabels: Record<IssuePriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const statusLabels: Record<IssueStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const priorityColors: Record<IssuePriority, string> = {
  LOW: 'default',
  MEDIUM: 'primary',
  HIGH: 'warning',
  CRITICAL: 'error',
};

export const statusColors: Record<IssueStatus, string> = {
  OPEN: 'error',
  IN_PROGRESS: 'primary',
  RESOLVED: 'success',
  CLOSED: 'default',
};
