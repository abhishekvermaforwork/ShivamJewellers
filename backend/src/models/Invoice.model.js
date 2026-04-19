import mongoose from 'mongoose';
import { INVOICE_STATUS, INVOICE_TYPE, RECURRENCE_INTERVAL } from '../utils/constants.js';

const invoiceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },

    invoiceType: {
      type: String,
      enum: INVOICE_TYPE,
      default: 'credit',
    },
    cashClientName: { type: String, default: '' },
    cashClientPhone: { type: String, default: '' },
    cashClientAddress: { type: String, default: '' },
    paymentMode: { type: String, default: '' },

    invoiceNumber: { type: String, unique: true, sparse: true },

    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },
    notes: { type: String, default: '' },
    status: { type: String, enum: INVOICE_STATUS, default: 'draft' },

    subtotal: { type: Number, default: 0 },
    cgstRate: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    cashReceived: { type: Number, default: 0 },
    swapAmount: { type: Number, default: 0 },
    oldGoldAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    isRecurring: { type: Boolean, default: false },
    recurrenceInterval: { type: String, enum: [...RECURRENCE_INTERVAL, ''], default: '' },
    remindersEnabled: { type: Boolean, default: true },
    viewToken: { type: String, unique: true, index: true },

    oldJewelleryWeight: { type: Number, default: null },
    oldJewelleryDescription: { type: String, default: '' },
  },
  { timestamps: true },
);

invoiceSchema.index({ user: 1, createdAt: -1 });
invoiceSchema.index({ user: 1, issueDate: -1 });

export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
