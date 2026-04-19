import mongoose from 'mongoose';
import { CATEGORY_TYPE, METAL_TYPE, KARAT } from '../utils/constants.js';

const categorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    categoryType: { type: String, enum: CATEGORY_TYPE, default: 'piece' },
    metalType: { type: String, enum: METAL_TYPE, default: 'gold' },
    karat: { type: String, enum: [...KARAT, ''], default: '' },
  },
  { timestamps: false },
);

categorySchema.index({ user: 1, code: 1 }, { unique: true });

export const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
