'use client';

import useSWR from 'swr';
import { api, getApiErrorMessage } from '@/services/api';

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    n,
  );
}

type Row = { _id: string; name: string; amount: number; date: string; phone?: string };

async function fetchAdvances(): Promise<Row[]> {
  const { data } = await api.get<{ success: boolean; data: { advances: Row[] } }>('/advance-payments');
  return data.data.advances;
}

export default function AdvancePaymentsPage() {
  const { data: advances, error, isLoading } = useSWR('advance-payments-list', fetchAdvances, {
    dedupingInterval: 20_000,
  });

  return (
    <>
      <div className="page-header">
        <h1>Advance payments</h1>
      </div>
      {error ? <p className="text-red-600">{getApiErrorMessage(error)}</p> : null}
      {isLoading && !advances ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="table-scroll rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(advances ?? []).map((row) => (
                <tr key={row._id}>
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.date ? new Date(row.date).toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
