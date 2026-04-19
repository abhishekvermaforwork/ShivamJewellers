import mongoose from 'mongoose';

const businessProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: { type: String, required: true },
    logoUrl: { type: String, default: '' },
    address: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    taxNumber: { type: String, default: '' },
    bankDetails: { type: String, default: '' },
    invoicePrefix: { type: String, default: 'INV', maxlength: 10 },
  },
  { timestamps: true },
);

export const BusinessProfile =
  mongoose.models.BusinessProfile || mongoose.model('BusinessProfile', businessProfileSchema);
