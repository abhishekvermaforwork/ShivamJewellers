'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/services/api';
import { PettyExpenseAddForm } from '@/components/petty/PettyExpenseAddForm';

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    n,
  );
}

type Row = { _id: string; description: string; amount: number; date: string };

export default function PettyExpensesPage() {
  const [expenses, setExpenses] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<{ success: boolean; data: { expenses: Row[]; total: number } }>(
        '/petty-expenses',
      );
      setExpenses(data.data.expenses);
      setTotal(data.data.total);
      setError('');
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="page-header">
        <h1>Petty expenses</h1>
      </div>

      <PettyExpenseAddForm onAdded={load} />

      <p className="mb-4 text-sm text-gray-600">
        Total (filtered): <strong>{formatMoney(total)}</strong>
      </p>
      {error ? <p className="text-red-600">{error}</p> : null}
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="table-scroll rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((e) => (
                <tr key={e._id}>
                  <td className="px-4 py-3 text-gray-600">
                    {e.date ? new Date(e.date).toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">{e.description}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
