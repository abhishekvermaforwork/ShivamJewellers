import mongoose from 'mongoose';

const pettyExpenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

pettyExpenseSchema.index({ user: 1, date: -1 });

export const PettyExpense =
  mongoose.models.PettyExpense || mongoose.model('PettyExpense', pettyExpenseSchema);
