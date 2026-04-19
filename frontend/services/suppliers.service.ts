import { api, getApiErrorMessage } from './api';

export type SupplierRow = {
  _id: string;
  name: string;
  totalPurchased?: number;
  totalPending?: number;
};

export async function fetchSuppliersList(): Promise<SupplierRow[]> {
  const { data } = await api.get<{ success: boolean; data: SupplierRow[] }>('/suppliers');
  return data.data;
}

export type SupplierPayload = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
};

export async function createSupplier(body: SupplierPayload) {
  try {
    const { data } = await api.post<{ success: boolean; data: unknown }>('/suppliers', body);
    return data.data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
