'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, getApiErrorMessage } from '@/services/api';
import { AddInventoryItemForm } from '@/components/inventory/AddInventoryItemForm';
import { AddWeightStockForm } from '@/components/inventory/AddWeightStockForm';

type PieceItem = {
  _id: string;
  code?: string;
  description?: string;
  karat?: string;
  weight?: number | null;
  costPrice?: number;
  status?: string;
  dateAdded?: string;
};

type WeightEntry = {
  _id: string;
  weight: number;
  dateAdded?: string;
  notes?: string;
};

export default function CategoryDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data: res } = await api.get<{ success: boolean; data: Record<string, unknown> }>(
        `/inventory/categories/${id}`,
      );
      setData(res.data);
      setError('');
    } catch (e) {
      setError(getApiErrorMessage(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (error || !data) return <p className="text-red-600">{error || 'Not found'}</p>;

  const cat = data.category as { name?: string; code?: string; metalType?: string };
  const mode = data.mode as string;

  return (
    <>
      <div className="page-header">
        <h1>{cat?.name}</h1>
        <Link href="/inventory" className="btn-secondary">
          Back
        </Link>
      </div>
      <p className="mb-6 text-sm text-gray-600">
        {cat?.code} · {cat?.metalType} · Mode: <strong>{mode}</strong>
      </p>

      {mode === 'piece' ? (
        <PieceCategoryBody data={data} categoryId={id} onRefresh={load} />
      ) : (
        <WeightCategoryBody data={data} categoryId={id} onRefresh={load} />
      )}
    </>
  );
}

function PieceCategoryBody({
  data,
  categoryId,
  onRefresh,
}: {
  data: Record<string, unknown>;
  categoryId: string;
  onRefresh: () => void;
}) {
  const items = (data.items as PieceItem[]) || [];
  const totalPieces = Number(data.totalPieces ?? 0);
  const stockPieces = Number(data.stockPieces ?? 0);
  const soldPieces = Number(data.soldPieces ?? 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total pieces" value={String(totalPieces)} />
        <Stat label="In stock" value={String(stockPieces)} />
        <Stat label="Sold" value={String(soldPieces)} />
        <Stat label="Stock weight (g)" value={(Number(data.stockWeight ?? 0)).toFixed(3)} />
      </div>

      <AddInventoryItemForm categoryId={categoryId} onAdded={onRefresh} />

      <div className="table-scroll rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Karat</th>
              <th className="px-4 py-3 text-right">Wt (g)</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((row) => (
              <tr key={row._id}>
                <td className="px-4 py-3 font-medium text-gray-900">{row.code || '—'}</td>
                <td className="px-4 py-3 text-gray-700">{row.description || '—'}</td>
                <td className="px-4 py-3">{row.karat || '—'}</td>
                <td className="px-4 py-3 text-right">{row.weight != null ? row.weight : '—'}</td>
                <td className="px-4 py-3 text-right">₹{Number(row.costPrice ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{row.status || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? <p className="px-4 py-6 text-center text-sm text-gray-500">No items yet.</p> : null}
      </div>
    </div>
  );
}

function WeightCategoryBody({
  data,
  categoryId,
  onRefresh,
}: {
  data: Record<string, unknown>;
  categoryId: string;
  onRefresh: () => void;
}) {
  const entries = (data.weightEntries as WeightEntry[]) || [];
  const available = Number(data.available ?? 0);
  const totalIn = Number(data.totalIn ?? 0);
  const totalSold = Number(data.totalSold ?? 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Total in (g)" value={totalIn.toFixed(3)} />
        <Stat label="Sold (g)" value={totalSold.toFixed(3)} />
        <Stat label="Available (g)" value={available.toFixed(3)} />
      </div>

      <AddWeightStockForm categoryId={categoryId} onAdded={onRefresh} />

      <div className="table-scroll rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Weight (g)</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((row) => (
              <tr key={row._id}>
                <td className="px-4 py-3 text-gray-600">
                  {row.dateAdded ? new Date(row.dateAdded).toLocaleString('en-IN') : '—'}
                </td>
                <td className="px-4 py-3 text-right font-medium">{row.weight}</td>
                <td className="px-4 py-3 text-gray-700">{row.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">No stock entries yet.</p>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
