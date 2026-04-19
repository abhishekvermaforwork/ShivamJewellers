import * as yup from 'yup';

const lineSchema = yup
  .object({
    lineType: yup.string().oneOf(['piece', 'weight']).required(),
    inventoryItem: yup.string().nullable().default(''),
    category: yup.string().nullable().default(''),
    description: yup.string().default(''),
    karat: yup.string().oneOf(['22ct', '20ct', '18ct']).default('22ct'),
    weight: yup.number().nullable(),
    rate: yup.number().nullable(),
    makingChargeType: yup.string().oneOf(['pct', 'amt']).default('pct'),
    makingChargePct: yup.number().nullable(),
    makingChargeAmt: yup.number().nullable(),
  })
  .test('line-weights', 'Weight and rate are required when a line has data', (value) => {
    if (!value) return true;
    const has =
      (value.weight != null && value.weight !== ('' as unknown)) ||
      (value.rate != null && value.rate !== ('' as unknown)) ||
      value.inventoryItem ||
      value.category ||
      (value.description && value.description.trim());
    if (!has) return true;
    if (value.weight == null || Number.isNaN(Number(value.weight))) return false;
    if (value.rate == null || Number.isNaN(Number(value.rate))) return false;
    return true;
  });

export const invoiceFormSchema = yup.object({
  invoiceType: yup.string().oneOf(['cash', 'credit']).required(),
  client: yup.string().nullable().default(''),
  cashClientName: yup.string(),
  cashClientPhone: yup.string(),
  cashClientAddress: yup.string(),
  paymentMode: yup.string().when('invoiceType', {
    is: 'cash',
    then: (s) => s.required('Select payment mode'),
    otherwise: (s) => s.optional(),
  }),
  issueDate: yup.string().required(),
  dueDate: yup.string().nullable(),
  status: yup.string().oneOf(['sent', 'paid', 'overdue', 'draft', 'viewed', 'cancelled']),
  notes: yup.string(),
  cgstRate: yup.number().min(0),
  sgstRate: yup.number().min(0),
  applyGst: yup.boolean().default(false),
  discountAmount: yup.number().min(0),
  cashReceived: yup.number().min(0),
  swapAmount: yup.number().min(0),
  oldGoldAmount: yup.number().min(0),
  oldJewelleryWeight: yup.number().nullable(),
  oldJewelleryDescription: yup.string(),
  lineItems: yup.array().of(lineSchema).min(1, 'Add at least one line'),
})
  .test('credit-client', 'Please select a client for a credit invoice.', (values) => {
    if (!values) return true;
    if (values.invoiceType === 'credit' && !String(values.client || '').trim()) return false;
    return true;
  });

export type InvoiceFormValues = yup.InferType<typeof invoiceFormSchema>;

export type InvoiceLineFormValues = NonNullable<InvoiceFormValues['lineItems']>[number];
