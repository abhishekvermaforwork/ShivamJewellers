'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import useSWR from 'swr';
import { getApiErrorMessage } from '@/services/api';
import { downloadInvoicePdf, fetchInvoice } from '@/services/invoices.service';

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    n,
  );
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data, error, isLoading } = useSWR(id ? ['invoice', id] : null, () => fetchInvoice(id), {
    dedupingInterval: 10_000,
  });

  const invoice = data?.invoice as Record<string, unknown> | undefined;
  const lineItems = (data?.lineItems ?? []) as Record<string, unknown>[];

  if (isLoading && !data) return <p className="text-gray-500">Loading…</p>;
  if (error || !invoice) return <p className="text-red-600">{error ? getApiErrorMessage(error) : 'Not found'}</p>;

  return (
    <>
      <div className="page-header">
        <h1>Invoice {String(invoice.invoiceNumber)}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-secondary"
            disabled={pdfLoading}
            onClick={async () => {
              setPdfLoading(true);
              try {
                const safe = String(invoice.invoiceNumber ?? id).replace(/[^a-zA-Z0-9-_]/g, '_');
                await downloadInvoicePdf(id, `invoice_${safe}.pdf`);
                toast.success('PDF downloaded');
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Could not download PDF');
              } finally {
                setPdfLoading(false);
              }
            }}
          >
            {pdfLoading ? 'Preparing…' : 'Download PDF'}
          </button>
          <Link href={`/invoices/${id}/edit`} className="btn-primary" prefetch>
            Edit
          </Link>
          <Link href="/invoices" className="btn-secondary" prefetch>
            Back
          </Link>
        </div>
      </div>
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-600">
          Status: <span className="capitalize font-medium text-gray-900">{String(invoice.status)}</span>
        </p>
        <p className="mt-2 text-lg font-semibold text-gray-900">{formatMoney(Number(invoice.total ?? 0))}</p>
      </div>
      <div className="table-scroll rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lineItems.map((row) => (
              <tr key={String(row._id)}>
                <td className="px-4 py-3">{String(row.description ?? '')}</td>
                <td className="px-4 py-3 text-right">{formatMoney(Number(row.lineTotal ?? 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
