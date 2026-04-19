import { api, getApiErrorMessage } from './api';

export type PettyExpenseRow = { _id: string; description: string; amount: number; date: string };

export async function fetchPettyExpensesList(): Promise<{ expenses: PettyExpenseRow[]; total: number }> {
  const { data } = await api.get<{ success: boolean; data: { expenses: PettyExpenseRow[]; total: number } }>(
    '/petty-expenses',
  );
  return data.data;
}

export type PettyExpensePayload = {
  description: string;
  amount: number;
  date?: string;
};

export async function createPettyExpense(body: PettyExpensePayload) {
  try {
    const { data } = await api.post<{ success: boolean; data: unknown }>('/petty-expenses', body);
    return data.data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
