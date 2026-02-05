import { api } from '@/lib/api';

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  projects?: ClientProject[];
  _count?: {
    projects: number;
  };
}

export interface ClientProject {
  id: string;
  name: string;
  status: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
}

export type UpdateClientData = Partial<CreateClientData>;

interface ClientsResponse {
  clients: Client[];
}

interface ClientResponse {
  client: Client;
}

export const clientService = {
  async getAll(): Promise<Client[]> {
    const response = await api.get<ClientsResponse>('/clients');
    return response.clients;
  },

  async getById(id: string): Promise<Client> {
    const response = await api.get<ClientResponse>(`/clients/${id}`);
    return response.client;
  },

  async create(data: CreateClientData): Promise<Client> {
    const response = await api.post<ClientResponse>('/clients', data);
    return response.client;
  },

  async update(id: string, data: UpdateClientData): Promise<Client> {
    const response = await api.put<ClientResponse>(`/clients/${id}`, data);
    return response.client;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};
