'use client';

import { useParams } from 'next/navigation';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';

export default function EditInvoicePage() {
  const params = useParams();
  const id = String(params.id);
  return <InvoiceForm mode="edit" invoiceId={id} />;
}
