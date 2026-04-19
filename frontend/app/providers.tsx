'use client';

import { Toaster } from 'sonner';
import { SWRProvider } from '@/lib/swr-config';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      {children}
      <Toaster richColors position="top-center" />
    </SWRProvider>
  );
}
