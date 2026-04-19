/** Mirrors Django choices — keep in sync with legacy InvoiceHub */

export const INVOICE_STATUS = ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'];

export const RECURRENCE_INTERVAL = ['weekly', 'monthly', 'quarterly'];

export const LINE_TYPE = ['piece', 'weight'];

export const KARAT = ['22ct', '20ct', '18ct'];

export const INVOICE_TYPE = ['cash', 'credit'];

export const MAKING_CHARGE_TYPE = ['pct', 'amt'];

export const CATEGORY_TYPE = ['piece', 'weight'];

export const METAL_TYPE = ['gold', 'silver'];

export const ITEM_STATUS = ['in_stock', 'sold'];

export const PAYMENT_METHOD = ['bank_transfer', 'cash', 'cheque', 'upi', 'other', 'stripe'];
