import crypto from 'crypto';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { Invoice } from '../models/Invoice.model.js';
import { LineItem } from '../models/LineItem.model.js';
import { Payment } from '../models/Payment.model.js';
import { Client } from '../models/Client.model.js';
import { Category } from '../models/Category.model.js';
import { InventoryItem } from '../models/InventoryItem.model.js';
import { calculateInvoiceTotals, computeLineTotal } from './invoiceCalculation.service.js';
import { generateInvoiceNumber } from './invoiceNumber.service.js';
import { markItemsSold, restoreItemsToStock } from './stock.service.js';
import { validateWeightStockForLines } from './weightStockValidation.service.js';

function skipLine(line) {
  const hasDims =
    (line.weight != null && line.weight !== '') ||
    (line.rate != null && line.rate !== '');
  const hasRefs = line.inventoryItem || line.category;
  return !hasDims && !hasRefs;
}

async function loadRefsForLine(lineDto) {
  let category = null;
  let inventoryItem = null;
  if (lineDto.category) {
    category = await Category.findById(lineDto.category).lean();
  }
  if (lineDto.inventoryItem) {
    inventoryItem = await InventoryItem.findById(lineDto.inventoryItem)
      .populate('category')
      .lean();
  }
  return { category, inventoryItem };
}

function assertLineWeightsAndRates(raw) {
  if (skipLine(raw)) return;
  const w = raw.weight;
  const r = raw.rate;
  if (w == null || w === '' || Number.isNaN(Number(w))) {
    throw new AppError('Weight is required for each line item that has data.', 422, 'VALIDATION_ERROR');
  }
  if (r == null || r === '' || Number.isNaN(Number(r))) {
    throw new AppError('Rate is required for each line item that has data.', 422, 'VALIDATION_ERROR');
  }
}

async function buildLineDocs(invoiceId, lineDtos) {
  const docs = [];
  for (const raw of lineDtos) {
    if (skipLine(raw)) continue;
    assertLineWeightsAndRates(raw);
    const { category, inventoryItem } = await loadRefsForLine(raw);
    const lineTotal = computeLineTotal(
      {
        weight: raw.weight,
        rate: raw.rate,
        makingChargeType: raw.makingChargeType,
        makingChargePct: raw.makingChargePct,
        makingChargeAmt: raw.makingChargeAmt,
      },
      category,
      inventoryItem,
    );
    docs.push({
      invoice: invoiceId,
      lineType: raw.lineType || 'piece',
      inventoryItem: raw.inventoryItem || null,
      category: raw.category || null,
      description: raw.description ?? '',
      karat: raw.karat || '22ct',
      weight: raw.weight ?? null,
      rate: raw.rate ?? 0,
      makingChargeType: raw.makingChargeType || 'pct',
      makingChargePct: raw.makingChargePct ?? null,
      makingChargeAmt: raw.makingChargeAmt ?? null,
      lineTotal,
    });
  }
  return docs;
}

async function recalcAndSaveInvoice(invoice) {
  const items = await LineItem.find({ invoice: invoice._id }).lean();
  const totals = calculateInvoiceTotals(invoice, items);
  invoice.subtotal = totals.subtotal;
  invoice.cgstAmount = totals.cgstAmount;
  invoice.sgstAmount = totals.sgstAmount;
  invoice.total = totals.total;
  await invoice.save();
}

async function ensureCashPayment(invoice) {
  if (invoice.invoiceType !== 'cash' || invoice.total <= 0) return;
  const existing = await Payment.countDocuments({ invoice: invoice._id });
  if (existing > 0) return;
  const d = invoice.issueDate ? new Date(invoice.issueDate) : new Date();
  await Payment.create({
    invoice: invoice._id,
    amountPaid: invoice.total,
    paymentDate: d,
    paymentMethod: 'other',
    notes: invoice.paymentMode || 'Cash payment',
  });
}

function assertCreditClient(payload) {
  if (payload.invoiceType === 'credit' && !payload.client) {
    throw new AppError('Client is required for credit invoices', 422, 'VALIDATION_ERROR');
  }
}

