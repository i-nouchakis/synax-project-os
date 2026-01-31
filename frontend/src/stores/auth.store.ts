import { create } from 'zustand';
import { api } from '@/lib/api';

export type UserRole = 'ADMIN' | 'PM' | 'TECHNICIAN' | 'CLIENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      api.setToken(response.token);

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  },

  logout: () => {
    api.setToken(null);
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = api.getToken();

    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      // API returns { user: User }, not User directly
      const response = await api.get<{ user: User }>('/auth/me');
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      api.setToken(null);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
