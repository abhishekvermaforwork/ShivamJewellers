import Joi from 'joi';

const oid = Joi.string().hex().length(24);

export const registerSchema = Joi.object({
  username: Joi.string().min(2).max(150).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  firstName: Joi.string().allow('').max(100),
  lastName: Joi.string().allow('').max(100),
});

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const businessProfileSchema = Joi.object({
  businessName: Joi.string().min(1).max(255).required(),
  logoUrl: Joi.string().uri().allow(''),
  address: Joi.string().allow(''),
  email: Joi.string().email().allow(''),
  phone: Joi.string().allow(''),
  taxNumber: Joi.string().allow(''),
  bankDetails: Joi.string().allow(''),
  invoicePrefix: Joi.string().max(10).allow(''),
});

export const clientWriteSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  phone: Joi.string().allow(''),
  email: Joi.string().email().allow(''),
  address: Joi.string().allow(''),
  reference: Joi.string().allow(''),
  pan: Joi.string().max(10).allow(''),
  aadhar: Joi.string().max(12).allow(''),
  photoUrl: Joi.string().allow(''),
  paymentTerms: Joi.string().default('net_30'),
});

export const clientPatchSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  phone: Joi.string().allow(''),
  email: Joi.string().email().allow(''),
  address: Joi.string().allow(''),
  reference: Joi.string().allow(''),
  pan: Joi.string().max(10).allow(''),
  aadhar: Joi.string().max(12).allow(''),
  photoUrl: Joi.string().allow(''),
  paymentTerms: Joi.string(),
}).min(1);

const lineItemSchema = Joi.object({
  lineType: Joi.string().valid('piece', 'weight'),
  inventoryItem: oid.allow(null),
  category: oid.allow(null),
  description: Joi.string().allow(''),
  karat: Joi.string().valid('22ct', '20ct', '18ct'),
  weight: Joi.number().allow(null),
  rate: Joi.number(),
  makingChargeType: Joi.string().valid('pct', 'amt'),
  makingChargePct: Joi.number().allow(null),
  makingChargeAmt: Joi.number().allow(null),
});

export const invoiceCreateSchema = Joi.object({
  invoiceType: Joi.string().valid('cash', 'credit'),
  client: oid.allow(null),
  cashClientName: Joi.string().allow(''),
  cashClientPhone: Joi.string().allow(''),
  cashClientAddress: Joi.string().allow(''),
  paymentMode: Joi.string().allow(''),
  issueDate: Joi.date().iso(),
  dueDate: Joi.date().iso().allow(null),
  notes: Joi.string().allow(''),
  status: Joi.string().valid('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'),
  cgstRate: Joi.number().min(0),
  sgstRate: Joi.number().min(0),
  discountAmount: Joi.number().min(0),
  cashReceived: Joi.number().min(0),
  swapAmount: Joi.number().min(0),
  oldGoldAmount: Joi.number().min(0),
  isRecurring: Joi.boolean(),
  recurrenceInterval: Joi.string().valid('weekly', 'monthly', 'quarterly', ''),
  remindersEnabled: Joi.boolean(),
  oldJewelleryWeight: Joi.number().allow(null),
  oldJewelleryDescription: Joi.string().allow(''),
  lineItems: Joi.array().items(lineItemSchema).default([]),
});

export const invoiceUpdateSchema = Joi.object({
  invoiceType: Joi.string().valid('cash', 'credit'),
  client: oid.allow(null),
  cashClientName: Joi.string().allow(''),
  cashClientPhone: Joi.string().allow(''),
  cashClientAddress: Joi.string().allow(''),
  paymentMode: Joi.string().allow(''),
  issueDate: Joi.date().iso(),
  dueDate: Joi.date().iso().allow(null),
  notes: Joi.string().allow(''),
  status: Joi.string().valid('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'),
  cgstRate: Joi.number().min(0),
  sgstRate: Joi.number().min(0),
  discountAmount: Joi.number().min(0),
  cashReceived: Joi.number().min(0),
  swapAmount: Joi.number().min(0),
  oldGoldAmount: Joi.number().min(0),
  isRecurring: Joi.boolean(),
  recurrenceInterval: Joi.string().valid('weekly', 'monthly', 'quarterly', ''),
  remindersEnabled: Joi.boolean(),
  oldJewelleryWeight: Joi.number().allow(null),
  oldJewelleryDescription: Joi.string().allow(''),
  lineItems: Joi.array().items(lineItemSchema),
}).min(1);

export const dueDateSchema = Joi.object({
  dueDate: Joi.date().iso().allow(null),
});

export const paymentCreateSchema = Joi.object({
  amountPaid: Joi.number().positive().required(),
  paymentDate: Joi.date().iso(),
  paymentMethod: Joi.string().valid(
    'bank_transfer',
    'cash',
    'cheque',
    'upi',
    'other',
    'stripe',
  ),
  notes: Joi.string().allow(''),
});

export const categoryWriteSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  categoryType: Joi.string().valid('piece', 'weight'),
  metalType: Joi.string().valid('gold', 'silver'),
  karat: Joi.string().valid('22ct', '20ct', '18ct', '').allow(''),
});

export const inventoryItemWriteSchema = Joi.object({
  category: oid.allow(null),
  code: Joi.string().allow(''),
  description: Joi.string().allow(''),
  karat: Joi.string().valid('22ct', '20ct', '18ct'),
  dateAdded: Joi.date().iso(),
  weight: Joi.number().allow(null),
  costPrice: Joi.number().min(0),
  status: Joi.string().valid('in_stock', 'sold'),
});

export const markSoldSchema = Joi.object({
  weightAtSale: Joi.number().allow(null),
  dateSold: Joi.date().iso(),
});

export const weightStockWriteSchema = Joi.object({
  category: oid.required(),
  dateAdded: Joi.date().iso().required(),
  weight: Joi.number().positive().required(),
  notes: Joi.string().allow(''),
});

export const supplierWriteSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().allow(''),
  email: Joi.string().email().allow(''),
  address: Joi.string().allow(''),
  notes: Joi.string().allow(''),
});

export const purchaseWriteSchema = Joi.object({
  supplier: oid.required(),
  billNumber: Joi.string().allow(''),
  description: Joi.string().allow(''),
  totalAmount: Joi.number().positive().required(),
  amountPaid: Joi.number().min(0),
  purchaseDate: Joi.date().iso(),
  notes: Joi.string().allow(''),
});

export const pettyExpenseWriteSchema = Joi.object({
  description: Joi.string().required(),
  amount: Joi.number().positive().required(),
  date: Joi.date().iso(),
});

export const advancePaymentWriteSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().allow(''),
  note: Joi.string().allow(''),
  amount: Joi.number().positive().required(),
  date: Joi.date().iso(),
});
