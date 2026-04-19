'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'sonner';
import { pettyExpenseFormSchema, type PettyExpenseFormValues } from '@/validation/pettyExpenseSchema';
import { createPettyExpense } from '@/services/pettyExpenses.service';
import { InputField } from '@/components/forms/InputField';
import { TextAreaField } from '@/components/forms/TextAreaField';

function todayDateInput() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function PettyExpenseAddForm({ onAdded }: { onAdded: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PettyExpenseFormValues>({
    resolver: yupResolver(pettyExpenseFormSchema) as never,
    defaultValues: {
      description: '',
      amount: undefined,
      date: todayDateInput(),
    },
  });

  async function onSubmit(values: PettyExpenseFormValues) {
    try {
      await createPettyExpense({
        description: values.description.trim(),
        amount: Number(values.amount),
        date: new Date(`${values.date}T12:00:00`).toISOString(),
      });
      toast.success('Expense recorded');
      reset({
        description: '',
        amount: undefined,
        date: todayDateInput(),
      });
      onAdded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save expense');
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-3 text-sm font-semibold text-gray-800">Add expense</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
        <div className="md:col-span-5">
          <TextAreaField label="Description *" rows={2} {...register('description')} error={errors.description?.message} />
        </div>
        <div className="md:col-span-2">
          <InputField
            type="number"
            step="0.01"
            label="Amount (₹) *"
            {...register('amount', { valueAsNumber: true })}
            error={errors.amount?.message}
          />
        </div>
        <div className="md:col-span-3">
          <InputField type="date" label="Date *" {...register('date')} error={errors.date?.message} />
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="btn-primary w-full md:w-auto" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Add'}
          </button>
        </div>
      </div>
    </form>
  );
}
