import { Client } from '../models/Client.model.js';
import { Invoice } from '../models/Invoice.model.js';
import { Payment } from '../models/Payment.model.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

async function amountPaidForInvoice(invoiceId) {
  const agg = await Payment.aggregate([
    { $match: { invoice: new mongoose.Types.ObjectId(String(invoiceId)) } },
    { $group: { _id: null, t: { $sum: '$amountPaid' } } },
  ]);
  return agg[0]?.t ?? 0;
}

export async function listClients(userId, query) {
  const filter = { user: userId };
  if (query.q) {
    filter.name = { $regex: String(query.q).trim(), $options: 'i' };
  }
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const skip = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    Client.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Client.countDocuments(filter),
  ]);

  const enriched = [];
  for (const c of rows) {
    const invoices = await Invoice.find({ client: c._id }).lean();
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    for (const inv of invoices) {
      totalInvoiced += inv.total;
      const paid = await amountPaidForInvoice(inv._id);
      totalPaid += paid;
      const due = Math.max(0, inv.total - paid);
      if (due > 0) totalOutstanding += due;
    }
    enriched.push({
      ...c,
      stats: { totalInvoiced, totalPaid, totalOutstanding },
    });
  }

  return { items: enriched, total, page, limit };
}

export async function getClient(userId, clientId) {
  const client = await Client.findOne({ _id: clientId, user: userId }).lean();
  if (!client) throw new AppError('Client not found', 404);
  const invoices = await Invoice.find({ client: client._id }).sort({ createdAt: -1 }).lean();
  let totalInvoiced = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  for (const inv of invoices) {
    totalInvoiced += inv.total;
    const paid = await amountPaidForInvoice(inv._id);
    totalPaid += paid;
    const due = Math.max(0, inv.total - paid);
    if (due > 0) totalOutstanding += due;
  }
  return {
    client,
    invoices,
    stats: { totalInvoiced, totalPaid, totalOutstanding, invoiceCount: invoices.length },
  };
}

export async function createClient(userId, payload) {
  return Client.create({ ...payload, user: userId });
}

export async function updateClient(userId, clientId, payload) {
  const client = await Client.findOne({ _id: clientId, user: userId });
  if (!client) throw new AppError('Client not found', 404);
  Object.assign(client, payload);
  await client.save();
  return client;
}

export async function deleteClient(userId, clientId) {
  const r = await Client.deleteOne({ _id: clientId, user: userId });
  if (r.deletedCount === 0) throw new AppError('Client not found', 404);
}
