import * as svc from '../services/pettyExpense.service.js';
import { ok, created } from '../utils/http.js';

export async function list(req, res) {
  const data = await svc.listPettyExpenses(req.userId, req.query);
  ok(res, data);
}

export async function create(req, res) {
  const row = await svc.createPettyExpense(req.userId, req.body);
  created(res, row);
}

export async function remove(req, res) {
  await svc.deletePettyExpense(req.userId, req.params.id);
  res.status(204).send();
}
