import { api, getApiErrorMessage } from './api';

export type CategoryPayload = {
  name: string;
  code: string;
  categoryType: 'piece' | 'weight';
  metalType: 'gold' | 'silver';
  karat?: '' | '22ct' | '20ct' | '18ct';
};

export type InventoryItemPayload = {
  category: string | null;
  code?: string;
  description?: string;
  karat: '22ct' | '20ct' | '18ct';
  dateAdded?: string;
  weight?: number | null;
  costPrice?: number;
  status: 'in_stock' | 'sold';
};

export type WeightStockPayload = {
  category: string;
  dateAdded: string;
  weight: number;
  notes?: string;
};

export async function createCategory(body: CategoryPayload) {
  try {
    const { data } = await api.post<{ success: boolean; data: unknown }>('/inventory/categories', body);
    return data.data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function createInventoryItem(body: InventoryItemPayload) {
  try {
    const { data } = await api.post<{ success: boolean; data: unknown }>('/inventory/items', body);
    return data.data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function createWeightStock(body: WeightStockPayload) {
  try {
    const { data } = await api.post<{ success: boolean; data: unknown }>('/inventory/weight-stock', body);
    return data.data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
