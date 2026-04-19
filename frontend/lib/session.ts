'use client';

import { setCookie, deleteCookie } from 'cookies-next/client';

const TOKEN_KEY = 'token';
const COOKIE_NAME = 'auth_token';
const WEEK = 60 * 60 * 24 * 7;

/** Persist JWT for axios + Next.js middleware (readable cookie, same-site). */
export function persistSession(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  setCookie(COOKIE_NAME, token, {
    path: '/',
    maxAge: WEEK,
    sameSite: 'lax',
  });
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  deleteCookie(COOKIE_NAME, { path: '/' });
}
