import * as svc from '../services/advancePayment.service.js';
import { ok, created } from '../utils/http.js';

export async function list(req, res) {
  const data = await svc.listAdvancePayments(req.userId, req.query);
  ok(res, data);
}

export async function create(req, res) {
  const row = await svc.createAdvancePayment(req.userId, req.body);
  created(res, row);
}

export async function remove(req, res) {
  await svc.deleteAdvancePayment(req.userId, req.params.id);
  res.status(204).send();
}
