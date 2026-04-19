import { api, getApiErrorMessage } from './api';

export type ClientRow = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  stats?: { totalInvoiced: number; totalPaid: number; totalOutstanding: number };
};

export async function fetchClients(q?: string) {
  const { data } = await api.get<{ success: boolean; data: { items: ClientRow[]; total: number } }>(
    '/clients',
    { params: { q } },
  );
  return data.data;
}

export async function fetchAllClients(): Promise<ClientRow[]> {
  const { data } = await api.get<{ success: boolean; data: { items: ClientRow[] } }>('/clients', {
    params: { limit: 500, page: 1 },
  });
  return data.data.items;
}

export async function fetchClient(id: string) {
  const { data } = await api.get<{ success: boolean; data: { client: Record<string, unknown> } }>(`/clients/${id}`);
  return data.data.client;
}

export async function createClient(body: Record<string, unknown>) {
  try {
    const { data } = await api.post<{ success: boolean; data: unknown }>('/clients', body);
    return data.data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function updateClient(id: string, body: Record<string, unknown>) {
  try {
    const { data } = await api.put<{ success: boolean; data: unknown }>(`/clients/${id}`, body);
    return data.data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

