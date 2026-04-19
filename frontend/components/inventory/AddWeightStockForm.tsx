'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'sonner';
import { weightStockFormSchema, type WeightStockFormValues } from '@/validation/inventorySchemas';
import { createWeightStock } from '@/services/inventory.service';
import { InputField } from '@/components/forms/InputField';
import { TextAreaField } from '@/components/forms/TextAreaField';

function toDatetimeLocal(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddWeightStockForm({
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
  } = useForm<WeightStockFormValues>({
    resolver: yupResolver(weightStockFormSchema) as never,
    defaultValues: {
      dateAdded: toDatetimeLocal(),
      weight: undefined,
      notes: '',
    },
  });

  async function onSubmit(values: WeightStockFormValues) {
    try {
      await createWeightStock({
        category: categoryId,
        dateAdded: new Date(values.dateAdded).toISOString(),
        weight: Number(values.weight),
        notes: values.notes?.trim() ?? '',
      });
      toast.success('Stock entry added');
      reset({
        dateAdded: toDatetimeLocal(),
        weight: undefined,
        notes: '',
      });
      onAdded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add stock');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-800">Add weight stock</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <InputField type="datetime-local" label="Date *" {...register('dateAdded')} error={errors.dateAdded?.message} />
        <InputField
          type="number"
          step="0.001"
          label="Weight (g) *"
          {...register('weight', { valueAsNumber: true })}
          error={errors.weight?.message}
        />
        <TextAreaField label="Notes" rows={2} {...register('notes')} error={errors.notes?.message} />
      </div>
      <button type="submit" className="btn-primary mt-3" disabled={isSubmitting}>
        {isSubmitting ? 'Adding…' : 'Add entry'}
      </button>
    </form>
  );
}
