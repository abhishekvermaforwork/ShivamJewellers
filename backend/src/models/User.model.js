import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isStaff: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = async function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(plain) {
  return bcrypt.hash(plain, env.bcryptSaltRounds);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
