'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/services/api';

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    n,
  );
}

type Row = {
  _id: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  invoice?: { invoiceNumber?: string };
};

export default function PaymentsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ success: boolean; data: { items: Row[] } }>('/payments/history');
        if (!cancelled) setItems(data.data.items);
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="page-header">
        <h1>Payments</h1>
      </div>
      {error ? <p className="text-red-600">{error}</p> : null}
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="table-scroll rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-3">{p.invoice?.invoiceNumber ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3 capitalize">{p.paymentMethod?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(p.amountPaid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
