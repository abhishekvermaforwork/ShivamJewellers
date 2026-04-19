'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'sonner';
import { invoiceFormSchema, type InvoiceFormValues, type InvoiceLineFormValues } from '@/validation/invoiceSchema';
import { calculateInvoiceTotals, computeLineTotal, type Metal } from '@/lib/invoiceMath';
import type { PieceItem, WeightCategory } from '@/services/invoiceFormData.service';
import { fetchInvoiceFormData } from '@/services/invoiceFormData.service';
import { createInvoice, updateInvoice, fetchInvoice } from '@/services/invoices.service';
import { fetchAllClients } from '@/services/clients.service';
import type { ClientRow } from '@/services/clients.service';
import { InputField } from '@/components/forms/InputField';
import { SelectField } from '@/components/forms/SelectField';
import { TextAreaField } from '@/components/forms/TextAreaField';
import { LineItemsTable } from '@/components/invoices/LineItemsTable';

const PAYMENT_MODES = [
  { value: '', label: '— Select Mode —' },
  { value: 'Cash', label: 'Cash' },
  { value: 'PhonePe', label: 'PhonePe' },
  { value: 'Card', label: 'Card' },
  { value: 'Old Gold', label: 'Old Gold' },
];

const CREDIT_STATUS = [
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

function toDatetimeLocal(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(iso?: string) {
  if (!iso) return '';
  return String(iso).slice(0, 10);
}

function defaultLine(): InvoiceLineFormValues {
  return {
    lineType: 'piece',
    makingChargeType: 'pct',
    karat: '22ct',
    description: '',
    weight: undefined,
    rate: undefined,
    inventoryItem: '',
    category: '',
    makingChargePct: undefined,
    makingChargeAmt: undefined,
  };
}

function metalForLine(
  line: InvoiceLineFormValues,
  pieceItems: PieceItem[],
  weightCats: WeightCategory[],
): Metal {
  if (line.lineType === 'weight' && line.category) {
    const c = weightCats.find((x) => x.id === line.category);
    return (c?.metal_type as Metal) || 'gold';
  }
  if (line.lineType === 'piece' && line.inventoryItem) {
    const it = pieceItems.find((x) => x.id === line.inventoryItem);
    return (it?.metal_type as Metal) || 'gold';
  }
  return 'gold';
}

export function InvoiceForm({ mode, invoiceId }: { mode: 'create' | 'edit'; invoiceId?: string }) {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [pieceItems, setPieceItems] = useState<PieceItem[]>([]);
  const [weightCategories, setWeightCategories] = useState<WeightCategory[]>([]);
  const [loadError, setLoadError] = useState('');
  const [editTitle, setEditTitle] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({
    resolver: yupResolver(invoiceFormSchema) as never,
    defaultValues: {
      invoiceType: 'cash',
      client: '',
      cashClientName: '',
      cashClientPhone: '',
      cashClientAddress: '',
      paymentMode: '',
      issueDate: toDatetimeLocal(new Date().toISOString()),
      dueDate: '',
      status: 'sent',
      notes: '',
      cgstRate: 0,
      sgstRate: 0,
      applyGst: false,
      discountAmount: 0,
      cashReceived: 0,
      swapAmount: 0,
      oldGoldAmount: 0,
      oldJewelleryWeight: undefined,
      oldJewelleryDescription: '',
      lineItems: [defaultLine()],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  const invoiceType = watch('invoiceType');
  const applyGst = watch('applyGst');
  const lineItems = watch('lineItems');
  const cgstRate = watch('cgstRate');
  const sgstRate = watch('sgstRate');
  const discountAmount = watch('discountAmount');
  const cashReceived = watch('cashReceived');
  const swapAmount = watch('swapAmount');
  const oldGoldAmount = watch('oldGoldAmount');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cl, fd] = await Promise.all([fetchAllClients(), fetchInvoiceFormData()]);
        if (!cancelled) {
          setClients(cl);
          setPieceItems(fd.pieceItems);
          setWeightCategories(fd.weightCategories);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load form data');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !invoiceId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchInvoice(invoiceId);
        if (cancelled) return;
        const inv = data.invoice as Record<string, unknown>;
        setEditTitle(String(inv.invoiceNumber ?? invoiceId ?? ''));
        const lines = (data.lineItems as Record<string, unknown>[]).map((li) => ({
          lineType: (li.lineType as string) || 'piece',
          inventoryItem: li.inventoryItem ? String(li.inventoryItem) : '',
          category: li.category ? String(li.category) : '',
          description: String(li.description ?? ''),
          karat: (li.karat as InvoiceLineFormValues['karat']) || '22ct',
          weight: li.weight != null ? Number(li.weight) : undefined,
          rate: li.rate != null ? Number(li.rate) : undefined,
          makingChargeType: (li.makingChargeType as 'pct' | 'amt') || 'pct',
          makingChargePct: li.makingChargePct != null ? Number(li.makingChargePct) : undefined,
          makingChargeAmt: li.makingChargeAmt != null ? Number(li.makingChargeAmt) : undefined,
        }));
        const cg = Number(inv.cgstRate ?? 0);
        const sg = Number(inv.sgstRate ?? 0);
        reset({
          invoiceType: (inv.invoiceType as 'cash' | 'credit') || 'credit',
          client: inv.client ? String(inv.client) : '',
          cashClientName: String(inv.cashClientName ?? ''),
          cashClientPhone: String(inv.cashClientPhone ?? ''),
          cashClientAddress: String(inv.cashClientAddress ?? ''),
          paymentMode: String(inv.paymentMode ?? ''),
          issueDate: toDatetimeLocal(inv.issueDate as string),
          dueDate: inv.dueDate ? toDateInput(String(inv.dueDate)) : '',
          status: (inv.status as InvoiceFormValues['status']) || 'sent',
          notes: String(inv.notes ?? ''),
          cgstRate: cg,
          sgstRate: sg,
          applyGst: cg > 0 || sg > 0,
          discountAmount: Number(inv.discountAmount ?? 0),
          cashReceived: Number(inv.cashReceived ?? 0),
          swapAmount: Number(inv.swapAmount ?? 0),
          oldGoldAmount: Number(inv.oldGoldAmount ?? 0),
          oldJewelleryWeight:
            inv.oldJewelleryWeight != null ? Number(inv.oldJewelleryWeight) : undefined,
          oldJewelleryDescription: String(inv.oldJewelleryDescription ?? ''),
          lineItems: lines.length ? (lines as NonNullable<InvoiceFormValues['lineItems']>) : [defaultLine()],
        });
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load invoice');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, invoiceId, reset]);

  const summary = useMemo(() => {
    const totals = (lineItems || []).map((line) => {
      if (!line) return 0;
      const filled =
        line.weight != null ||
        line.rate != null ||
        line.inventoryItem ||
        line.category ||
        (line.description && line.description.trim());
      if (!filled) return 0;
      const metal = metalForLine(line, pieceItems, weightCategories);
      return computeLineTotal(line, metal);
    });
    const inv = {
      cgstRate: applyGst ? Number(cgstRate ?? 0) : 0,
      sgstRate: applyGst ? Number(sgstRate ?? 0) : 0,
      discountAmount: Number(discountAmount ?? 0),
      cashReceived: Number(cashReceived ?? 0),
      swapAmount: Number(swapAmount ?? 0),
      oldGoldAmount: Number(oldGoldAmount ?? 0),
    };
    return calculateInvoiceTotals(inv, totals);
  }, [
    lineItems,
    pieceItems,
    weightCategories,
    applyGst,
    cgstRate,
    sgstRate,
    discountAmount,
    cashReceived,
    swapAmount,
    oldGoldAmount,
  ]);

  function buildPayload(values: InvoiceFormValues) {
    const rawLines = values.lineItems || [];
    const filtered = rawLines.filter((line) => {
      const empty =
        !line.weight &&
        !line.rate &&
        !line.inventoryItem &&
        !line.category &&
        !(line.description && line.description.trim());
      return !empty;
    });
    if (!filtered.length) {
      throw new Error('Add at least one line item with weight and rate.');
    }

    const lineItemsPayload = filtered.map((l) => ({
      lineType: l.lineType,
      inventoryItem: l.inventoryItem || null,
      category: l.category || null,
      description: l.description || '',
      karat: l.karat,
      weight: l.weight ?? null,
      rate: l.rate ?? 0,
      makingChargeType: l.makingChargeType,
      makingChargePct: l.makingChargePct ?? null,
      makingChargeAmt: l.makingChargeAmt ?? null,
    }));

    const gst = values.applyGst ? { cgstRate: Number(values.cgstRate ?? 0), sgstRate: Number(values.sgstRate ?? 0) } : { cgstRate: 0, sgstRate: 0 };

    return {
      invoiceType: values.invoiceType,
      client: values.invoiceType === 'credit' ? values.client || null : null,
      cashClientName: values.cashClientName,
      cashClientPhone: values.cashClientPhone,
      cashClientAddress: values.cashClientAddress,
      paymentMode: values.invoiceType === 'cash' ? values.paymentMode : '',
      issueDate: new Date(values.issueDate).toISOString(),
      dueDate: values.dueDate ? new Date(`${values.dueDate}T12:00:00`).toISOString() : null,
      status: values.invoiceType === 'credit' ? values.status : 'paid',
      notes: values.notes,
      ...gst,
      discountAmount: Number(values.discountAmount ?? 0),
      cashReceived: Number(values.cashReceived ?? 0),
      swapAmount: Number(values.swapAmount ?? 0),
      oldGoldAmount: Number(values.oldGoldAmount ?? 0),
      oldJewelleryWeight: values.oldJewelleryWeight ?? null,
      oldJewelleryDescription: values.oldJewelleryDescription || '',
      isRecurring: false,
      recurrenceInterval: '',
      remindersEnabled: true,
      lineItems: lineItemsPayload,
    };
  }

  async function onSubmit(values: InvoiceFormValues) {
    try {
      const payload = buildPayload(values);
      if (mode === 'create') {
        await createInvoice(payload);
        toast.success('Invoice created');
        router.push('/invoices');
      } else if (invoiceId) {
        await updateInvoice(invoiceId, payload);
        toast.success('Invoice updated');
        router.push(`/invoices/${invoiceId}`);
      }
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not save invoice';
      toast.error(msg);
    }
  }

  const clientOptions = clients.map((c) => ({ value: c._id, label: c.name }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-5xl space-y-6">
      <div className="page-header">
        <h1>{mode === 'create' ? 'New invoice' : editTitle ? `Edit ${editTitle}` : 'Edit invoice'}</h1>
        <Link href="/invoices" className="btn-secondary">
          Cancel
        </Link>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <label className="mb-2 block text-sm font-semibold text-gray-800">Invoice Type *</label>
        <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 text-sm">
          <button
            type="button"
            className={`px-5 py-2 font-semibold ${invoiceType === 'cash' ? 'bg-brand text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setValue('invoiceType', 'cash')}
          >
            Cash
          </button>
          <button
            type="button"
            className={`border-l border-gray-300 px-5 py-2 font-semibold ${invoiceType === 'credit' ? 'bg-brand text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setValue('invoiceType', 'credit')}
          >
            Credit
          </button>
        </div>
        {errors.invoiceType ? <p className="mt-1 text-xs text-red-600">{errors.invoiceType.message}</p> : null}

        {invoiceType === 'cash' ? (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField label="Client name (optional)" {...register('cashClientName')} error={errors.cashClientName?.message} />
            <SelectField
              label="Payment mode *"
              options={PAYMENT_MODES}
              {...register('paymentMode')}
              error={errors.paymentMode?.message}
            />
            <InputField label="Client phone" {...register('cashClientPhone')} error={errors.cashClientPhone?.message} />
            <TextAreaField label="Client address" rows={2} {...register('cashClientAddress')} error={errors.cashClientAddress?.message} />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="Client *"
              options={[{ value: '', label: '— Select —' }, ...clientOptions]}
              {...register('client')}
              error={errors.client?.message}
            />
            <SelectField label="Status" options={CREDIT_STATUS} {...register('status')} error={errors.status?.message} />
            <InputField type="date" label="Due date" {...register('dueDate')} error={errors.dueDate?.message} />
          </div>
        )}

        <div className="mt-6">
          <InputField type="datetime-local" label="Issue date *" {...register('issueDate')} error={errors.issueDate?.message} />
        </div>

        <div className="mt-4">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="form-checkbox" checked={applyGst} onChange={(e) => setValue('applyGst', e.target.checked)} />
            <span className="font-medium">Apply GST</span>
          </label>
        </div>
        {applyGst ? (
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              step="0.01"
              label="CGST %"
              type="number"
              {...register('cgstRate', { valueAsNumber: true })}
              error={errors.cgstRate?.message}
            />
            <InputField
              step="0.01"
              label="SGST %"
              type="number"
              {...register('sgstRate', { valueAsNumber: true })}
              error={errors.sgstRate?.message}
            />
          </div>
        ) : null}

        <div className="mt-6">
          <TextAreaField label="Notes" rows={2} {...register('notes')} error={errors.notes?.message} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-800">Items</h3>
          <span className="text-xs italic text-gray-400">Piece = inventory · Bulk = weight category</span>
        </div>
        <LineItemsTable
          control={control}
          setValue={setValue}
          fields={fields}
          remove={remove}
          pieceItems={pieceItems}
          weightCategories={weightCategories}
          errors={errors.lineItems as unknown as unknown[] | undefined}
        />
        <button
          type="button"
          className="mt-3 rounded-lg border border-blue-300 px-4 py-2 text-sm text-brand"
          onClick={() => append(defaultLine())}
        >
          + Add item
        </button>
        {errors.lineItems && !Array.isArray(errors.lineItems) ? (
          <p className="mt-2 text-xs text-red-600">{(errors.lineItems as { message?: string }).message}</p>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-3 text-sm font-bold text-gray-800">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{summary.subtotal.toFixed(2)}</span>
          </div>
          {summary.taxAmount > 0 ? (
            <div className="flex justify-between text-gray-600">
              <span>GST (CGST + SGST)</span>
              <span>₹{summary.taxAmount.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-700">Cash (₹)</span>
            <InputField
              hideLabel
              label="Cash received"
              type="number"
              step="0.01"
              className="max-w-[140px]"
              {...register('cashReceived', { valueAsNumber: true })}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-700">Swap (₹)</span>
            <InputField
              hideLabel
              label="Swap amount"
              type="number"
              step="0.01"
              className="max-w-[140px]"
              {...register('swapAmount', { valueAsNumber: true })}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-700">Old Gold (₹)</span>
            <InputField
              hideLabel
              label="Old gold amount"
              type="number"
              step="0.01"
              className="max-w-[140px]"
              {...register('oldGoldAmount', { valueAsNumber: true })}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-700">Discount (₹)</span>
            <InputField
              hideLabel
              label="Discount"
              type="number"
              step="0.01"
              className="max-w-[140px]"
              {...register('discountAmount', { valueAsNumber: true })}
            />
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-brand">
            <span>Bill amount</span>
            <span>₹{summary.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-amber-900">Old jewellery (informational)</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField
            step="0.001"
            type="number"
            label="Weight (g)"
            {...register('oldJewelleryWeight', { valueAsNumber: true })}
          />
          <InputField label="Description" {...register('oldJewelleryDescription')} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save invoice'}
        </button>
        <Link href="/invoices" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
