'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { fetchInventoryCategories } from '@/services/inventory.service';
import { getApiErrorMessage } from '@/services/api';

type Cat = {
  _id: string;
  name: string;
  code: string;
  categoryType: string;
  metalType: string;
  total_count?: number;
  in_stock_count?: number;
  sold_count?: number;
  available_weight?: number;
};

export default function InventoryPage() {
  const { data, error, isLoading } = useSWR('inventory-categories', fetchInventoryCategories, {
    dedupingInterval: 20_000,
  });

  const categories = (data?.categories ?? []) as Cat[];
  const totals = data
    ? { totalGold: data.totalGold, totalSilver: data.totalSilver }
    : { totalGold: 0, totalSilver: 0 };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
        <Link
          href="/inventory/categories/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
        >
          + New Category
        </Link>
      </div>

      {/* Metal Summary */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {/* Gold */}
        <div className="flex-1 min-w-[220px] bg-yellow-50 border border-yellow-300 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white">
            ✦
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-yellow-800 font-medium">
              Total Gold Available
            </p>
            <p className="text-lg font-bold text-yellow-900">
              {totals.totalGold.toFixed(3)}
              <span className="text-sm ml-1 text-yellow-700">g</span>
            </p>
          </div>
        </div>

        {/* Silver */}
        <div className="flex-1 min-w-[220px] bg-gray-50 border border-gray-300 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white">
            ✦
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-600 font-medium">
              Total Silver Available
            </p>
            <p className="text-lg font-bold text-gray-900">
              {totals.totalSilver.toFixed(3)}
              <span className="text-sm ml-1 text-gray-600">g</span>
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error ? <p className="mb-4 text-red-600">{getApiErrorMessage(error)}</p> : null}

      {/* Loading */}
      {isLoading && !data ? (
        <p className="text-gray-500">Loading…</p>
      ) : categories.length === 0 ? (
        <div className="bg-white p-10 border rounded-xl text-center text-gray-400">
          <div className="text-3xl mb-2">💎</div>
          <p className="font-medium text-gray-700 mb-1">No categories yet</p>
          <p className="text-sm mb-4">
            Create your first category to start managing inventory.
          </p>
          <Link
            href="/inventory/categories/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            Create Category
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
          {categories.map((c) => (
            <div
              key={c._id}
              className="bg-white border rounded-xl overflow-hidden transition hover:shadow-md hover:border-blue-300"
            >
              {/* Card Body */}
              <Link
                href={`/inventory/categories/${c._id}`}
                className="block p-4 no-underline"
              >
                {/* Name + Code */}
                <div className="flex justify-between mb-2">
                  <p className="font-semibold text-sm text-gray-900">
                    {c.name}
                  </p>
                  <span className="text-[10px] font-bold px-2 py-[2px] rounded-full bg-blue-100 text-blue-700">
                    {c.code}
                  </span>
                </div>

                {/* Type Badge */}
                <div className="mb-3">
                  {c.categoryType === 'piece' ? (
                    <span className="text-[11px] px-2 py-[2px] rounded-full bg-green-100 text-green-700">
                      Piece-Based
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-[2px] rounded-full bg-yellow-100 text-yellow-800">
                      Bulk / Weight
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="border-t pt-2 text-xs">
                  {c.categoryType === 'piece' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total</span>
                        <span className="font-medium">
                          {c.total_count || 0} pcs
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">In Stock</span>
                        <span className="font-semibold text-green-600">
                          {c.in_stock_count || 0} pcs
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sold</span>
                        <span className="text-red-600">
                          {c.sold_count || 0} pcs
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Available</span>
                      <span className="font-semibold text-green-600">
                        {(c.available_weight || 0).toFixed(2)} g
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Action Bar */}
              <div className="flex border-t text-xs">
                <Link
                  href={`/inventory/categories/${c._id}`}
                  className="flex-1 text-center py-2 bg-gray-50 hover:bg-gray-100"
                >
                  View →
                </Link>
                <Link
                  href={`/inventory/categories/${c._id}/edit`}
                  className="flex-1 text-center py-2 hover:bg-blue-50 hover:text-blue-600"
                >
                  ✎
                </Link>
                <Link
                  href={`/inventory/categories/${c._id}/delete`}
                  className="flex-1 text-center py-2 hover:bg-red-50 hover:text-red-600"
                >
                  ✕
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}