export async function listInvoices(userId, query) {
  const filter = { user: userId };
  if (query.q) {
    const q = String(query.q).trim();
    const clients = await Client.find({ user: userId, name: { $regex: q, $options: 'i' } }).select('_id').lean();
    const clientIds = clients.map((c) => c._id);
    filter.$or = [
      { invoiceNumber: { $regex: q, $options: 'i' } },
      { cashClientName: { $regex: q, $options: 'i' } },
      ...(clientIds.length ? [{ client: { $in: clientIds } }] : []),
    ];
  }
  if (query.date) {
    const day = new Date(`${query.date}T00:00:00.000Z`);
    const next = new Date(day);
    next.setUTCDate(next.getUTCDate() + 1);
    filter.issueDate = { $gte: day, $lt: next };
  }

  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Invoice.find(filter)
      .populate('client', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function getInvoice(userId, invoiceId) {
  const invoice = await Invoice.findOne({ _id: invoiceId, user: userId })
    .populate('client')
    .exec();
  if (!invoice) throw new AppError('Invoice not found', 404);
  const lineItems = await LineItem.find({ invoice: invoice._id })
    .populate('inventoryItem')
    .populate('category')
    .lean();
  const payments = await Payment.find({ invoice: invoice._id }).sort({ paymentDate: -1 }).lean();
  return { invoice, lineItems, payments };
}

export async function getPublicInvoiceByToken(token) {
  const invoice = await Invoice.findOne({ viewToken: token }).populate('client').exec();
  if (!invoice) throw new AppError('Invoice not found', 404);
  const lineItems = await LineItem.find({ invoice: invoice._id }).populate('category').populate('inventoryItem').lean();
  const amountPaid = await sumPayments(invoice._id);
  const amountDue = Math.max(0, Number(invoice.total) - amountPaid);
  return { invoice, lineItems, amountPaid, amountDue };
}

async function sumPayments(invoiceId) {
  const agg = await Payment.aggregate([
    { $match: { invoice: new mongoose.Types.ObjectId(String(invoiceId)) } },
    { $group: { _id: null, t: { $sum: '$amountPaid' } } },
  ]);
  return agg[0]?.t ?? 0;
}

export async function createInvoice(userId, payload) {
  assertCreditClient(payload);
  const lineDtos = payload.lineItems || [];
  const wErr = await validateWeightStockForLines(userId, lineDtos, null);
  if (wErr.length) throw new AppError(wErr.join(' '), 422, 'WEIGHT_STOCK');

  const invoiceNumber = await generateInvoiceNumber(userId);
  const viewToken = crypto.randomUUID();

  const doc = {
    user: userId,
    client: payload.client || null,
    invoiceType: payload.invoiceType || 'credit',
    cashClientName: payload.cashClientName ?? '',
    cashClientPhone: payload.cashClientPhone ?? '',
    cashClientAddress: payload.cashClientAddress ?? '',
    paymentMode: payload.paymentMode ?? '',
    invoiceNumber,
    issueDate: payload.issueDate ? new Date(payload.issueDate) : new Date(),
    dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
    notes: payload.notes ?? '',
    status: payload.status || 'draft',
    cgstRate: payload.cgstRate ?? 0,
    sgstRate: payload.sgstRate ?? 0,
    discountAmount: payload.discountAmount ?? 0,
    cashReceived: payload.cashReceived ?? 0,
    swapAmount: payload.swapAmount ?? 0,
    oldGoldAmount: payload.oldGoldAmount ?? 0,
    isRecurring: Boolean(payload.isRecurring),
    recurrenceInterval: payload.recurrenceInterval ?? '',
    remindersEnabled: payload.remindersEnabled !== false,
    viewToken,
    oldJewelleryWeight: payload.oldJewelleryWeight ?? null,
    oldJewelleryDescription: payload.oldJewelleryDescription ?? '',
  };

  if (doc.invoiceType === 'cash') {
    doc.status = 'paid';
    doc.dueDate = null;
  }

  if (doc.client) {
    const c = await Client.findOne({ _id: doc.client, user: userId });
    if (!c) throw new AppError('Client not found', 404);
  }

  const invoice = await Invoice.create(doc);
  const built = await buildLineDocs(invoice._id, lineDtos);
  if (built.length) await LineItem.insertMany(built);

  await recalcAndSaveInvoice(invoice);
  const created = await Invoice.findById(invoice._id);
  if (!created) throw new AppError('Invoice not found', 404);
  if (created.status !== 'cancelled') {
    await markItemsSold(created);
  }
  await ensureCashPayment(created);

  return getInvoice(userId, invoice._id);
}

export async function updateInvoice(userId, invoiceId, payload) {
  const invoice = await Invoice.findOne({ _id: invoiceId, user: userId });
  if (!invoice) throw new AppError('Invoice not found', 404);

  assertCreditClient({ ...invoice.toObject(), ...payload });

  const lineDtos = payload.lineItems;
  const replaceLines = lineDtos !== undefined;

  if (replaceLines) {
    const wErr = await validateWeightStockForLines(userId, lineDtos, invoice._id);
    if (wErr.length) throw new AppError(wErr.join(' '), 422, 'WEIGHT_STOCK');
    await restoreItemsToStock(invoice._id);
    await LineItem.deleteMany({ invoice: invoice._id });
  }

  const prevStatus = invoice.status;

  Object.assign(invoice, {
    client: payload.client !== undefined ? payload.client : invoice.client,
    invoiceType: payload.invoiceType ?? invoice.invoiceType,
    cashClientName: payload.cashClientName ?? invoice.cashClientName,
    cashClientPhone: payload.cashClientPhone ?? invoice.cashClientPhone,
    cashClientAddress: payload.cashClientAddress ?? invoice.cashClientAddress,
    paymentMode: payload.paymentMode ?? invoice.paymentMode,
    issueDate: payload.issueDate ? new Date(payload.issueDate) : invoice.issueDate,
    dueDate: payload.dueDate !== undefined ? (payload.dueDate ? new Date(payload.dueDate) : null) : invoice.dueDate,
    notes: payload.notes ?? invoice.notes,
    status: payload.status ?? invoice.status,
    cgstRate: payload.cgstRate ?? invoice.cgstRate,
    sgstRate: payload.sgstRate ?? invoice.sgstRate,
    discountAmount: payload.discountAmount ?? invoice.discountAmount,
    cashReceived: payload.cashReceived ?? invoice.cashReceived,
    swapAmount: payload.swapAmount ?? invoice.swapAmount,
    oldGoldAmount: payload.oldGoldAmount ?? invoice.oldGoldAmount,
    isRecurring: payload.isRecurring ?? invoice.isRecurring,
    recurrenceInterval: payload.recurrenceInterval ?? invoice.recurrenceInterval,
    remindersEnabled: payload.remindersEnabled ?? invoice.remindersEnabled,
    oldJewelleryWeight: payload.oldJewelleryWeight ?? invoice.oldJewelleryWeight,
    oldJewelleryDescription: payload.oldJewelleryDescription ?? invoice.oldJewelleryDescription,
  });

  if (invoice.invoiceType === 'cash') {
    invoice.status = 'paid';
    invoice.dueDate = null;
  }

  if (invoice.client) {
    const c = await Client.findOne({ _id: invoice.client, user: userId });
    if (!c) throw new AppError('Client not found', 404);
  }

  await invoice.save();

  if (replaceLines) {
    const built = await buildLineDocs(invoice._id, lineDtos);
    if (built.length) await LineItem.insertMany(built);
  } else if (payload.status === 'cancelled' && prevStatus !== 'cancelled') {
    await restoreItemsToStock(invoice._id);
  }

  await recalcAndSaveInvoice(invoice);
  const updated = await Invoice.findById(invoice._id);
  if (!updated) throw new AppError('Invoice not found', 404);
  if (updated.status !== 'cancelled') {
    await markItemsSold(updated);
  }

  if (updated.invoiceType === 'cash') {
    await Payment.deleteMany({ invoice: updated._id });
    await ensureCashPayment(updated);
  }

  return getInvoice(userId, invoice._id);
}

export async function deleteInvoice(userId, invoiceId) {
  const invoice = await Invoice.findOne({ _id: invoiceId, user: userId });
  if (!invoice) throw new AppError('Invoice not found', 404);
  await restoreItemsToStock(invoice._id);
  await Payment.deleteMany({ invoice: invoice._id });
  await LineItem.deleteMany({ invoice: invoice._id });
  await Invoice.deleteOne({ _id: invoice._id });
}

export async function updateDueDate(userId, invoiceId, dueDateInput) {
  const invoice = await Invoice.findOne({ _id: invoiceId, user: userId });
  if (!invoice) throw new AppError('Invoice not found', 404);
  if (dueDateInput !== undefined && dueDateInput !== null && dueDateInput !== '') {
    invoice.dueDate = new Date(dueDateInput);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (invoice.status === 'overdue' && invoice.dueDate >= today) {
      invoice.status = 'sent';
    }
  } else {
    invoice.dueDate = null;
  }
  await invoice.save();
  return getInvoice(userId, invoice._id);
}
