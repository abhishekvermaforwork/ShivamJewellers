import Decimal from 'decimal.js';
import { Category } from '../models/Category.model.js';
import { LineItem } from '../models/LineItem.model.js';
import { WeightStockEntry } from '../models/WeightStockEntry.model.js';

/**
 * Mirrors Django _validate_weight_stock (formset + existing invoice on update).
 * @param {string} userId
 * @param {Array<object>} lineDtos - normalized line payloads (lineType, category, weight)
 * @param {string|null} excludeInvoiceId - Mongo id string when updating an invoice
 */
export async function validateWeightStockForLines(userId, lineDtos, excludeInvoiceId = null) {
  const errors = [];
  /** @type {Map<string, Decimal>} */
  const requested = new Map();

  for (const line of lineDtos) {
    if (line.lineType !== 'weight') continue;
    if (!line.category) continue;
    const w = new Decimal(line.weight ?? 0);
    if (w.lte(0)) continue;
    const catId = String(line.category);
    requested.set(catId, (requested.get(catId) || new Decimal(0)).plus(w));
  }

  for (const [catId, reqWeight] of requested) {
    const cat = await Category.findOne({ _id: catId, user: userId });
    if (!cat) continue;

    const totalInAgg = await WeightStockEntry.aggregate([
      { $match: { category: cat._id } },
      { $group: { _id: null, t: { $sum: '$weight' } } },
    ]);
    const totalIn = new Decimal(totalInAgg[0]?.t ?? 0);

    const soldMatch = {
      category: cat._id,
      lineType: 'weight',
    };
    if (excludeInvoiceId) {
      soldMatch.invoice = { $ne: excludeInvoiceId };
    }
    const totalSoldAgg = await LineItem.aggregate([
      { $match: soldMatch },
      { $group: { _id: null, t: { $sum: '$weight' } } },
    ]);
    const totalSold = new Decimal(totalSoldAgg[0]?.t ?? 0);
    const available = totalIn.minus(totalSold);

    if (reqWeight.gt(available)) {
      errors.push(
        `"${cat.name}": requested ${reqWeight.toFixed(3)}g but only ${available.toFixed(3)}g available in stock.`,
      );
    }
  }

  return errors;
}
