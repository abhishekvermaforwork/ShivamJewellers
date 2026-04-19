'use client';

import useSWR from 'swr';
import { fetchSalesReport } from '@/services/sales.service';
import { getApiErrorMessage } from '@/services/api';

export default function SalesPage() {
  const { data, error, isLoading } = useSWR('sales-report', fetchSalesReport, {
    dedupingInterval: 30_000,
  });

  if (isLoading && !data) return <p className="text-gray-500">Loading…</p>;
  if (error || !data) return <p className="text-red-600">{error ? getApiErrorMessage(error) : 'Error'}</p>;

  return (
    <>
      <div className="page-header">
        <h1>Sales</h1>
      </div>
      <div className="stat-grid">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">Gold sold (today)</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{data.todayGold} g</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">Silver sold (today)</p>
          <p className="mt-1 text-xl font-bold text-slate-600">{data.todaySilver} g</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">Gold (month)</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{data.monthGold} g</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500">Silver (month)</p>
          <p className="mt-1 text-xl font-bold text-slate-600">{data.monthSilver} g</p>
        </div>
      </div>
    </>
  );
}
