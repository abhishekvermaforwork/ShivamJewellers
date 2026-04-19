import * as paymentService from '../services/payment.service.js';
import { ok } from '../utils/http.js';

export async function history(req, res) {
  const data = await paymentService.listPaymentHistory(req.userId, req.query);
  ok(res, data);
}

export async function add(req, res) {
  await paymentService.addPayment(req.userId, req.params.invoiceId, req.body);
  ok(res, { recorded: true });
}

export async function markPaid(req, res) {
  await paymentService.markInvoicePaid(req.userId, req.params.invoiceId);
  ok(res, { status: 'paid' });
}

export async function markUnpaid(req, res) {
  await paymentService.markInvoiceUnpaid(req.userId, req.params.invoiceId);
  ok(res, { status: 'sent' });
}
