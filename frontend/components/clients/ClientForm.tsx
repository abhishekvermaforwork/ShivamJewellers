'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'sonner';
import { clientFormSchema, type ClientFormValues } from '@/validation/clientSchema';
import { createClient, fetchClient, updateClient } from '@/services/clients.service';
import { InputField } from '@/components/forms/InputField';
import { TextAreaField } from '@/components/forms/TextAreaField';
import { SelectField } from '@/components/forms/SelectField';

const PAYMENT_TERMS = [
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_7', label: 'Net 7' },
  { value: 'due_on_receipt', label: 'Due on receipt' },
];

export function ClientForm({ mode, clientId }: { mode: 'create' | 'edit'; clientId?: string }) {
  const router = useRouter();
  const [loadError, setLoadError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: yupResolver(clientFormSchema) as never,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      reference: '',
      pan: '',
      aadhar: '',
      paymentTerms: 'net_30',
    },
  });

  useEffect(() => {
    if (mode !== 'edit' || !clientId) return;
    let cancelled = false;
    (async () => {
      try {
        const c = await fetchClient(clientId);
        if (cancelled) return;
        reset({
          name: String(c.name ?? ''),
          phone: String(c.phone ?? ''),
          email: String(c.email ?? ''),
          address: String(c.address ?? ''),
          reference: String(c.reference ?? ''),
          pan: String(c.pan ?? ''),
          aadhar: String(c.aadhar ?? ''),
          paymentTerms: (c.paymentTerms as string) || 'net_30',
        });
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load client');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, clientId, reset]);

  async function onSubmit(values: ClientFormValues) {
    const body = {
      name: values.name.trim(),
      phone: values.phone?.trim() ?? '',
      email: values.email?.trim() ?? '',
      address: values.address?.trim() ?? '',
      reference: values.reference?.trim() ?? '',
      pan: values.pan?.trim() ?? '',
      aadhar: values.aadhar?.trim() ?? '',
      paymentTerms: values.paymentTerms ?? 'net_30',
    };
    try {
      if (mode === 'create') {
        await createClient(body);
        toast.success('Client created');
        router.push('/clients');
      } else if (clientId) {
        await updateClient(clientId, body);
        toast.success('Client updated');
        router.push(`/clients/${clientId}`);
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save client');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-6">
      <div className="page-header">
        <h1>{mode === 'create' ? 'Add client' : 'Edit client'}</h1>
        <Link href={mode === 'edit' && clientId ? `/clients/${clientId}` : '/clients'} className="btn-secondary">
          Cancel
        </Link>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <InputField label="Name *" {...register('name')} error={errors.name?.message} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField label="Phone" {...register('phone')} error={errors.phone?.message} />
          <InputField label="Email" type="email" {...register('email')} error={errors.email?.message} />
        </div>
        <TextAreaField label="Address" rows={3} {...register('address')} error={errors.address?.message} />
        <InputField label="Reference" {...register('reference')} error={errors.reference?.message} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField label="PAN" {...register('pan')} error={errors.pan?.message} />
          <InputField label="Aadhar" {...register('aadhar')} error={errors.aadhar?.message} />
        </div>
        <SelectField label="Payment terms" options={PAYMENT_TERMS} {...register('paymentTerms')} error={errors.paymentTerms?.message} />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save'}
        </button>
        <Link href={mode === 'edit' && clientId ? `/clients/${clientId}` : '/clients'} className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
