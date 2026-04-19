import Decimal from 'decimal.js';
import mongoose from 'mongoose';
import { Category } from '../models/Category.model.js';
import { InventoryItem } from '../models/InventoryItem.model.js';
import { WeightStockEntry } from '../models/WeightStockEntry.model.js';
import { LineItem } from '../models/LineItem.model.js';
import { AppError } from '../utils/AppError.js';

export async function listCategories(userId) {
  const categories = await Category.find({ user: userId }).sort({ name: 1 }).lean();

  let goldAvailable = new Decimal(0);
  let silverAvailable = new Decimal(0);

  for (const cat of categories) {
    let avail = new Decimal(0);
    const uid = new mongoose.Types.ObjectId(String(userId));
    if (cat.categoryType === 'piece') {
      const agg = await InventoryItem.aggregate([
        { $match: { user: uid, category: cat._id, status: 'in_stock' } },
        { $group: { _id: null, t: { $sum: '$weight' } } },
      ]);
      avail = new Decimal(agg[0]?.t ?? 0);
    } else {
      const entries = await WeightStockEntry.aggregate([
        { $match: { user: uid, category: cat._id } },
        { $group: { _id: null, t: { $sum: '$weight' } } },
      ]);
      const sold = await LineItem.aggregate([
        { $match: { category: cat._id, lineType: 'weight' } },
        { $group: { _id: null, t: { $sum: '$weight' } } },
      ]);
      avail = new Decimal(entries[0]?.t ?? 0).minus(new Decimal(sold[0]?.t ?? 0));
    }
    if (cat.metalType === 'gold') goldAvailable = goldAvailable.plus(avail);
    else silverAvailable = silverAvailable.plus(avail);
  }

  return { categories, totalGold: goldAvailable.toNumber(), totalSilver: silverAvailable.toNumber() };
}

export async function getCategoryDetail(userId, categoryId) {
  const cat = await Category.findOne({ _id: categoryId, user: userId });
  if (!cat) throw new AppError('Category not found', 404);

  if (cat.categoryType === 'piece') {
    const items = await InventoryItem.find({ user: userId, category: cat._id }).sort({ dateAdded: 1, code: 1 }).lean();
    const totalPieces = items.length;
    const soldPieces = items.filter((i) => i.status === 'sold').length;
    const stockPieces = items.filter((i) => i.status === 'in_stock').length;
    let totalWeight = new Decimal(0);
    let soldWeight = new Decimal(0);
    for (const it of items) {
      totalWeight = totalWeight.plus(new Decimal(it.weight ?? 0));
      if (it.status === 'sold') soldWeight = soldWeight.plus(new Decimal(it.weightAtSale ?? it.weight ?? 0));
    }
    return {
      category: cat,
      mode: 'piece',
      items,
      totalPieces,
      soldPieces,
      stockPieces,
      totalWeight: totalWeight.toNumber(),
      soldWeight: soldWeight.toNumber(),
      stockWeight: totalWeight.minus(soldWeight).toNumber(),
    };
  }

  const weightEntries = await WeightStockEntry.find({ user: userId, category: cat._id })
    .sort({ dateAdded: -1 })
    .lean();
  const sales = await LineItem.find({ category: cat._id, lineType: 'weight' })
    .populate({ path: 'invoice', select: 'issueDate invoiceNumber' })
    .sort({ _id: 1 })
    .lean();

  const totalIn = new Decimal(
    weightEntries.reduce((s, e) => s + (e.weight || 0), 0),
  ).toDecimalPlaces(3);
  const totalSold = new Decimal(sales.reduce((s, li) => s + (li.weight || 0), 0)).toDecimalPlaces(3);
  const available = totalIn.minus(totalSold).toDecimalPlaces(3);

  return {
    category: cat,
    mode: 'weight',
    weightEntries,
    weightSales: sales,
    totalIn: totalIn.toNumber(),
    totalSold: totalSold.toNumber(),
    available: available.toNumber(),
  };
}

export async function createCategory(userId, payload) {
  return Category.create({ ...payload, user: userId });
}

export async function updateCategory(userId, id, payload) {
  const c = await Category.findOne({ _id: id, user: userId });
  if (!c) throw new AppError('Category not found', 404);
  Object.assign(c, payload);
  await c.save();
  return c;
}

export async function deleteCategory(userId, id) {
  const r = await Category.deleteOne({ _id: id, user: userId });
  if (r.deletedCount === 0) throw new AppError('Category not found', 404);
}

export async function createInventoryItem(userId, payload) {
  if (payload.category) {
    const cat = await Category.findOne({ _id: payload.category, user: userId });
    if (!cat) throw new AppError('Category not found', 404);
  }
  return InventoryItem.create({ ...payload, user: userId });
}

export async function updateInventoryItem(userId, id, payload) {
  const item = await InventoryItem.findOne({ _id: id, user: userId });
  if (!item) throw new AppError('Item not found', 404);
  Object.assign(item, payload);
  await item.save();
  return item;
}

export async function deleteInventoryItem(userId, id) {
  const r = await InventoryItem.deleteOne({ _id: id, user: userId });
  if (r.deletedCount === 0) throw new AppError('Item not found', 404);
}

export async function markItemSold(userId, id, { weightAtSale, dateSold }) {
  const item = await InventoryItem.findOne({ _id: id, user: userId });
  if (!item) throw new AppError('Item not found', 404);
  item.status = 'sold';
  item.weightAtSale = weightAtSale ?? item.weight;
  item.dateSold = dateSold ? new Date(dateSold) : new Date();
  await item.save();
  return item;
}

export async function markItemUnsold(userId, id) {
  const item = await InventoryItem.findOne({ _id: id, user: userId });
  if (!item) throw new AppError('Item not found', 404);
  if (item.invoice) {
    throw new AppError(
      'This item is linked to an invoice. Edit or delete that invoice to restore stock.',
      422,
    );
  }
  item.status = 'in_stock';
  item.weightAtSale = null;
  item.dateSold = null;
  await item.save();
  return item;
}

export async function createWeightStock(userId, payload) {
  const cat = await Category.findOne({ _id: payload.category, user: userId });
  if (!cat) throw new AppError('Category not found', 404);
  return WeightStockEntry.create({ ...payload, user: userId });
}

export async function deleteWeightStock(userId, id) {
  const r = await WeightStockEntry.deleteOne({ _id: id, user: userId });
  if (r.deletedCount === 0) throw new AppError('Entry not found', 404);
}
