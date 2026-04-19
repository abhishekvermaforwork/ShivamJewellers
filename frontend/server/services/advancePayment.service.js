import { AdvancePayment } from '../models/AdvancePayment.model.js';
import { AppError } from '../utils/AppError.js';

export async function listAdvancePayments(userId, query) {
  let q = AdvancePayment.find({ user: userId });
  if (query.q) {
    q = q.where({ name: { $regex: String(query.q).trim(), $options: 'i' } });
  }
  if (query.date) {
    const d = new Date(`${query.date}T00:00:00.000Z`);
    q = q.where({ date: d });
  }
  const advances = await q.sort({ date: -1, createdAt: -1 }).lean();
  return { advances };
}

export async function createAdvancePayment(userId, payload) {
  return AdvancePayment.create({
    user: userId,
    name: payload.name,
    phone: payload.phone ?? '',
    note: payload.note ?? '',
    amount: payload.amount,
    date: payload.date ? new Date(payload.date) : new Date(),
  });
}

export async function deleteAdvancePayment(userId, id) {
  const r = await AdvancePayment.deleteOne({ _id: id, user: userId });
  if (r.deletedCount === 0) throw new AppError('Record not found', 404);
}
