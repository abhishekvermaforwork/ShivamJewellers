import { api, getApiErrorMessage } from './api';
import type { User } from '@/types/user';

type AuthResponse = { user: User; token: string };

export async function login(username: string, password: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', {
      username,
      password,
    });
    return data.data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  try {
    const { data } = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', {
      username,
      email,
      password,
    });
    return data.data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export type MeResponse = {
  user: User;
  businessProfile: Record<string, unknown> | null;
};

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await api.get<{ success: boolean; data: MeResponse }>('/auth/me');
  return data.data;
}
