import * as yup from 'yup';

export const clientFormSchema = yup.object({
  name: yup.string().min(1, 'Name is required').max(255).required(),
  phone: yup.string(),
  email: yup
    .string()
    .transform((v) => (v === '' || v == null ? undefined : v))
    .email('Invalid email')
    .optional(),
  address: yup.string(),
  reference: yup.string(),
  pan: yup.string().max(10),
  aadhar: yup.string().max(12),
  paymentTerms: yup.string().default('net_30'),
});

export type ClientFormValues = yup.InferType<typeof clientFormSchema>;
