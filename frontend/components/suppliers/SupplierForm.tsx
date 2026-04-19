'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'sonner';
import { supplierFormSchema, type SupplierFormValues } from '@/validation/supplierSchema';
import { createSupplier } from '@/services/suppliers.service';
import { InputField } from '@/components/forms/InputField';
import { TextAreaField } from '@/components/forms/TextAreaField';

export function SupplierForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: yupResolver(supplierFormSchema) as never,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    },
  });

  async function onSubmit(values: SupplierFormValues) {
    try {
      await createSupplier({
        name: values.name.trim(),
        phone: values.phone?.trim() ?? '',
        email: values.email?.trim() ?? '',
        address: values.address?.trim() ?? '',
        notes: values.notes?.trim() ?? '',
      });
      toast.success('Supplier added');
      router.push('/suppliers');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save supplier');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg space-y-6">
      <div className="page-header">
        <h1>Add supplier</h1>
        <Link href="/suppliers" className="btn-secondary">
          Cancel
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <InputField label="Name *" {...register('name')} error={errors.name?.message} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField label="Phone" {...register('phone')} error={errors.phone?.message} />
          <InputField type="email" label="Email" {...register('email')} error={errors.email?.message} />
        </div>
        <TextAreaField label="Address" rows={2} {...register('address')} error={errors.address?.message} />
        <TextAreaField label="Notes" rows={2} {...register('notes')} error={errors.notes?.message} />
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save supplier'}
        </button>
        <Link href="/suppliers" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
