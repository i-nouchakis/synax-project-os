import { api } from '@/lib/api';
import type { User, UserRole } from '@/stores/auth.store';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface UpdateUserData {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

interface UsersResponse {
  users: User[];
}

interface UserResponse {
  user: User;
}

export const userService = {
  // Get all users (Admin only)
  async getAll(): Promise<User[]> {
    const response = await api.get<UsersResponse>('/users');
    return response.users;
  },

  // Get user by ID
  async getById(id: string): Promise<User> {
    const response = await api.get<UserResponse>(`/users/${id}`);
    return response.user;
  },

  // Create new user (Admin only)
  async create(data: CreateUserData): Promise<User> {
    const response = await api.post<UserResponse>('/users', data);
    return response.user;
  },

  // Update user (Admin only)
  async update(id: string, data: UpdateUserData): Promise<User> {
    const response = await api.put<UserResponse>(`/users/${id}`, data);
    return response.user;
  },

  // Delete user (Admin only)
  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
