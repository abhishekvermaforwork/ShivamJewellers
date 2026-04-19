'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, getApiErrorMessage } from '@/services/api';

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    n,
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [client, setClient] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{
          success: boolean;
          data: { client: Record<string, unknown>; stats: Record<string, number> };
        }>(`/clients/${id}`);
        if (!cancelled) {
          setClient(data.data.client);
          setStats(data.data.stats);
        }
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (error || !client) return <p className="text-red-600">{error || 'Not found'}</p>;

  return (
    <>
      <div className="page-header">
        <h1>{String(client.name)}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/clients/${id}/edit`} className="btn-primary">
            Edit
          </Link>
          <Link href="/clients" className="btn-secondary">
            Back
          </Link>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-gray-500">Total invoiced</p>
          <p className="text-lg font-semibold">{formatMoney(stats?.totalInvoiced ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-gray-500">Outstanding</p>
          <p className="text-lg font-semibold text-amber-700">{formatMoney(stats?.totalOutstanding ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-gray-500">Paid</p>
          <p className="text-lg font-semibold">{formatMoney(stats?.totalPaid ?? 0)}</p>
        </div>
      </div>
      <p className="text-sm text-gray-600">
        {String(client.phone || '')} · {String(client.email || '')}
      </p>
    </>
  );
}
