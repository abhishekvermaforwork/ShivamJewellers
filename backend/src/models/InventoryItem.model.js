import mongoose from 'mongoose';
import { KARAT, ITEM_STATUS } from '../utils/constants.js';

const inventoryItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    code: { type: String, default: '' },
    description: { type: String, default: '' },
    karat: { type: String, enum: KARAT, default: '22ct' },
    dateAdded: { type: Date, default: Date.now },
    weight: { type: Number, default: null },
    costPrice: { type: Number, default: 0 },
    status: { type: String, enum: ITEM_STATUS, default: 'in_stock' },
    weightAtSale: { type: Number, default: null },
    dateSold: { type: Date, default: null },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
  },
  { timestamps: true },
);

inventoryItemSchema.index({ user: 1, category: 1 });

export const InventoryItem =
  mongoose.models.InventoryItem || mongoose.model('InventoryItem', inventoryItemSchema);
