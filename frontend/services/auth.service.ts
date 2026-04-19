import { api, getApiErrorMessage } from './api';
import type { User } from '@/types/user';

type AuthResponse = { user: User; token: string };

type ApiAuthEnvelope = {
  success?: boolean;
  data?: AuthResponse;
  user?: AuthResponse['user'];
  token?: string;
};

function unwrapAuthPayload(body: ApiAuthEnvelope | undefined): AuthResponse {
  if (!body) {
    throw new Error('Empty response from server');
  }
  if (body.data?.token) {
    return body.data;
  }
  if (body.token && body.user) {
    return { user: body.user, token: body.token };
  }
  throw new Error('Invalid response from server (missing session)');
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', {
      username,
      password,
    });
    return unwrapAuthPayload(data as ApiAuthEnvelope);
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
    return unwrapAuthPayload(data as ApiAuthEnvelope);
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
