import { api, getApiErrorMessage } from './api';

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
