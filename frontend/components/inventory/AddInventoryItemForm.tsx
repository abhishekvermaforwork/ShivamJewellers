'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'sonner';
import { inventoryItemFormSchema, type InventoryItemFormValues } from '@/validation/inventorySchemas';
import { createInventoryItem } from '@/services/inventory.service';
import { InputField } from '@/components/forms/InputField';
import { SelectField } from '@/components/forms/SelectField';

function toDatetimeLocal(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddInventoryItemForm({
  categoryId,
  onAdded,
}: {
  categoryId: string;
  onAdded: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InventoryItemFormValues>({
    resolver: yupResolver(inventoryItemFormSchema) as never,
    defaultValues: {
      code: '',
      description: '',
      karat: '22ct',
      dateAdded: toDatetimeLocal(),
      weight: undefined,
      costPrice: 0,
      status: 'in_stock',
    },
  });

  async function onSubmit(values: InventoryItemFormValues) {
    try {
      await createInventoryItem({
        category: categoryId,
        code: values.code?.trim() ?? '',
        description: values.description?.trim() ?? '',
        karat: values.karat,
        dateAdded: new Date(values.dateAdded).toISOString(),
        weight: values.weight ?? null,
        costPrice: Number(values.costPrice),
        status: values.status,
      });
      toast.success('Item added');
      reset({
        code: '',
        description: '',
        karat: '22ct',
        dateAdded: toDatetimeLocal(),
        weight: undefined,
        costPrice: 0,
        status: 'in_stock',
      });
      onAdded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add item');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-800">Add piece</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <InputField label="Code" {...register('code')} error={errors.code?.message} />
        <InputField label="Description" {...register('description')} error={errors.description?.message} />
        <SelectField
          label="Karat *"
          options={[
            { value: '22ct', label: '22ct' },
            { value: '20ct', label: '20ct' },
            { value: '18ct', label: '18ct' },
          ]}
          {...register('karat')}
          error={errors.karat?.message}
        />
        <InputField type="datetime-local" label="Date added *" {...register('dateAdded')} error={errors.dateAdded?.message} />
        <InputField
          type="number"
          step="0.001"
          label="Weight (g)"
          {...register('weight', { valueAsNumber: true })}
          error={errors.weight?.message}
        />
        <InputField
          type="number"
          step="0.01"
          label="Cost price (₹) *"
          {...register('costPrice', { valueAsNumber: true })}
          error={errors.costPrice?.message}
        />
        <SelectField
          label="Status *"
          options={[
            { value: 'in_stock', label: 'In stock' },
            { value: 'sold', label: 'Sold' },
          ]}
          {...register('status')}
          error={errors.status?.message}
        />
      </div>
      <button type="submit" className="btn-primary mt-3" disabled={isSubmitting}>
        {isSubmitting ? 'Adding…' : 'Add item'}
      </button>
    </form>
  );
}
