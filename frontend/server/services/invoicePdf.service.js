import PDFDocument from 'pdfkit';
import { Invoice } from '../models/Invoice.model.js';
import { LineItem } from '../models/LineItem.model.js';
import { BusinessProfile } from '../models/BusinessProfile.model.js';
import { AppError } from '../utils/AppError.js';
import { numberToWords } from '../utils/numberToWords.js';

function fmtMoney(n) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n || 0),
  );
}

function fmtInt(n) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(n || 0));
}

function clientDisplayName(invoice) {
  if (invoice.invoiceType === 'cash') {
    return invoice.cashClientName || 'Cash Customer';
  }
  return invoice.client?.name || '—';
}

function isSilverLine(item) {
  if (item.category?.metalType === 'silver') return true;
  if (item.inventoryItem?.category?.metalType === 'silver') return true;
  return false;
}

/**
 * Generate invoice PDF buffer (parity with Django PDF content).
 */
export async function generateInvoicePdfBuffer(userId, invoiceId) {
  const invoice = await Invoice.findOne({ _id: invoiceId, user: userId })
    .populate('client')
    .lean();
  if (!invoice) throw new AppError('Invoice not found', 404);

  const profile = await BusinessProfile.findOne({ user: userId }).lean();
  const lineItems = await LineItem.find({ invoice: invoice._id })
    .populate('category')
    .populate({ path: 'inventoryItem', populate: { path: 'category' } })
    .sort({ _id: 1 })
    .lean();

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const bufPromise = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const bizName = profile?.businessName || 'InvoiceHub';
  const phone = profile?.phone || '';
  const gstin = profile?.taxNumber || '';

  doc.fontSize(18).fillColor('#7a2800').text(bizName, { align: 'center' });
  doc.moveDown(0.2);
  doc.fontSize(9).fillColor('#333');
  const addrLine = [profile?.address, phone ? `Mob.: ${phone}` : ''].filter(Boolean).join(' | ');
  if (addrLine) doc.text(addrLine, { align: 'center' });
  if (gstin && (Number(invoice.cgstRate) > 0 || Number(invoice.sgstRate) > 0)) {
    doc.fontSize(10).text(`GSTIN: ${gstin}`, { align: 'center' });
  }
  doc.moveDown(0.6);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#999');
  doc.moveDown(0.4);

  const issue = invoice.issueDate ? new Date(invoice.issueDate) : new Date();
  const yMeta = doc.y;
  doc.fontSize(10).fillColor('#111');
  doc.text(`Bill No: ${invoice.invoiceNumber || ''}  (${invoice.invoiceType === 'cash' ? 'CASH' : 'CREDIT'})`, 40, yMeta, {
    width: 320,
  });
  doc.text(
    `Date: ${issue.toLocaleDateString('en-IN')}  ${issue.toLocaleTimeString('en-IN')}`,
    360,
    yMeta,
    { width: 195, align: 'right' },
  );
  doc.y = yMeta + 28;

  if (invoice.invoiceType === 'cash' && invoice.paymentMode) {
    doc.fontSize(9).text(`Payment: ${invoice.paymentMode}`, 40, doc.y);
    doc.moveDown(0.3);
  }

  doc.fontSize(10.5).text(`M/s: ${clientDisplayName(invoice)}`, 40, doc.y);
  doc.moveDown(0.2);
  if (invoice.invoiceType === 'cash') {
    if (invoice.cashClientAddress) doc.fontSize(9).text(`Address: ${invoice.cashClientAddress}`);
    if (invoice.cashClientPhone) doc.fontSize(9).text(`Phone: ${invoice.cashClientPhone}`);
  } else if (invoice.client) {
    if (invoice.client.address) doc.fontSize(9).text(`Address: ${invoice.client.address}`);
    if (invoice.client.phone) doc.fontSize(9).text(`Phone: ${invoice.client.phone}`);
  }
  doc.moveDown(0.6);

  let y = doc.y;
  doc.fontSize(9);
  doc.rect(40, y, 515, 16).fillAndStroke('#f5f5f5', '#999');
  doc.fillColor('#111');
  doc.text('SN', 44, y + 4, { width: 22 });
  doc.text('Item', 70, y + 4, { width: 210 });
  doc.text('Wt', 285, y + 4, { width: 40, align: 'right' });
  doc.text('Rate', 330, y + 4, { width: 50, align: 'right' });
  doc.text('MC', 385, y + 4, { width: 45, align: 'right' });
  doc.text('Total', 435, y + 4, { width: 115, align: 'right' });
  y += 18;

  lineItems.forEach((item, i) => {
    const rowH = 32;
    if (y + rowH > 780) {
      doc.addPage();
      y = 50;
    }
    doc.rect(40, y, 515, rowH).stroke('#ccc');
    doc.fillColor('#111').fontSize(9);
    doc.text(String(i + 1), 44, y + 4, { width: 22 });
    const desc = item.description || '—';
    doc.text(desc, 70, y + 4, { width: 210 });
    if (!isSilverLine(item) && item.karat) {
      const k =
        item.karat === '22ct'
          ? '22ct 91.6%'
          : item.karat === '20ct'
            ? '20ct 83.3%'
            : item.karat === '18ct'
              ? '18ct 75%'
              : item.karat;
      doc.fontSize(7.5).fillColor('#555').text(k, 70, y + 14, { width: 210 });
      doc.fillColor('#111').fontSize(9);
    }
    doc.text(item.weight != null ? Number(item.weight).toFixed(3) : '—', 285, y + 4, { width: 40, align: 'right' });
    doc.text(fmtInt(item.rate), 330, y + 4, { width: 50, align: 'right' });
    let mc = '—';
    if (item.makingChargePct) mc = `${item.makingChargePct}%`;
    else if (item.makingChargeAmt) mc = `₹${fmtMoney(item.makingChargeAmt)}`;
    doc.text(mc, 385, y + 4, { width: 45, align: 'right' });
    doc.text(fmtInt(item.lineTotal), 435, y + 4, { width: 115, align: 'right' });
    y += rowH;
  });

  doc.y = y + 14;

  const subtotal = Number(invoice.subtotal || 0);
  const cgst = Number(invoice.cgstAmount || 0);
  const sgst = Number(invoice.sgstAmount || 0);
  const tax = cgst + sgst;
  const total = Number(invoice.total || 0);

  doc.fontSize(10).fillColor('#111');
  doc.text(`Subtotal: ₹${fmtMoney(subtotal)}`, { align: 'right' });
  if (tax > 0) doc.text(`GST (CGST + SGST): ₹${fmtMoney(tax)}`, { align: 'right' });
  const disc = Number(invoice.discountAmount || 0);
  const cashR = Number(invoice.cashReceived || 0);
  const swap = Number(invoice.swapAmount || 0);
  const oldG = Number(invoice.oldGoldAmount || 0);
  doc.fillColor('#b00');
  if (disc) doc.text(`Discount: −₹${fmtMoney(disc)}`, { align: 'right' });
  if (cashR) doc.text(`Cash: −₹${fmtMoney(cashR)}`, { align: 'right' });
  if (swap) doc.text(`Swap: −₹${fmtMoney(swap)}`, { align: 'right' });
  if (oldG) doc.text(`Old Gold: −₹${fmtMoney(oldG)}`, { align: 'right' });
  doc.fillColor('#111').fontSize(12).text(`Bill Amount: ₹${fmtMoney(total)}`, { align: 'right' });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#333').text(`In words: ${numberToWords(Math.round(total))}`, { align: 'left' });
  if (invoice.notes) {
    doc.moveDown(0.3);
    doc.text(`Notes: ${invoice.notes}`, { width: 515 });
  }
  if (profile?.bankDetails) {
    doc.moveDown(0.3);
    doc.fontSize(9).text(`Bank: ${profile.bankDetails}`, { width: 515 });
  }
  doc.fontSize(10).fillColor('#7a2800').text('Thank you for your business!', 40, doc.page.height - 60, {
    align: 'center',
    width: 515,
  });

  doc.end();
  return bufPromise;
}
