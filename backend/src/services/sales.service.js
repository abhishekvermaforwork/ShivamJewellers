import Decimal from 'decimal.js';
import { InventoryItem } from '../models/InventoryItem.model.js';
import { LineItem } from '../models/LineItem.model.js';
import { Invoice } from '../models/Invoice.model.js';

/**
 * Mirrors invoices/views.py sales_report_view sold_weight + range list.
 */
export async function getSalesReport(userId, query) {
  const today = new Date();
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  let dateFrom = null;
  let dateTo = null;
  if (query.dateFrom) {
    dateFrom = new Date(`${query.dateFrom}T00:00:00.000Z`);
  }
  if (query.dateTo) {
    dateTo = new Date(`${query.dateTo}T23:59:59.999Z`);
  }

  async function soldWeight(metal, dFrom, dTo) {
    const pieceItems = await InventoryItem.find({ user: userId, status: 'sold' })
      .populate('category')
      .lean();

    let pieceW = new Decimal(0);
    for (const it of pieceItems) {
      if (it.category?.metalType !== metal) continue;
      if (dFrom && it.dateSold && new Date(it.dateSold) < dFrom) continue;
      if (dTo && it.dateSold && new Date(it.dateSold) > dTo) continue;
      pieceW = pieceW.plus(new Decimal(it.weightAtSale ?? it.weight ?? 0));
    }

    const lines = await LineItem.find({ lineType: 'weight' })
      .populate('category')
      .populate({ path: 'invoice', match: { user: userId } })
      .lean();

    let lineW = new Decimal(0);
    for (const li of lines) {
      if (!li.invoice) continue;
      if (li.category?.metalType !== metal) continue;
      const id = new Date(li.invoice.issueDate);
      if (dFrom && id < dFrom) continue;
      if (dTo && id > dTo) continue;
      lineW = lineW.plus(new Decimal(li.weight ?? 0));
    }

    return pieceW.plus(lineW).toDecimalPlaces(3).toNumber();
  }

  const dayStart = new Date(today.toISOString().slice(0, 10));
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const todayGold = await soldWeight('gold', dayStart, dayEnd);
  const todaySilver = await soldWeight('silver', dayStart, dayEnd);
  const monthEnd = new Date(today);
  const monthGold = await soldWeight('gold', monthStart, monthEnd);
  const monthSilver = await soldWeight('silver', monthStart, monthEnd);

  const hasRange = Boolean(query.dateFrom || query.dateTo);
  let rangeGold = null;
  let rangeSilver = null;
  if (hasRange) {
    rangeGold = await soldWeight('gold', dateFrom, dateTo);
    rangeSilver = await soldWeight('silver', dateFrom, dateTo);
  }

  let rangeInvoices = [];
  if (hasRange) {
    const q = { user: userId };
    if (dateFrom) q.issueDate = { $gte: dateFrom };
    if (dateTo) {
      q.issueDate = q.issueDate || {};
      q.issueDate.$lte = dateTo;
    }
    rangeInvoices = await Invoice.find(q).populate('client').sort({ issueDate: -1 }).lean();
  }

  return {
    todayGold,
    todaySilver,
    monthGold,
    monthSilver,
    dateFrom: query.dateFrom || '',
    dateTo: query.dateTo || '',
    hasRange,
    rangeGold,
    rangeSilver,
    rangeInvoices,
  };
}
