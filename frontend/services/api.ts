import axios, { type AxiosError } from 'axios';

/** Same-origin Next.js Route Handlers under /api/v1 — override with NEXT_PUBLIC_API_URL if needed */
const baseURL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL?.trim() || '/api/v1')
    : (process.env.NEXT_PUBLIC_API_URL?.trim() ||
        process.env.INTERNAL_API_URL ||
        'http://localhost:3000/api/v1');

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('token');
    if (t) {
      config.headers.Authorization = `Bearer ${t}`;
    }
  }
  return config;
});

export function getApiErrorMessage(err: unknown): string {
  const ax = err as AxiosError<{ error?: { message?: string } }>;
  return ax.response?.data?.error?.message || ax.message || 'Something went wrong';
}
