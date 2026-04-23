'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-red-100">
          <i className="fas fa-exclamation-triangle text-2xl text-red-600" />
        </div>
        <h1 className="mb-3 text-2xl font-bold text-gray-800">Something went wrong</h1>
        <p className="mb-6 text-sm text-gray-500">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest ? (
          <p className="mb-4 font-mono text-xs text-gray-400">
            Error ID: {error.digest}
          </p>
        ) : null}
        <button type="button" onClick={reset} className="btn-primary">
          <i className="fas fa-redo mr-2" />
          Try again
        </button>
      </div>
    </main>
  );
}
