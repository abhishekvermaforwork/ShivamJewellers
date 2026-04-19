'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetchClients, type ClientRow } from '@/services/clients.service';
import { getApiErrorMessage } from '@/services/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    n,
  );
}

export default function ClientsPage() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q.trim(), 350);

  const { data, error, isLoading, isValidating } = useSWR(
    ['clients', debouncedQ],
    () => fetchClients(debouncedQ || undefined),
    { dedupingInterval: 10_000, keepPreviousData: true },
  );

  const items = data?.items ?? [];

  return (
    <>
      <div className="page-header">
        <h1>Clients</h1>
        <Link href="/clients/new" className="btn-primary" prefetch>
          <i className="fas fa-plus mr-2" />
          Add client
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="search"
          placeholder="Search by name…"
          className="form-input max-w-md"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {isValidating ? <span className="text-xs text-gray-400">Updating…</span> : null}
      </div>

      {error ? <p className="text-red-600">{getApiErrorMessage(error)}</p> : null}
      {isLoading && !data ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="table-scroll rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="desktop-table min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((c: ClientRow) => (
                <tr key={c._id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <Link href={`/clients/${c._id}`} className="text-brand no-underline hover:underline" prefetch>
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-800">
                    {formatMoney(c.stats?.totalOutstanding ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
