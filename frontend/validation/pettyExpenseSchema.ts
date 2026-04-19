import * as yup from 'yup';

export const pettyExpenseFormSchema = yup.object({
  description: yup.string().min(1, 'Description is required').max(500).required(),
  amount: yup.number().positive('Amount must be greater than 0').required(),
  date: yup.string().required('Date is required'),
});

export type PettyExpenseFormValues = yup.InferType<typeof pettyExpenseFormSchema>;
