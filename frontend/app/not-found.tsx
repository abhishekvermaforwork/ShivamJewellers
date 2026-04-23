'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <div className="mb-6 text-7xl font-extrabold text-gray-200">404</div>
        <h1 className="mb-3 text-2xl font-bold text-gray-800">Page not found</h1>
        <p className="mb-8 text-sm text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary inline-flex items-center justify-center"
        >
          <i className="fas fa-arrow-left mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
