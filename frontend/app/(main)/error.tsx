'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[MainAreaError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="max-w-md">
        <div className="mb-4 flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-amber-100">
          <i className="fas fa-exclamation-circle text-xl text-amber-600" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-800">Something went wrong</h2>
        <p className="mb-6 text-sm text-gray-500">
          An error occurred while loading this page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">
            <i className="fas fa-redo mr-2" />
            Retry
          </button>
          <Link href="/dashboard" className="btn-secondary">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
