import { BusinessProfile } from '../models/BusinessProfile.model.js';
import { Invoice } from '../models/Invoice.model.js';

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Mirrors Django Invoice._generate_invoice_number (prefix + monotonic numeric suffix).
 */
export async function generateInvoiceNumber(userId) {
  const profile = await BusinessProfile.findOne({ user: userId }).lean();
  const prefix = (profile?.invoicePrefix || 'INV').trim() || 'INV';

  const re = new RegExp(`^${escapeRegex(prefix)}-(\\d+)$`);
  const docs = await Invoice.find({ user: userId, invoiceNumber: { $regex: `^${escapeRegex(prefix)}-` } })
    .select('invoiceNumber')
    .lean();

  let max = 0;
  for (const d of docs) {
    const m = d.invoiceNumber?.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }

  let candidate = max + 1;
  let invoiceNumber = `${prefix}-${String(candidate).padStart(5, '0')}`;
  while (await Invoice.exists({ invoiceNumber })) {
    candidate += 1;
    invoiceNumber = `${prefix}-${String(candidate).padStart(5, '0')}`;
  }
  return invoiceNumber;
}
