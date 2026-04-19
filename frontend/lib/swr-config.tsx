'use client';

import { SWRConfig } from 'swr';

/**
 * Defaults tuned for Vercel + dashboard UX: dedupe parallel requests, avoid refetch on every tab focus.
 */
const swrDefaults = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 1,
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrDefaults}>{children}</SWRConfig>;
}
