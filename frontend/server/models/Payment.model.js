import mongoose from 'mongoose';
import { PAYMENT_METHOD } from '../utils/constants.js';

const paymentSchema = new mongoose.Schema(
  {
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    amountPaid: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: PAYMENT_METHOD, default: 'other' },
    notes: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

paymentSchema.index({ invoice: 1, paymentDate: -1 });

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
