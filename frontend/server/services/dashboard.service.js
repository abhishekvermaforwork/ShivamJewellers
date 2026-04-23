import { Invoice } from '../models/Invoice.model.js';
import { Payment } from '../models/Payment.model.js';

async function paidTotalsByInvoice(invoiceIds) {
  if (!invoiceIds.length) return new Map();
  const rows = await Payment.aggregate([
    { $match: { invoice: { $in: invoiceIds } } },
    { $group: { _id: '$invoice', t: { $sum: '$amountPaid' } } },
  ]);
  const totals = new Map();
  for (const row of rows) {
    totals.set(String(row._id), row.t ?? 0);
  }
  return totals;
}

function displayName(inv) {
  if (inv.invoiceType === 'cash') return inv.cashClientName || 'Cash Customer';
  return inv.client?.name || '—';
}

/**
 * Mirrors dashboard/views.py DashboardView.get_context_data (core KPIs).
 */
export async function getDashboard(userId) {
  const today = new Date();
  const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  await Invoice.updateMany(
    {
      user: userId,
      dueDate: { $lt: today, $ne: null },
      status: { $in: ['sent', 'viewed'] },
    },
    { $set: { status: 'overdue' } },
  );

  const monthPayments = await Payment.find({
    paymentDate: { $gte: startOfMonth, $lte: today },
  })
    .populate({
      path: 'invoice',
      match: { user: userId },
      populate: { path: 'client', select: 'name' },
    })
    .lean();

  let revenueThisMonth = 0;
  const revByClient = new Map();
  for (const p of monthPayments) {
    if (!p.invoice) continue;
    revenueThisMonth += p.amountPaid;
    const name = displayName(p.invoice);
    revByClient.set(name, (revByClient.get(name) || 0) + p.amountPaid);
  }

  const outstandingInvoices = await Invoice.find({
    user: userId,
    status: { $in: ['sent', 'viewed', 'overdue'] },
  })
    .populate('client')
    .lean();

  const overdueInvoices = await Invoice.find({ user: userId, status: 'overdue' }).populate('client').lean();
  const invoiceIds = [...outstandingInvoices, ...overdueInvoices].map((inv) => inv._id);
  const paidTotals = await paidTotalsByInvoice(invoiceIds);

  let totalOutstanding = 0;
  const obClients = new Map();
  for (const inv of outstandingInvoices) {
    const paid = paidTotals.get(String(inv._id)) ?? 0;
    const due = Math.max(0, inv.total - paid);
    totalOutstanding += due;
    const name = displayName(inv);
    obClients.set(name, (obClients.get(name) || 0) + due);
  }

  let totalOverdue = 0;
  const odClients = new Map();
  for (const inv of overdueInvoices) {
    const paid = paidTotals.get(String(inv._id)) ?? 0;
    const due = Math.max(0, inv.total - paid);
    totalOverdue += due;
    const name = displayName(inv);
    odClients.set(name, (odClients.get(name) || 0) + due);
  }

  const paidInvoices = await Invoice.find({ user: userId, status: 'paid' }).populate('client').lean();
  const revenueByName = new Map();
  for (const inv of paidInvoices) {
    const name = displayName(inv);
    revenueByName.set(name, (revenueByName.get(name) || 0) + inv.total);
  }
  const clientTotals = [...revenueByName.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const recentInvoices = await Invoice.find({ user: userId })
    .populate('client')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return {
    revenueThisMonth,
    totalOutstanding,
    totalOverdue,
    outstandingClients: [...obClients.entries()].map(([name, amount]) => ({ name, amount })),
    overdueClients: [...odClients.entries()].map(([name, amount]) => ({ name, amount })),
    revenueClients: [...revByClient.entries()].map(([name, amount]) => ({ name, amount })),
    clientTotals,
    recentInvoices,
  };
}
