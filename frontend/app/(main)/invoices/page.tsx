'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { fetchInvoices } from '@/services/invoices.service';
import { getApiErrorMessage } from '@/services/api';

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    n,
  );
}

type Inv = {
  _id: string;
  invoiceNumber?: string;
  status?: string;
  total?: number;
  issueDate?: string;
  invoiceType?: string;
  cashClientName?: string;
  client?: { name?: string };
};

export default function InvoicesPage() {
  const { data, error, isLoading } = useSWR('invoices-list', () => fetchInvoices(), {
    dedupingInterval: 15_000,
  });

  const items = (data?.items ?? []) as Inv[];

  return (
    <>
      <div className="page-header">
        <h1>Invoices</h1>
        <Link href="/invoices/new" className="btn-primary" prefetch>
          New invoice
        </Link>
      </div>
      {error ? <p className="text-red-600">{getApiErrorMessage(error)}</p> : null}
      {isLoading && !data ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="table-scroll rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((inv) => (
                <tr key={inv._id}>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/invoices/${inv._id}`} className="text-brand no-underline hover:underline" prefetch>
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {inv.invoiceType === 'cash' ? inv.cashClientName || 'Cash' : inv.client?.name || '—'}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{inv.status}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(inv.total ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
