import Decimal from 'decimal.js';
import { Supplier } from '../models/Supplier.model.js';
import { PurchaseBill } from '../models/PurchaseBill.model.js';
import { AppError } from '../utils/AppError.js';

function supplierTotals(supplierId, userId, purchases) {
  const list = purchases.filter((p) => String(p.supplier) === String(supplierId));
  const totalPurchased = list.reduce((s, p) => s.plus(new Decimal(p.totalAmount ?? 0)), new Decimal(0));
  const totalPaid = list.reduce((s, p) => s.plus(new Decimal(p.amountPaid ?? 0)), new Decimal(0));
  return {
    totalPurchased: totalPurchased.toNumber(),
    totalPaid: totalPaid.toNumber(),
    totalPending: totalPurchased.minus(totalPaid).toNumber(),
  };
}

export async function listSuppliers(userId) {
  const suppliers = await Supplier.find({ user: userId }).sort({ name: 1 }).lean();
  const purchases = await PurchaseBill.find({ user: userId }).lean();
  return suppliers.map((s) => ({
    ...s,
    ...supplierTotals(s._id, userId, purchases),
  }));
}

export async function createSupplier(userId, payload) {
  return Supplier.create({ ...payload, user: userId });
}

export async function updateSupplier(userId, id, payload) {
  const s = await Supplier.findOne({ _id: id, user: userId });
  if (!s) throw new AppError('Supplier not found', 404);
  Object.assign(s, payload);
  await s.save();
  return s;
}

export async function deleteSupplier(userId, id) {
  const r = await Supplier.deleteOne({ _id: id, user: userId });
  if (r.deletedCount === 0) throw new AppError('Supplier not found', 404);
}

export async function listPurchases(userId, supplierId) {
  const filter = { user: userId };
  if (supplierId) filter.supplier = supplierId;
  return PurchaseBill.find(filter).populate('supplier').sort({ purchaseDate: -1 }).lean();
}

export async function createPurchase(userId, payload) {
  const s = await Supplier.findOne({ _id: payload.supplier, user: userId });
  if (!s) throw new AppError('Supplier not found', 404);
  return PurchaseBill.create({ ...payload, user: userId });
}

export async function updatePurchase(userId, id, payload) {
  const p = await PurchaseBill.findOne({ _id: id, user: userId });
  if (!p) throw new AppError('Purchase not found', 404);
  if (payload.supplier) {
    const s = await Supplier.findOne({ _id: payload.supplier, user: userId });
    if (!s) throw new AppError('Supplier not found', 404);
  }
  Object.assign(p, payload);
  await p.save();
  return p;
}

export async function deletePurchase(userId, id) {
  const r = await PurchaseBill.deleteOne({ _id: id, user: userId });
  if (r.deletedCount === 0) throw new AppError('Purchase not found', 404);
}
