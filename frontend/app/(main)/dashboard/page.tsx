'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { fetchDashboard } from '@/services/dashboard.service';
import { getApiErrorMessage } from '@/services/api';

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    n,
  );
}

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR('dashboard-summary', fetchDashboard, {
    dedupingInterval: 30_000,
  });

  if (isLoading && !data) {
    return <p className="text-gray-500">Loading dashboard…</p>;
  }
  if (error || !data) {
    return <p className="text-red-600">{error ? getApiErrorMessage(error) : 'Failed to load'}</p>;
  }

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="action-bar">
          <Link href="/invoices" className="btn-primary" prefetch>
            <i className="fas fa-plus mr-2" />
            New invoice
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Revenue (this month)</p>
          <p className="text-2xl font-bold text-gray-900">{formatMoney(data.revenueThisMonth)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Outstanding</p>
          <p className="text-2xl font-bold text-amber-700">{formatMoney(data.totalOutstanding)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{formatMoney(data.totalOverdue)}</p>
        </div>
      </div>

      <div className="two-col grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800">
            Recent invoices
          </h2>
          <ul className="divide-y divide-gray-100">
            {data.recentInvoices.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500">No invoices yet</li>
            ) : (
              data.recentInvoices.map((inv: Record<string, unknown>) => (
                <li key={String(inv._id)} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium text-gray-800">{String(inv.invoiceNumber ?? '')}</span>
                  <span className="text-gray-600">{formatMoney(Number(inv.total ?? 0))}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800">
            Top clients (paid)
          </h2>
          <ul className="divide-y divide-gray-100">
            {data.clientTotals.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500">No data yet</li>
            ) : (
              data.clientTotals.map((c) => (
                <li key={c.name} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-gray-800">{c.name}</span>
                  <span className="font-medium text-gray-900">{formatMoney(c.total)}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </>
  );
}
