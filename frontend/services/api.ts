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
  timeout: 30_000, // 30s — fail fast instead of hanging
});

// ─── Request: attach JWT token ──────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('token');
    if (t) {
      config.headers.Authorization = `Bearer ${t}`;
    }
  }
  return config;
});

// ─── Response: handle 401 globally ──────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (
      typeof window !== 'undefined' &&
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login')
    ) {
      // Session expired — clear credentials and redirect to login
      localStorage.removeItem('token');
      // Use native redirect to avoid importing Next.js router in a non-component file
      const current = window.location.pathname;
      window.location.href = `/login?from=${encodeURIComponent(current)}`;
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(err: unknown): string {
  const ax = err as AxiosError<{ error?: { message?: string } }>;
  return ax.response?.data?.error?.message || ax.message || 'Something went wrong';
}
