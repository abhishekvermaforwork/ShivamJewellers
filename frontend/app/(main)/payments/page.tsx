'use client';

import useSWR from 'swr';
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

async function fetchPaymentHistory(): Promise<Row[]> {
  const { data } = await api.get<{ success: boolean; data: { items: Row[] } }>('/payments/history');
  return data.data.items;
}

export default function PaymentsPage() {
  const { data: items, error, isLoading } = useSWR('payments-history', fetchPaymentHistory, {
    dedupingInterval: 20_000,
  });

  return (
    <>
      <div className="page-header">
        <h1>Payments</h1>
      </div>
      {error ? <p className="text-red-600">{getApiErrorMessage(error)}</p> : null}
      {isLoading && !items ? (
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
              {(items ?? []).map((row) => (
                <tr key={row._id}>
                  <td className="px-4 py-3 font-medium">{row.invoice?.invoiceNumber ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.paymentDate ? new Date(row.paymentDate).toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{row.paymentMethod}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(row.amountPaid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
