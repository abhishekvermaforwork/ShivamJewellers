import * as invoiceService from '../services/invoice.service.js';
import { generateInvoicePdfBuffer } from '../services/invoicePdf.service.js';
import { Invoice } from '../models/Invoice.model.js';
import { ok, created } from '../utils/http.js';

export async function list(req, res) {
  const data = await invoiceService.listInvoices(req.userId, req.query);
  ok(res, data);
}

export async function getOne(req, res) {
  const data = await invoiceService.getInvoice(req.userId, req.params.id);
  ok(res, data);
}

export async function create(req, res) {
  const data = await invoiceService.createInvoice(req.userId, req.body);
  created(res, data);
}

export async function update(req, res) {
  const data = await invoiceService.updateInvoice(req.userId, req.params.id, req.body);
  ok(res, data);
}

/** PUT — same body rules as PATCH (full replacement of invoice fields when provided). */
export async function replace(req, res) {
  const data = await invoiceService.updateInvoice(req.userId, req.params.id, req.body);
  ok(res, data);
}

export async function downloadPdf(req, res) {
  const buf = await generateInvoicePdfBuffer(req.userId, req.params.id);
  const inv = await Invoice.findOne({ _id: req.params.id, user: req.userId }).select('invoiceNumber').lean();
  const num = inv?.invoiceNumber || 'invoice';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="invoice_${String(num).replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf"`,
  );
  res.send(buf);
}

export async function remove(req, res) {
  await invoiceService.deleteInvoice(req.userId, req.params.id);
  res.status(204).send();
}

export async function updateDueDate(req, res) {
  const data = await invoiceService.updateDueDate(req.userId, req.params.id, req.body.dueDate);
  ok(res, data);
}

export async function publicByToken(req, res) {
  const data = await invoiceService.getPublicInvoiceByToken(req.params.token);
  ok(res, data);
}
