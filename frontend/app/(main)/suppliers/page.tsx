'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { fetchSuppliersList, type SupplierRow } from '@/services/suppliers.service';
import { getApiErrorMessage } from '@/services/api';

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    n,
  );
}

export default function SuppliersPage() {
  const { data, error, isLoading } = useSWR('suppliers-list', fetchSuppliersList, {
    dedupingInterval: 20_000,
  });

  const items = data ?? [];

  return (
    <>
      <div className="page-header">
        <h1>Suppliers</h1>
        <Link href="/suppliers/new" className="btn-primary" prefetch>
          Add supplier
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
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 text-right">Purchased</th>
                <th className="px-4 py-3 text-right">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((s: SupplierRow) => (
                <tr key={s._id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(s.totalPurchased ?? 0)}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(s.totalPending ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
