import * as yup from 'yup';

export const categoryFormSchema = yup.object({
  name: yup.string().min(1, 'Name is required').max(255).required(),
  code: yup.string().min(1, 'Code is required').max(64).required(),
  categoryType: yup.string().oneOf(['piece', 'weight']).required(),
  metalType: yup.string().oneOf(['gold', 'silver']).required(),
  karat: yup.string().oneOf(['', '22ct', '20ct', '18ct']).default(''),
});

export type CategoryFormValues = yup.InferType<typeof categoryFormSchema>;

export const inventoryItemFormSchema = yup.object({
  code: yup.string(),
  description: yup.string(),
  karat: yup.string().oneOf(['22ct', '20ct', '18ct']).required(),
  dateAdded: yup.string().required('Date is required'),
  weight: yup
    .number()
    .nullable()
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(Number(v)) ? null : Number(v)))
    .min(0, 'Must be ≥ 0'),
  costPrice: yup.number().min(0, 'Must be ≥ 0').required(),
  status: yup.string().oneOf(['in_stock', 'sold']).required(),
});

export type InventoryItemFormValues = yup.InferType<typeof inventoryItemFormSchema>;

export const weightStockFormSchema = yup.object({
  dateAdded: yup.string().required('Date is required'),
  weight: yup.number().positive('Weight must be greater than 0').required(),
  notes: yup.string(),
});

export type WeightStockFormValues = yup.InferType<typeof weightStockFormSchema>;
