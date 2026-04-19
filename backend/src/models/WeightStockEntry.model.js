import mongoose from 'mongoose';

const weightStockEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    dateAdded: { type: Date, required: true },
    weight: { type: Number, required: true },
    notes: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

weightStockEntrySchema.index({ category: 1, dateAdded: -1 });

export const WeightStockEntry =
  mongoose.models.WeightStockEntry || mongoose.model('WeightStockEntry', weightStockEntrySchema);
