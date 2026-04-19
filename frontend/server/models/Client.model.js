import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    reference: { type: String, default: '' },
    pan: { type: String, default: '' },
    aadhar: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    paymentTerms: { type: String, default: 'net_30' },
  },
  { timestamps: { createdAt: 'created', updatedAt: false } },
);

clientSchema.index({ user: 1, name: 1 });

export const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);
