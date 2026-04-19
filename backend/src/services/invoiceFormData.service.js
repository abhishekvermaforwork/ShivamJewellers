import { InventoryItem } from '../models/InventoryItem.model.js';
import { Category } from '../models/Category.model.js';

/**
 * Mirrors Django _inventory_items_json + _weight_categories_json for the invoice form.
 */
export async function getInvoiceFormData(userId) {
  const uid = userId;

  const pieceItems = await InventoryItem.find({
    user: uid,
    status: 'in_stock',
  })
    .populate('category')
    .sort({ 'category.name': 1, code: 1 })
    .lean();

  const pieceJson = pieceItems.map((item) => ({
    id: String(item._id),
    code: item.code || '',
    description: item.description || '',
    category: item.category?.name || 'Other',
    karat: item.karat || '22ct',
    weight: item.weight != null ? Number(item.weight) : null,
    metal_type: item.category?.metalType || 'gold',
  }));

  const weightCats = await Category.find({
    user: uid,
    categoryType: 'weight',
  })
    .sort({ name: 1 })
    .lean();

  const weightJson = weightCats.map((c) => ({
    id: String(c._id),
    name: c.name,
    code: c.code,
    metal_type: c.metalType || 'gold',
    karat: c.karat || '',
  }));

  return { pieceItems: pieceJson, weightCategories: weightJson };
}
