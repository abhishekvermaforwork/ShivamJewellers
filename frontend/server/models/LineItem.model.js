import mongoose from 'mongoose';
import { LINE_TYPE, KARAT, MAKING_CHARGE_TYPE } from '../utils/constants.js';

const lineItemSchema = new mongoose.Schema(
  {
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    lineType: { type: String, enum: LINE_TYPE, default: 'piece' },

    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },

    description: { type: String, default: '' },
    karat: { type: String, enum: KARAT, default: '22ct' },
    weight: { type: Number, default: null },
    rate: { type: Number, default: 0 },
    makingChargeType: { type: String, enum: MAKING_CHARGE_TYPE, default: 'pct' },
    makingChargePct: { type: Number, default: null },
    makingChargeAmt: { type: Number, default: null },
    lineTotal: { type: Number, default: 0 },
  },
  { timestamps: false },
);

export const LineItem = mongoose.models.LineItem || mongoose.model('LineItem', lineItemSchema);
