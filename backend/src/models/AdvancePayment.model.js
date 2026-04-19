import mongoose from 'mongoose';

const advancePaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    note: { type: String, default: '' },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

advancePaymentSchema.index({ user: 1, date: -1 });

export const AdvancePayment =
  mongoose.models.AdvancePayment || mongoose.model('AdvancePayment', advancePaymentSchema);
