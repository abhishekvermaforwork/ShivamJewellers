import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { BusinessProfile } from '../models/BusinessProfile.model.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export async function register({ username, email, password, firstName, lastName }) {
  const uname = username.trim();
  const exists =
    (await User.exists({ $or: [{ username: new RegExp(`^${uname}$`, 'i') }, { email: email.toLowerCase() }] })) != null;
  if (exists) {
    throw new AppError('Username or email already registered', 409, 'DUPLICATE');
  }
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    username: uname,
    email: email.toLowerCase(),
    passwordHash,
    firstName: firstName || '',
    lastName: lastName || '',
  });
  const token = signToken(user._id);
  const safe = user.toObject();
  delete safe.passwordHash;
  return { user: safe, token };
}

export async function login({ username, password }) {
  const uname = username.trim();
  const user = await User.findOne({
    $or: [{ username: new RegExp(`^${uname}$`, 'i') }, { email: uname.toLowerCase() }],
  }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }
  if (!user.isActive) {
    throw new AppError('Account disabled', 403, 'FORBIDDEN');
  }
  const token = signToken(user._id);
  const safe = user.toObject();
  delete safe.passwordHash;
  return { user: safe, token };
}

export async function getMe(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new AppError('User not found', 404);
  const profile = await BusinessProfile.findOne({ user: userId }).lean();
  return { user, businessProfile: profile };
}

export async function ensureBusinessProfile(userId, payload) {
  let profile = await BusinessProfile.findOne({ user: userId });
  if (!profile) {
    profile = await BusinessProfile.create({
      user: userId,
      businessName: payload.businessName || 'My Business',
      ...payload,
    });
    return profile;
  }
  Object.assign(profile, payload);
  await profile.save();
  return profile;
}
