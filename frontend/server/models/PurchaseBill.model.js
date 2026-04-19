import mongoose from 'mongoose';

const purchaseBillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    billNumber: { type: String, default: '' },
    description: { type: String, default: '' },
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    purchaseDate: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

purchaseBillSchema.index({ user: 1, purchaseDate: -1 });

export const PurchaseBill =
  mongoose.models.PurchaseBill || mongoose.model('PurchaseBill', purchaseBillSchema);
