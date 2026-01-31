// API Client for Synax
const API_BASE = '/api';

interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on init
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('synax_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('synax_token', token);
    } else {
      localStorage.removeItem('synax_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        statusCode: response.status,
        error: 'Error',
        message: response.statusText,
      }));
      throw new Error(error.message || 'API Error');
    }

    return response.json();
  }

  // GET request
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data ?? {}),
    });
  }

  // PUT request
  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
