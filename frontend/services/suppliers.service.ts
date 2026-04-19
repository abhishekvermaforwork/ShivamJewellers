import { api, getApiErrorMessage } from './api';

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
