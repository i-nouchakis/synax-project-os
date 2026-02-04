import { api } from '@/lib/api';

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export interface ProjectMember {
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

export interface ProjectBuilding {
  id: string;
  name: string;
  description?: string;
  pinX?: number | null;
  pinY?: number | null;
  _count: { floors: number };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientName: string;
  location?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  masterplanUrl?: string;
  masterplanType?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    buildings: number;
    issues: number;
    members: number;
  };
  buildings?: ProjectBuilding[];
  members?: ProjectMember[];
}

export interface CreateProjectData {
  name: string;
  description?: string;
  clientName: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: ProjectStatus;
}

interface ProjectsResponse {
  projects: Project[];
}

interface ProjectResponse {
  project: Project;
}

export const projectService = {
  // Get all projects
  async getAll(): Promise<Project[]> {
    const response = await api.get<ProjectsResponse>('/projects');
    return response.projects;
  },

  // Get project by ID
  async getById(id: string): Promise<Project> {
    const response = await api.get<ProjectResponse>(`/projects/${id}`);
    return response.project;
  },

  // Create new project
  async create(data: CreateProjectData): Promise<Project> {
    const response = await api.post<ProjectResponse>('/projects', data);
    return response.project;
  },

  // Update project
  async update(id: string, data: UpdateProjectData): Promise<Project> {
    const response = await api.put<ProjectResponse>(`/projects/${id}`, data);
    return response.project;
  },

  // Delete project
  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  // Add member to project
  async addMember(projectId: string, userId: string, role?: string): Promise<ProjectMember> {
    const response = await api.post<{ member: ProjectMember }>(
      `/projects/${projectId}/members`,
      { userId, role }
    );
    return response.member;
  },

  // Remove member from project
  async removeMember(projectId: string, userId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  },
};
