import { PettyExpense } from '../models/PettyExpense.model.js';
import { AppError } from '../utils/AppError.js';

export async function listPettyExpenses(userId, query) {
  const filter = { user: userId };

  if (query.date) {
    const d = new Date(`${query.date}T00:00:00.000Z`);
    const next = new Date(d);
    next.setUTCDate(next.getUTCDate() + 1);
    filter.date = { $gte: d, $lt: next };
  } else if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) {
      filter.date.$gte = new Date(`${query.startDate}T00:00:00.000Z`);
    }
    if (query.endDate) {
      const e = new Date(`${query.endDate}T00:00:00.000Z`);
      e.setUTCDate(e.getUTCDate() + 1);
      filter.date.$lt = e;
    }
  }

  const expenses = await PettyExpense.find(filter).sort({ date: -1, createdAt: -1 }).lean();
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  return { expenses, total };
}

export async function createPettyExpense(userId, payload) {
  return PettyExpense.create({
    user: userId,
    description: payload.description,
    amount: payload.amount,
    date: payload.date ? new Date(payload.date) : new Date(),
  });
}

export async function deletePettyExpense(userId, id) {
  const r = await PettyExpense.deleteOne({ _id: id, user: userId });
  if (r.deletedCount === 0) throw new AppError('Expense not found', 404);
}
