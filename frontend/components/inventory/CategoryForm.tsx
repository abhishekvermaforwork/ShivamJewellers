'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'sonner';
import { categoryFormSchema, type CategoryFormValues } from '@/validation/inventorySchemas';
import { createCategory } from '@/services/inventory.service';
import { InputField } from '@/components/forms/InputField';
import { SelectField } from '@/components/forms/SelectField';

export function CategoryForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: yupResolver(categoryFormSchema) as never,
    defaultValues: {
      name: '',
      code: '',
      categoryType: 'piece',
      metalType: 'gold',
      karat: '22ct',
    },
  });

  const metalType = watch('metalType');

  useEffect(() => {
    if (metalType === 'silver') setValue('karat', '');
  }, [metalType, setValue]);

  async function onSubmit(values: CategoryFormValues) {
    try {
      const karat =
        values.metalType === 'gold' ? values.karat || '22ct' : '';
      await createCategory({
        name: values.name.trim(),
        code: values.code.trim(),
        categoryType: values.categoryType,
        metalType: values.metalType,
        karat: karat as CategoryFormValues['karat'],
      });
      toast.success('Category created');
      router.push('/inventory');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create category');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg space-y-6">
      <div className="page-header">
        <h1>New category</h1>
        <Link href="/inventory" className="btn-secondary">
          Cancel
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <InputField label="Name *" {...register('name')} error={errors.name?.message} />
        <InputField label="Code *" {...register('code')} error={errors.code?.message} hint="Unique code per category" />
        <SelectField
          label="Type *"
          options={[
            { value: 'piece', label: 'Piece (individual items)' },
            { value: 'weight', label: 'Weight (bulk stock)' },
          ]}
          {...register('categoryType')}
          error={errors.categoryType?.message}
        />
        <SelectField
          label="Metal *"
          options={[
            { value: 'gold', label: 'Gold' },
            { value: 'silver', label: 'Silver' },
          ]}
          {...register('metalType')}
          error={errors.metalType?.message}
        />
        {metalType === 'gold' ? (
          <SelectField
            label="Default karat"
            options={[
              { value: '22ct', label: '22ct' },
              { value: '20ct', label: '20ct' },
              { value: '18ct', label: '18ct' },
              { value: '', label: '—' },
            ]}
            {...register('karat')}
            error={errors.karat?.message}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Create category'}
        </button>
        <Link href="/inventory" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
