import { Payment } from '../models/Payment.model.js';
import { Invoice } from '../models/Invoice.model.js';
import { AppError } from '../utils/AppError.js';

export async function listPaymentHistory(userId, query) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 30)));
  const skip = (page - 1) * limit;

  const filter = {};
  const invoices = await Invoice.find({ user: userId }).select('_id');
  const ids = invoices.map((i) => i._id);
  filter.invoice = { $in: ids };

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate({ path: 'invoice', populate: { path: 'client' } })
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function addPayment(userId, invoiceId, { amountPaid, paymentDate, paymentMethod, notes }) {
  const invoice = await Invoice.findOne({ _id: invoiceId, user: userId });
  if (!invoice) throw new AppError('Invoice not found', 404);

  const paid = await sumPaid(invoice._id);
  const due = Math.max(0, invoice.total - paid);
  if (amountPaid <= 0) throw new AppError('Payment amount must be greater than zero', 422);
  if (amountPaid > due) throw new AppError('Amount exceeds balance due', 422);

  await Payment.create({
    invoice: invoice._id,
    amountPaid,
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    paymentMethod: paymentMethod || 'other',
    notes: notes || '',
  });

  const newPaid = await sumPaid(invoice._id);
  if (invoice.total - newPaid <= 0) {
    invoice.status = 'paid';
    await invoice.save();
  }
}

async function sumPaid(invoiceId) {
  const r = await Payment.aggregate([
    { $match: { invoice: invoiceId } },
    { $group: { _id: null, t: { $sum: '$amountPaid' } } },
  ]);
  return r[0]?.t ?? 0;
}

export async function markInvoicePaid(userId, invoiceId) {
  const invoice = await Invoice.findOne({ _id: invoiceId, user: userId });
  if (!invoice) throw new AppError('Invoice not found', 404);
  const due = Math.max(0, invoice.total - (await sumPaid(invoice._id)));
  if (due <= 0) throw new AppError('Invoice is already fully paid', 422);
  await Payment.create({
    invoice: invoice._id,
    amountPaid: due,
    paymentMethod: 'other',
    notes: 'Marked as paid manually',
  });
  invoice.status = 'paid';
  await invoice.save();
}

export async function markInvoiceUnpaid(userId, invoiceId) {
  const invoice = await Invoice.findOne({ _id: invoiceId, user: userId });
  if (!invoice) throw new AppError('Invoice not found', 404);
  if (invoice.invoiceType === 'cash') {
    throw new AppError('Cash invoices cannot be marked unpaid', 422);
  }
  await Payment.deleteMany({ invoice: invoice._id });
  invoice.status = 'sent';
  await invoice.save();
}
